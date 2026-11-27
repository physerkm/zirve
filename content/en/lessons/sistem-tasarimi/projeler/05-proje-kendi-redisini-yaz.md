---
title: "Project 4: Write Your Own Redis"
summary: An in-memory key–value server that can talk to the real redis-cli. TCP and the RESP protocol, concurrent clients, TTL and expiration, LRU eviction, persistence with AOF, and leader–follower replication.
---

Redis is the component mentioned most often in system design interviews: cache, session store, rate limiter, leaderboard with sorted sets, pub/sub, locks. In this project you'll write a small but real copy of it. By the end, you'll answer questions like "Why is Redis so fast even though it's single-threaded?", "What's the difference between AOF and RDB?", and "Is replication asynchronous?" from experience, not from memory.

This project follows the same path as [CodeCrafters' Build your own Redis](https://codecrafters.io/challenges/redis) challenge; if you like, you can also progress using its automated tests. The stages below, however, focus on the points that are most instructive from a system design perspective.

## Goal

```text
$ redis-cli -p 6380
127.0.0.1:6380> SET user:42 "Ayşe" EX 60
OK
127.0.0.1:6380> GET user:42
"Ayşe"
127.0.0.1:6380> TTL user:42
(integer) 57
```

You can write the server in C#, Go, Rust, or TypeScript. As clients, you'll use the real `redis-cli` and `redis-benchmark`; that way protocol compatibility is tested automatically.

## Stage 1: TCP server and RESP

Redis clients speak **RESP** (Redis Serialization Protocol). It is text-based and simple:

```text
Client:   *2\r\n$3\r\nGET\r\n$7\r\nuser:42\r\n            → the array ["GET", "user:42"]
Server:   $5\r\nAyşe\r\n                                 → a 5-byte string (UTF-8 "Ayşe")
          +OK\r\n                                         → simple string
          :57\r\n                                         → integer
          $-1\r\n                                         → null
          -ERR unknown command\r\n                        → error
```

Note: the length prefix is in **bytes**, not characters ("Ayşe" is 4 characters, 5 bytes). Your parser must cope with data that arrives in pieces: TCP has no notion of message boundaries; one command can be split across two reads, or three commands can arrive in a single read (**pipelining**). In .NET, `System.IO.Pipelines` is designed for exactly this.

Start with `PING`, `ECHO`, `SET`, `GET`, `DEL`, `EXISTS`.

## Stage 2: the concurrency model

Thousands of clients will connect at once. Two options:

1. **A shared dictionary with locks:** each connection runs in its own task, and the data is protected by a `ConcurrentDictionary` or a lock.
2. **The Redis way: a single-threaded event loop.** Network I/O is asynchronous, while commands are executed one after another on a single thread (e.g., from a `Channel<Command>` queue). There are no locks, and every command is automatically **atomic**; you don't have to think about race conditions for `INCR`.

Try both and compare them with `redis-benchmark -p 6380 -t set,get -n 1000000 -c 50 -P 16`. Why is the single-threaded model usually fast enough? (Hint: the bottleneck isn't the CPU but network and memory access; commands take microseconds.) How much did pipelining (`-P 16`) increase throughput? This shows the cost of a network round trip.

## Stage 3: TTL and expiration

`SET ... EX`, `EXPIRE`, `TTL`, `PERSIST`. How are expired keys deleted?

- **Lazy deletion:** when a key is accessed, if it has expired, delete it and treat it as missing. Cheap, but keys that are never accessed stay in memory.
- **Active sampling:** like Redis does, a few times per second look at 20 random keys that have a TTL and delete the expired ones; if more than 25% of them had expired, repeat immediately.

Implement both together. Insert 1 million keys with a 1-second TTL and watch memory usage drop over time.

## Stage 4: memory limit and eviction

Add a `maxmemory` setting. When the limit is exceeded:

- `noeviction`: reject writes with an error.
- `allkeys-lru`: evict the least recently used key. True LRU is O(1) with a hash table + a doubly linked list (the classic [LRU Cache](/problems/lru-onbellek) problem). Redis, however, uses **approximate LRU** to save memory: it samples 5 random keys and evicts the oldest.

Implement both and compare their hit rates on a skewed access pattern (20% of keys receive 80% of requests). How much worse is approximate LRU?

## Stage 5: persistence (AOF)

Data must not be lost when the process restarts. **Append-only file:** append every write command in RESP format to the end of a file; on startup, replay the file from the beginning.

The real question is **when** to force writes to disk (`fsync`):

| Setting | Durability | Speed |
| --- | --- | --- |
| `always` | fsync after every command: no lost commands | Very slow |
| `everysec` | Once per second: at most ~1 second of loss on a crash | Redis's default |
| `no` | Leave it to the operating system | Fastest, loss is unpredictable |

Implement all three, measure write throughput with `redis-benchmark`, and kill the process with `kill -9` to count how many commands you lost. This table is the concrete form of the sentence "the trade-off between durability and latency".

**Bonus: rewriting.** The AOF grows forever (1 million `INCR`s on the same key). In the background, write the current state to a new file using the shortest sequence of commands, and swap it in for the old one. What do you need to do so you don't lose commands that arrive during the rewrite?

## Stage 6: leader–follower replication

Start a second server with `--replicaof localhost 6380`:

1. The follower connects to the leader and requests `PSYNC`.
2. The leader sends a **snapshot** of the current dataset, then **streams** every incoming write command to the follower.
3. The follower accepts reads only.

Observe and measure:

- **Replication lag:** how many milliseconds after a `SET` on the leader does it appear on the follower? Put the leader under artificial load; what happens to the lag?
- **The cost of asynchronous replication:** acknowledge a write on the leader, then kill the leader before it reaches the follower. Promote the follower to leader: was the write lost?
- **Partial resynchronization:** briefly cut the follower's connection. Does the leader resend all the data, or only the missed part? (Redis keeps a **replication backlog** and an offset for this; implement it.)
- Implement the `WAIT 1 100` command: let the client wait until its write has reached at least one follower. This is semi-synchronous replication chosen by the client.

## Bonus tasks

- **Data structures:** lists (`LPUSH`, `LRANGE`), sorted sets (`ZADD`, `ZRANGE`; with a skip list), and a leaderboard built with them.
- **Pub/Sub:** `SUBSCRIBE`, `PUBLISH`. What happens if a subscriber is slow? Implement an output buffer limit.
- **Transactions:** `MULTI`/`EXEC` and optimistic locking with `WATCH`.
- **Streams:** `XADD`, `XREADGROUP`; a small message queue with consumer groups and a pending entries list.
- **Cluster:** 16,384 slots, `CRC16(key) % 16384`, `MOVED` redirection.

## Completion criteria

- [ ] A server that works with `redis-cli` and `redis-benchmark`; pipelining support.
- [ ] Comparative benchmark results for the concurrency models.
- [ ] A speed/loss table for the AOF fsync settings.
- [ ] A replication lag measurement and a data loss experiment on leader crash.
- [ ] README: "What will I watch out for now when using Redis in a system design?"
