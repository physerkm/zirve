---
title: "Project 1: Scalable URL Shortener and Load Testing"
summary: Actually build the URL shortener design with .NET, PostgreSQL, Redis and Docker, and measure it under load with k6. A range-allocating ID generator, cache-aside, horizontal scaling, a read replica, queue-based analytics, and chaos tests.
---

In this project you'll build the design from the [URL Shortener](/tracks/sistem-tasarimi/url-kisaltici) lesson step by step and see the effect of each step **in numbers**. The goal isn't a working service; it's being able to say "I added a cache, p99 latency dropped from 38 ms to 4 ms, and the bottleneck moved from the database connection pool to the Redis network round trip."

## Technology

| Component | Choice |
| --- | --- |
| Service | .NET 10 Minimal API (or Node/TypeScript or Go if you prefer) |
| Database | PostgreSQL 18 |
| Cache | Redis (StackExchange.Redis) |
| Load balancer | nginx |
| Load testing | [k6](https://grafana.com/docs/k6/latest/) |
| Observability | OpenTelemetry + the .NET Aspire dashboard, or Prometheus + Grafana |
| Environment | Docker Compose |

## Stage 0: design document

Before writing any code, write a one-page `DESIGN.md`: requirements, capacity estimate, API, data model, the code generation method, and why you chose it. At the end of the project you'll compare this document against real measurements.

## Stage 1: the simplest working version

Two endpoints: `POST /v1/links` and `GET /{code}` (302 redirect). One service, one PostgreSQL.

```sql
CREATE TABLE links (
    code        text PRIMARY KEY,
    long_url    text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz
);

-- ID blocks: each nextval call returns the start of a new block of 1,000.
CREATE SEQUENCE link_id_blocks INCREMENT BY 1000;
```

**ID generator:** each service instance takes a block of 1,000 with `SELECT nextval('link_id_blocks')` and generates IDs without asking the database until the block runs out. To make sequential IDs unpredictable, scramble the ID reversibly before encoding it:

```csharp
public static class ShortCode
{
    private const string Alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const long Mask = (1L << 41) - 1;       // 2^41 < 62^7: the result is at most 7 characters
    private const long Multiplier = 0x5DEECE66DL;   // odd number -> invertible (bijective) mod 2^41

    public static string FromId(long id)
    {
        var scrambled = unchecked(id * Multiplier) & Mask; // overflow wraps mod 2^64, the mask takes mod 2^41
        Span<char> buffer = stackalloc char[7];
        var position = buffer.Length;

        do
        {
            buffer[--position] = Alphabet[(int)(scrambled % 62)];
            scrambled /= 62;
        }
        while (scrambled > 0);

        return new string(buffer[position..]);
    }
}
```

Multiplying by an odd number is a **one-to-one** mapping modulo a power of 2: two different IDs never land on the same code, so no collision check is needed. This is not encryption; it only makes sequential enumeration harder.

**Definition of done:** unit tests (the same ID is never generated twice, codes are ≤ 7 characters), one end-to-end integration test.

## Stage 2: first measurement

Before load testing, prepare the **test data**: create 1 million links and write their codes to a file. Real traffic is skewed: a small number of links get most of the clicks. Imitate this with a power law in the k6 script:

```javascript
import http from 'k6/http';
import { check } from 'k6';

const codes = JSON.parse(open('./codes.json'));

export const options = {
  scenarios: {
    redirects: {
      executor: 'constant-arrival-rate', // not a closed loop, a constant incoming request rate
      rate: 2000,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 300,
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<50'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Math.random() ** 3 clusters around small indexes: the first links are very popular.
  const code = codes[Math.floor(codes.length * Math.random() ** 3)];
  const res = http.get(`http://localhost:8080/${code}`, { redirects: 0 });
  check(res, { 'redirect': (r) => r.status === 302 });
}
```

`constant-arrival-rate` matters: instead of a fixed number of virtual users, it produces a fixed **request rate**. When the system slows down, the load doesn't drop; requests pile up as they do in the real world, and you see the queueing delay.

Increase the rate gradually (500, 1,000, 2,000, 4,000 …) and fill in one row at each step:

| Stage | Target RPS | Achieved RPS | p50 | p99 | Error % | CPU (API / DB) | Bottleneck |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2: DB only | | | | | | | |
| 3: + Redis | | | | | | | |
| 4: 3 instances | | | | | | | |
| 5: + read replica | | | | | | | |

**Find the bottleneck.** When the system saturates, where is time spent waiting? The Npgsql connection pool (`Max Pool Size`), PostgreSQL CPU, the thread pool, the network? Use `EXPLAIN ANALYZE` to confirm the redirect query uses the index.

## Stage 3: cache-aside

```csharp
app.MapGet("/{code}", async (string code, IDatabase redis, NpgsqlDataSource db) =>
{
    var key = $"link:{code}";
    var cached = await redis.StringGetAsync(key);
    if (cached.HasValue)
    {
        return cached == "-" ? Results.NotFound() : Results.Redirect(cached.ToString(), permanent: false);
    }

    await using var command = db.CreateCommand(
        "SELECT long_url FROM links WHERE code = $1 AND (expires_at IS NULL OR expires_at > now())");
    command.Parameters.Add(new NpgsqlParameter { Value = code });
    var url = (string?)await command.ExecuteScalarAsync();

    // Briefly cache nonexistent codes too ("-"): protects against nonexistent-key attacks.
    var ttl = url is null ? TimeSpan.FromMinutes(1) : TimeSpan.FromHours(24) + TimeSpan.FromSeconds(Random.Shared.Next(0, 600));
    await redis.StringSetAsync(key, url ?? "-", ttl);

    return url is null ? Results.NotFound() : Results.Redirect(url, permanent: false);
});
```

The random margin (jitter) added to the TTL keeps keys written at the same time from expiring at the same time.

**Measure:** cache hit rate (Redis `INFO stats` → `keyspace_hits` / `keyspace_misses`), the change in p99, database CPU. Then limit the cache size (`maxmemory 50mb`, `maxmemory-policy allkeys-lru`) and see that the hit rate stays high thanks to the skewed distribution.

## Stage 4: horizontal scaling

Put the API behind nginx with three instances:

```yaml
services:
  api:
    build: .
    deploy:
      replicas: 3
    environment:
      ConnectionStrings__Db: Host=postgres;Database=links;Username=app;Password=app;Maximum Pool Size=50
      ConnectionStrings__Redis: redis:6379
  nginx:
    image: nginx:1.29
    ports: ["8080:80"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: links
  redis:
    image: redis:8
```

Verify: is the service stateless? Does each instance get its own ID block? Does the sum of the three instances' connection pools exceed PostgreSQL's `max_connections` limit? (If it does, add PgBouncer; this is one of the most common bottlenecks in real life.)

## Stage 5: read replica

Add a replica with PostgreSQL streaming replication; send redirect reads to the replica and writes to the primary. Then **see replication lag with your own eyes:** try reading from the replica right after creating a link. When do you get a 404? Implement a fix: read newly created codes from the primary for a few seconds, or write them to the cache at creation time.

## Stage 6: queue-based analytics

Emit a click event on every redirect. First, write it to the database **synchronously** inside the redirect request and measure p99. Then drop the event into Redis Streams (or RabbitMQ/Kafka) and batch-write it in a separate consumer process. Add the difference to the table.

Stop the consumer: does redirecting keep working? Restart the consumer: are the accumulated events processed? If the same event is processed twice, does the count break? (Write idempotently using the event ID.)

## Stage 7: chaos and observability

- Collect request traces with OpenTelemetry; see in the trace how much time a redirect spends in Redis and PostgreSQL.
- `docker compose stop redis`: does the service slow down but keep working (fail-open)? Did you put a short timeout on Redis calls?
- `docker compose pause postgres`: how long do requests wait? Add a timeout and a circuit breaker (`Microsoft.Extensions.Http.Resilience` or Polly).
- Kill one API instance: does nginx shift traffic to the others via health checks?

## Bonus tasks

- A per-IP rate limit for `POST /v1/links` (a bridge to Project 2).
- A background job that deletes expired links in bulk.
- Custom aliases: race-free inserts with a unique constraint; test with two clients requesting the same alias at the same time.
- Compare 301 with 302: on the second click in the browser, does a request reach the server?

## Completion criteria

- [ ] `DESIGN.md`: the design, trade-offs, and a **comparison of estimates against measurements**.
- [ ] A filled-in measurement table and an explanation of the bottleneck at each stage.
- [ ] An environment that comes up with a single `docker compose up` command, and the k6 scripts.
- [ ] A "what I learned" section in the README: what was the most surprising finding?
