---
title: Capacity Estimation and the Numbers You Should Know
summary: Back-of-the-envelope math. Powers of two, latency numbers, the real capacity of a single machine, and estimating QPS, storage, bandwidth, memory and server count in a few minutes.
---

The goal of capacity estimation (back-of-the-envelope math) is not to find the exact number but to **make the right decision**: is a single database enough, is a cache required, do you need to shard the data, how many servers do you need? If a calculation doesn't answer one of these questions, skip it.

This lesson gives you the numbers you can use from memory in an interview and a quick way to calculate.

## Method: round, work with exponents

- Round numbers to **powers of 10**: 86,400 seconds → 10⁵, a month of 2.6 million seconds → 2.5 × 10⁶.
- Multiply and divide with exponents: 10⁸ requests / 10⁵ seconds = 10³ requests/second.
- State your assumptions **out loud** and write them down; if the interviewer gives you a different number, you can update the result quickly.
- Tie the result to a decision: "~1,000 QPS; two or three servers and a single PostgreSQL can handle that."

## Powers of two and units

| Power | Approximately | Name |
| --- | --- | --- |
| 2¹⁰ | 1 thousand | 1 KB |
| 2²⁰ | 1 million | 1 MB |
| 2³⁰ | 1 billion | 1 GB |
| 2⁴⁰ | 1 trillion | 1 TB |
| 2⁵⁰ | 1 quadrillion | 1 PB |

Data type sizes: `int` 4 bytes, `long` / timestamp 8 bytes, UUID 16 bytes, ASCII character 1 byte (in UTF-8, letters such as Turkish ş or ğ take 2 bytes). A typical JSON record ranges from a few hundred bytes to a few KB; a small image is ~100 KB–1 MB, a minute of HD video ~50–100 MB.

## Time

| | Value | Shortcut |
| --- | --- | --- |
| Seconds in a day | 86,400 | ≈ 10⁵ |
| Seconds in a month | ~2.6 million | ≈ 2.5 × 10⁶ |
| Seconds in a year | ~31.5 million | ≈ 3 × 10⁷ |
| 1 million requests per day | ~12 / second | |
| 1 billion requests per month | ~400 / second | |

## Latency numbers

An up-to-date take on the table popularized by Jeff Dean. The absolute values change with hardware; what matters is **the orders of magnitude between them**.

| Operation | Time | What it means |
| --- | --- | --- |
| L1 cache access | ~1 ns | |
| Branch mispredict | ~3 ns | |
| L2 cache access | ~4 ns | |
| Mutex lock/unlock | ~20 ns | |
| Main memory read | ~100 ns | ~100 times slower than L1 |
| Compress 1 KB (fast algorithm) | ~2 µs | |
| Read 1 MB sequentially from memory | ~3 µs | |
| Random 4 KB read from SSD | ~20–100 µs | ~1,000 times slower than memory |
| Round trip within the same data center | ~500 µs | |
| Read 1 MB sequentially from SSD | ~50 µs–1 ms | |
| Disk (HDD) seek | ~2–10 ms | |
| Read one key from Redis (including network) | ~0.5–1 ms | |
| Simple indexed SQL query | ~1–5 ms | |
| Round trip within the same continent | ~20–40 ms | |
| Intercontinental round trip | ~150 ms | Speed-of-light limit; can't be optimized |

Takeaways:

- **Memory is fast, disk is slow, the network is slower still.** A request's duration is driven mostly by network round trips and disk accesses.
- Sequential reads are much faster than random reads; that's why log-structured stores, Kafka and LSM trees make writes sequential.
- A network call within the same data center is ~0.5 ms; making 50 service calls **sequentially** within one request adds 25 ms on its own. Parallelize the calls or reduce them.
- Intercontinental latency is a law of physics. If global users need low latency, you bring the data closer to them: CDNs, regional replicas, edge caches.

## How much work a single machine does

The most common mistake in interviews is **underestimating** the capacity of a single machine. An ordinary server today:

| Component | Rough capacity |
| --- | --- |
| Application server (simple JSON API) | a few thousand – tens of thousands of requests/second |
| PostgreSQL / MySQL (single node, indexed reads) | ~10,000 – 50,000 queries/second |
| PostgreSQL / MySQL (writes) | ~a few thousand – 10,000+ transactions/second |
| Redis (single node) | ~100,000+ operations/second, latency < 1 ms |
| Kafka (single broker) | hundreds of thousands – a million messages/second |
| Server memory | 64 GB – 1 TB+ |
| Single-machine SSD | a few TB – tens of TB |
| Network card | 10 – 100 Gbit/s |

These numbers tell you that up to a few thousand requests per second, most systems run on **a single well-configured database**. Sharding comes up when a real necessity arises, such as tens of TB of data or tens of thousands of writes per second.

## The four basic calculations

### 1. Request rate (QPS)

```text
average QPS = daily active users × operations per user per day / 10⁵
peak QPS    = average QPS × (2 … 10)
```

Calculate reads and writes separately; the read/write ratio drives the caching and replication decision.

### 2. Storage

```text
daily storage = new records per day × record size
total         = daily × 365 × years retained × number of replicas (usually 3)
```

Calculate media (images, video) **separately** from metadata: metadata goes to the database, media to object storage, and their orders of magnitude are very different.

### 3. Bandwidth

```text
ingress = write QPS × average request size
egress  = read QPS × average response size
```

In video and image services, egress bandwidth is most of the cost; the CDN decision comes from here.

### 4. Memory (cache)

The 80/20 rule: ~80% of requests go to ~20% of the data. Caching 20% of the data read per day is often a good starting point.

```text
cache size ≈ daily reads × response size × 0.2
```

## Worked example: a photo-sharing app

Assumptions: 500 million daily active users, 0.2 photo uploads and 30 photo views per user per day. A photo averages 500 KB (including its different sizes), metadata is 1 KB.

**QPS:**

- Uploads: 500 × 10⁶ × 0.2 = 10⁸ / day → 10⁸ / 10⁵ = **~1,000 / second**, ~3,000 at peak.
- Views: 500 × 10⁶ × 30 = 1.5 × 10¹⁰ / day → **~150,000 / second**, ~500,000 at peak.
- Read/write ratio 150:1. **Conclusion:** the read path is everything; a CDN and caching are mandatory.

**Storage:**

- Media: 10⁸ × 500 KB = 5 × 10¹³ bytes = **50 TB / day** → ~18 PB per year. **Conclusion:** object storage (S3-like), not a database.
- Metadata: 10⁸ × 1 KB = 100 GB / day → ~36 TB per year. **Conclusion:** it won't fit on a single machine within a few years; the metadata will be sharded.

**Bandwidth:**

- Egress: 150,000 × 500 KB = 75 GB/s ≈ 600 Gbit/s. **Conclusion:** it can't be served from the origin server; the CDN has to handle most of the traffic.

**Cache:** metadata reads 150,000 / second × 1 KB × 10⁵ seconds × 0.2 ≈ 3 TB. **Conclusion:** a distributed cache cluster (e.g. dozens of Redis nodes).

This five-minute calculation produced the skeleton of the design: object storage + CDN, a sharded metadata database, a distributed cache, and separate read and write paths.

## Estimating the number of servers

```text
number of servers = peak QPS / QPS one server handles × safety margin (~1.5–2)
```

To handle 150,000 peak QPS with servers that each handle 5,000 requests per second, you need 30 servers, or ~50–60 with a safety margin. This number doesn't change the design, so in an interview it usually takes a single sentence.

## Availability budget

| Target | Downtime per year | Downtime per month |
| --- | --- | --- |
| 99% | ~3.65 days | ~7.3 hours |
| 99.9% | ~8.8 hours | ~44 minutes |
| 99.99% | ~53 minutes | ~4.4 minutes |
| 99.999% | ~5.3 minutes | ~26 seconds |

For serial dependencies, availabilities multiply (0.999³ ≈ 0.997); for parallel redundancy, failure probabilities multiply: the probability that at least one of two independent replicas, each 99% available, is up is 1 − 0.01² = 99.99%.

## Common mistakes

- **Spending minutes on calculations that don't affect the design.** Compute the number, state the decision, move on.
- **Forgetting the peak.** A system sized for average load crashes on the first day of a campaign.
- **Forgetting replicas and indexes.** Raw data × 3 replicas × index overhead is the real storage.
- **Underestimating a single machine.** Proposing sharding for 500 QPS shows you don't know the numbers.
- **Mixing up units.** A bit/byte error (Gbit/s ↔ GB/s, a factor of 8) or a KB/MB error shifts the design by an order of magnitude.

## Summary

- 1 day ≈ 10⁵ seconds; 1 million requests per day ≈ 12 QPS.
- Memory ~100 ns, SSD ~100 µs, round trip within a data center ~0.5 ms, intercontinental ~150 ms.
- A single database handles tens of thousands of reads per second; Redis handles hundreds of thousands.
- QPS, storage, bandwidth and memory: four calculations, each tied to a decision.

**Further reading:** [Colin Scott's interactive latency table, by year](https://colin-scott.github.io/personal_website/research/interactive_latency.html) and the System Design Primer's [back-of-the-envelope section](https://github.com/donnemartin/system-design-primer#appendix).
