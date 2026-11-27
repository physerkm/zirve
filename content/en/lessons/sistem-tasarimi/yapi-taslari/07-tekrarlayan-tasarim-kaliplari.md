---
title: Recurring Design Patterns
summary: Most questions are a combination of a few patterns. Scaling reads, scaling writes, real-time updates, managing contention, long-running jobs, multi-step processes and large files; a decision tree for each.
---

There are hundreds of different system design questions, but they are all different combinations of the same few **patterns**. If you can ask "which patterns does this rely on?" when you hear the question, the skeleton of the design falls out on its own. This lesson is a reference page that gathers the building blocks from the previous lessons around these patterns.

| Pattern | Symptom | Example questions |
| --- | --- | --- |
| Scaling reads | High read/write ratio | URL shortener, news feed, product catalog |
| Scaling writes | Tens of thousands of writes per second | Metrics collection, chat, location updates, likes |
| Real-time updates | The user must see changes without refreshing | Chat, live scores, driver tracking, collaborative editing |
| Contention | Many concurrent requests for the same resource | Ticket sales, flash sales, auctions |
| Long-running jobs | The work takes longer than a few seconds | Video transcoding, report generation, bulk email |
| Multi-step processes | Multiple services, failures and compensation | Orders, payments, ride matching |
| Large files | Data in the MB–GB range | Video platform, file sync |

## 1. Scaling reads

Order matters; each step is more expensive than the one before:

1. **Queries and indexes:** fix the slow query, add the right composite index.
2. **Cache:** cache-aside, delete on write + TTL. For hot keys, an in-process cache and replicated keys.
3. **Read replicas:** mention replication lag and the read-your-own-writes problem.
4. **CDN and edge caching:** static content and content that is the same for everyone.
5. **Precomputation (denormalization):** prepare the result at write time instead of doing joins at read time. Fan-out on write in a news feed is an example.

## 2. Scaling writes

1. **Vertical scaling and batched writes:** combine writes and write them in batches instead of one by one.
2. **Buffering with a queue:** the queue absorbs spikes, and workers write at a steady rate.
3. **Write-optimized store:** LSM-based (Cassandra, ScyllaDB) or an append-only log (Kafka).
4. **Sharding:** a good partition key; salt hot keys.
5. **Accumulating in memory:** keep frequently changing values such as counters and locations in memory and persist them infrequently, if losing a few seconds of data is acceptable.

## 3. Real-time updates

There are two separate questions:

- **How do I deliver it to the client?** Polling → SSE → WebSocket (see [Networking, Communication and API Design](/tracks/sistem-tasarimi/ag-ve-api-tasarimi)).
- **How do I get the event to the right connection server?** Connections are spread across many servers:
  - **Pub/Sub** (Redis Pub/Sub, NATS): each connection server subscribes to the relevant channels. Simple and fast; messages are not persisted.
  - **Durable log** (Kafka): missed messages can be read again; latency is a bit higher.
  - **Connection registry:** a "which server is user X on?" mapping (Redis) and direct delivery to that server.

For offline clients a durable store is a must: when the client reconnects, it says "the last message ID I saw is this one, give me everything after it."

## 4. Contention

Many concurrent writes to the same record (the last seat, the last item in stock):

| Method | When |
| --- | --- |
| **Conditional atomic update** (`UPDATE ... WHERE status = 'available'`) | Single record, single database; the first choice in most cases |
| Optimistic locking (version column) | Conflicts are rare |
| Pessimistic locking (`SELECT ... FOR UPDATE`) | Conflicts are frequent, transactions are short |
| Timed reservation | The user's action takes minutes (checkout screen) |
| Distributed lock (+ fencing token) | The resource spans multiple systems |
| **Virtual waiting room / queue** | Demand is many times the capacity (concert tickets) |
| Routing to a single writer | All writes for a resource go to the same partition/worker and are processed in order |

Detailed example: [Ticket Booking System](/tracks/sistem-tasarimi/bilet-satis-sistemi).

## 5. Long-running jobs

Don't keep the user waiting for seconds:

1. The API accepts the request, puts the job on a queue and immediately returns `202 Accepted` + a job ID.
2. Workers take it from the queue and write progress to a status table.
3. The client polls the status or receives a notification (WebSocket, push, email) when it completes.

Things to watch for: idempotent workers, bounded retries, a dead-letter queue, job timeouts (if a worker dies, the job should move to another worker: the queue's **visibility timeout** or leasing), priority queues.

## 6. Multi-step processes

If steps such as order → payment → inventory → shipping live in different services:

- **Saga** (choreography or orchestration) and compensating actions.
- Event publishing with an **outbox**; **idempotent** consumers.
- **Durable workflow engines** (Temporal, AWS Step Functions) for long and complex flows: the engine stores the state of each step; even if the process crashes, it resumes from the step where it stopped, and timers ("cancel if payment doesn't arrive within 30 minutes") are built in.

Details: [Consistency, Consensus and Distributed Transactions](/tracks/sistem-tasarimi/tutarlilik-uzlasma-ve-dagitik-islemler).

## 7. Large files

- Files go to the object store, metadata to the database.
- **Direct** upload and download with presigned URLs; don't route them through the application server.
- Multipart, resumable uploads; block-level diffs for sync.
- Post-upload processing (scanning, transcoding) in event-triggered workers.
- Delivery from a CDN.

Details: [Search, Location and Large Files](/tracks/sistem-tasarimi/arama-konum-ve-buyuk-dosyalar).

## Recognizing patterns: example mappings

| Question | Dominant patterns |
| --- | --- |
| Instagram | Large files + scaling reads (feed) |
| WhatsApp | Real-time + scaling writes |
| Uber | Scaling writes (location) + real-time + contention (matching) + multi-step process |
| Ticketmaster | Contention + scaling reads (event page) |
| YouTube | Large files + long-running jobs (transcoding) + scaling reads (CDN) |
| Google Docs | Real-time + contention (concurrent editing: OT/CRDT) |
| Payment system | Multi-step process + idempotency + reconciliation |
| Metrics/monitoring system | Scaling writes + stream processing |

## Summary

When you hear the question:

1. Estimate the read/write ratio and volume → which scaling pattern?
2. What must the user see **instantly** → do you need the real-time pattern?
3. Is there a race for the same resource → the contention pattern.
4. Is there work that takes longer than a few seconds or spans multiple services → queue, saga, workflow.
5. Is there large binary data → object store + CDN.

Once you recognize these patterns, design stops being memorization, and you can solve a new question with the same tools.

**Further reading:** Hello Interview, [System Design in a Hurry: Patterns](https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns) (a free and very good explanation of the pattern approach).
