---
title: Common .NET Backend Interview Questions
summary: The technical questions asked most often in .NET backend and full-stack interviews in Turkey and abroad, with short model answers, tips for take-home and live coding rounds, and which Zirve lesson to read while preparing for each question.
---

Interviews at big tech companies are heavy on algorithms and system design. For most .NET job postings in Turkey and Europe, though, the process usually looks like this: an HR screen, a **technical Q&A** round (language, framework, database, architecture), a **take-home assignment** or live coding, and finally a team and manager interview. This lesson collects the questions that come up most often in the technical Q&A round, along with short model answers. At the end of each section, the Zirve lesson that covers the topic in depth is noted.

Don't memorize the answers. Get to the point where you can explain each one **in your own words, with an example from your own project**. An interviewer spots a memorized answer immediately with the next "why?"

## C# and the runtime

**What's the difference between a value type and a reference type?**
A value type carries the data itself and is copied on assignment (`int`, `struct`). A reference type points to an object on the heap, and the reference is copied on assignment (`class`, `string`, arrays). → *C# › Value and Reference Types*

**Why is `string` immutable, and what are the consequences?**
For thread safety, reliability as a hash table key, and interning. The consequence: `+=` in a loop creates a new string every time, so you use `StringBuilder`.

**What's the difference between `class`, `struct`, and `record`?**
A class is a reference type with reference equality. A struct is a value type; it's copied and should be small and immutable. A record provides value equality and copying with `with`. → *C# › Modern C#*

**What's the difference between an `abstract class` and an `interface`?**
An abstract class can hold state (fields) and constructors, and there is single inheritance. An interface is a contract, and a class can implement more than one. Since C# 8, interfaces can also have default implementations. Use an interface to define the "what," an abstract class to share common behavior.

**What's the difference between `IEnumerable` and `IQueryable`?**
`IEnumerable` works in memory with LINQ to Objects. `IQueryable` carries an expression tree that the provider (EF Core) translates into SQL. Switching to `IEnumerable` too early causes the filter to run in memory. → *.NET › EF Core in Depth*

**What is deferred execution?**
A LINQ query runs not when it's defined but when it's iterated (`foreach`, `ToList`). Iterating the same query twice runs it twice. → *C# › Delegates, Lambdas, and LINQ*

**What are `IDisposable` and `using` for? How do they differ from a finalizer?**
They release unmanaged resources (connections, file handles) deterministically. `using` calls `Dispose` at the end of the block. A finalizer is a last safety net that runs whenever the GC gets to it, which is unpredictable, and it extends the object's lifetime.

**How does the GC work?**
It's generational: Gen 0, 1, 2, and the LOH for large objects. Most objects die young, and the young generation is collected frequently and cheaply. Unreachable objects are collected. → *C# › Performance and Memory*

**What does `async/await` do under the hood? Does it start a new thread?**
The compiler turns the method into a state machine. At the `await` point the thread is released, and execution continues when the work is done. No new thread is started for I/O operations. → *C# › async and await*

**Why are `.Result` and `.Wait()` dangerous?**
They block the thread. In ASP.NET Core this leads to thread pool starvation under load, and in environments with a `SynchronizationContext` it leads to deadlocks. → *C# › Concurrency*

**What's the difference between `Task` and `ValueTask`?**
`ValueTask` avoids an allocation when the result is usually available synchronously (a cache hit). It can only be awaited once. `Task` is the default choice.

**How do you ensure thread safety?**
I reduce shared state. When needed: `Interlocked`, `lock`, `SemaphoreSlim` in async code, concurrent collections, or `Channel`. → *C# › Concurrency*

**What is boxing?**
Copying a value type to the heap when it's used as an `object` or an interface. Generics prevent this.

## ASP.NET Core

**What is middleware, and why does order matter?**
The request passes through in order, and the response in reverse order. Authentication comes before authorization, and exception handling comes before everything else. → *.NET › The Request Pipeline and DI*

**What are the service lifetimes? What is a captive dependency?**
Singleton (application), scoped (request), transient (every resolution). A long-lived service must not hold onto a shorter-lived one. If you need a scoped service inside a singleton, use `IServiceScopeFactory`.

**What's the difference between a filter and middleware?**
Middleware runs on every request, independently of the endpoint. A filter is attached to specific endpoints and has access to model binding results.

**Minimal APIs or controllers?**
I list the trade-offs: Minimal APIs offer less code, AOT support, and speed. Controllers are familiar in large and older codebases. → *.NET › Web API Design*

**Why `IHttpClientFactory`?**
Creating an `HttpClient` every time leads to socket exhaustion, and a single static instance misses DNS changes. The factory pools and recycles the handlers.

**How do you run work in the background?**
`BackgroundService`. Hangfire or Quartz for persistent jobs, and a queue plus an outbox for messages that must not be lost. → *.NET › Background Jobs*

**How do you handle errors globally?**
Centrally, with `UseExceptionHandler` and `IExceptionHandler`, in `ProblemDetails` format. I log internal details without leaking them to the client.

**Configuration and secrets?**
The Options pattern and `ValidateOnStart`. Secrets live not in the repository but in user-secrets, environment variables, or Key Vault.

## API design and security

**What's the difference between PUT, PATCH, and POST? Which is idempotent?**
PUT replaces the whole resource and is idempotent. PATCH is partial. POST creates and is not idempotent. → *.NET › Web API Design*

**What's the difference between 401 and 403?**
Unauthenticated versus unauthorized.

**How do you prevent double payments?**
An idempotency key. The server stores the key along with its result.

**What is a JWT, and where should it be stored?**
A signed (not encrypted) token. It's suitable for service-to-service and mobile use. In the browser, `localStorage` is exposed to XSS; a BFF and an `HttpOnly` cookie are preferred. → *.NET › Authentication and Security*

**What's the difference between OAuth and OpenID Connect?**
OAuth is delegated authorization and issues an access token. OIDC adds identity and issues an ID token.

**How do you prevent SQL injection?**
Parameterized queries. EF Core and Dapper do this. I don't concatenate strings with `FromSqlRaw`.

**What is CORS?**
The server using headers to tell the browser whether to allow requests from another origin. It isn't a security feature; it's a mechanism for relaxing the browser's same-origin policy. `AllowAnyOrigin` can't be used together with credentials.

## Databases and EF Core

**What is the N+1 problem?**
One query for the list, plus one more for each element. It's solved with `Include` or a projection. → *.NET › EF Core in Depth*

**When do you use `AsNoTracking`?**
In read queries where nothing will be updated.

**Optimistic versus pessimistic concurrency?**
Optimistic: detect conflicts at write time with a version column (rowversion). Pessimistic: lock at read time (`SELECT ... FOR UPDATE`, `UPDLOCK`). Optimistic if conflicts are rare.

**Transaction isolation levels and anomalies?**
Read uncommitted, read committed, repeatable read, serializable. Dirty reads, non-repeatable reads, phantom reads. → *Databases › Transactions and Isolation*

**What's the difference between a clustered and a nonclustered index?**
A clustered index is the table itself, and there's only one. A nonclustered index is a separate structure. → *Databases › SQL Server and T-SQL*

**When does an index hurt?**
It slows down writes and takes up space. It's not used on low-selectivity columns. Too many indexes are costly on write-heavy tables. → *Databases › Indexes and Query Plans*

**Normalization and denormalization?**
Normalization prevents duplication and update anomalies. Denormalization is deliberate duplication for read performance. → *Databases › Data Modeling*

**EF Core or Dapper?**
EF Core for the write side and the domain model, Dapper or raw SQL for heavy reads and reports. The two can be used together.

**How do you choose between SQL and NoSQL?**
Based on the access pattern and the consistency requirements. → *Databases › NoSQL and Search*

## Architecture and distributed systems

**Explain SOLID with an example.**
You should be able to explain each principle with an example from your own project. The most frequently asked: single responsibility and dependency inversion. → *Computer Science Fundamentals › SOLID Principles*

**What is the dependency rule in Clean Architecture?**
Dependencies flow inward. The domain depends on nothing. → *.NET › Clean Architecture, Vertical Slice, and CQRS*

**What is CQRS, and does it require a separate database?**
Separating the read and write models. It doesn't.

**What is an aggregate in DDD?**
A group of objects that must stay consistent together. It's accessed through its root and kept small. → *.NET › Domain-Driven Design*

**Microservices or a monolith?**
A modular monolith unless there's a reason otherwise. Microservices are an organizational scaling tool. → *.NET › Modular Monoliths and Microservices*

**Distributed transactions in microservices?**
Sagas and compensating actions. Messages are published consistently with an outbox.

**What if the same message arrives twice from a message queue?**
At-least-once delivery is normal. The consumer is written to be idempotent. → *.NET › Messaging*

**RabbitMQ or Kafka?**
RabbitMQ for task queues and routing. Kafka for event streams, replay, and very high volume.

**How do you keep a cache consistent?**
TTLs, and on writes, update the database first, then delete the cache entry. Request coalescing against stampedes. → *.NET › Caching and Redis*

**The CAP theorem?**
When there's a network partition, you choose between consistency and availability. → *System Design › Consistency, Consensus, and Distributed Transactions*

**Retries and circuit breakers?**
Retry on transient errors, for idempotent operations, with jittered backoff. A circuit breaker stops piling load onto a failing dependency. → *.NET › Observability and Resilience*

## Testing, DevOps, and practices

**What's the difference between a unit test and an integration test? What do you mock?**
A unit test tests isolated behavior; an integration test tests components working together. I mock my own abstractions, not `DbContext`. → *.NET › Testing in .NET*

**What's the difference between Docker and a VM? Why a multi-stage build?**
A container shares the kernel and is lightweight. A multi-stage build keeps the SDK out of the final image. → *DevOps and Cloud › Docker*

**What's the difference between liveness and readiness in Kubernetes?**
If liveness fails, the pod is restarted; if readiness fails, traffic is cut off. → *DevOps and Cloud › Kubernetes Fundamentals*

**What should a CI/CD pipeline include?**
Build, tests, static analysis, security scanning, a single artifact, environments and approvals, rollback. → *DevOps and Cloud › CI/CD Pipelines*

**What's the difference between merge and rebase?**
→ *Engineering Practices › Git in Depth*

**How do you diagnose an endpoint that has slowed down in production?**
I use metrics to find the scope and traces to find where the time is spent. It's usually the database or an external call. If it's the code, I profile it. → *.NET › Observability and Resilience*, *DevOps and Cloud › Linux for Backend Developers*

## The take-home round

Most companies in Turkey ask for a take-home assignment with a few days' deadline: "Write an order API," "Build a library management system." The person reviewing the assignment looks more at **how it was written** than at whether it works. The *Practice Project: Library Management API* track on Zirve is a thorough rehearsal of exactly this kind of assignment.

What makes a difference in the review:

- **README:** how to run it (a single command, ideally `docker compose up`), what assumptions were made, which trade-offs were chosen, and what you would add given more time.
- **Delivered in working order.** A project that doesn't build or start usually gets rejected right there. Try it on a clean machine.
- **Tests:** at least unit tests for the business rules and one or two integration tests.
- **A reasonable, consistent structure.** Over-engineering also costs points. A small assignment doesn't need ten projects and five design patterns.
- **Correct HTTP usage, validation, error handling**, and no secrets in the repository.
- **A meaningful commit history.** Step-by-step progress instead of a single "initial commit."
- In the follow-up interview, be ready to defend your code and to answer "what would you do if we changed this?"

## The live coding round

- Apply the problem-solving method: clarify the question, think through examples, explain your approach, code, test. → *Interview › Problem-Solving Method for Coding Interviews*
- Common .NET-specific live coding tasks: transforming data with LINQ, a simple LRU cache, a thread-safe counter, a rate limiter, parsing and validating a JSON payload, refactoring existing code or finding a bug in it.
- Think out loud. A candidate who stays silent can't be evaluated.

## Your questions

At the end of the interview, "Do you have any questions?" is an evaluation opportunity. Good questions:

- "How does a feature go from idea to production? How often do you deploy?"
- "How does on-call work, and what did you learn from your last major incident?"
- "How do you prioritize technical debt?"
- "What does success look like in this role in the first three months?"
- "What are your code review and mentoring processes like?"

The answers tell you a lot about the company's engineering maturity.

## Summary

- The technical round of a .NET interview covers the language, the framework, databases, architecture, and practices. Every answer should be backed by your own example.
- Every question in this lesson ties to a topic covered in depth on Zirve. Go back to the lesson for the section you're weakest in.
- In the take-home, the README, a working delivery, tests, a reasonable structure, and a meaningful commit history are decisive.
- In live coding, the method and thinking out loud matter as much as the result.
- Your questions at the end of the interview let you evaluate the company.
