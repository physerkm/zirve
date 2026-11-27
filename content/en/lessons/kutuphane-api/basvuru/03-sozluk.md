---
title: Glossary
summary: Short explanations of the architecture and domain terms used in the guide.
---
| Term | Explanation |
| --- | --- |
| Aggregate | A cluster of objects that must stay consistent together, plus its entry point (the aggregate root). It is changed from outside only through the root |
| Entity | An object that has an identity (Id) and whose state changes over time |
| Value Object | An immutable object with no identity, defined by its values (Isbn, Email) |
| Domain Service | A stateless class that holds a business rule that doesn't belong to a single entity (LendingService) |
| Domain Event | A record of something important that happened in the domain (“loan created”) |
| Invariant | A rule that must always hold for an object (stock is never negative) |
| CQRS | Separating operations that change state (commands) from read operations (queries) |
| Repository | An abstraction that loads and adds aggregates as if they were a collection |
| Unit of Work | An abstraction that saves all the changes in an operation in one go |
| Port / Adapter | Port: an interface defined by an inner layer. Adapter: its implementation in an outer layer |
| Composition Root | The single place where all dependencies are wired together (Program.cs) |
| Decorator | A design pattern that wraps an object with the same interface to add behavior |
| Result Pattern | Expressing success or failure with a return value instead of an exception |
| ProblemDetails | The standard format for HTTP API error responses (RFC 9457) |
| Optimistic Concurrency | Checking, without taking a lock, whether the data was changed by someone else at the moment you save it (RowVersion) |
| Soft Delete | Marking a record as deleted instead of deleting it |
| Idempotent | Performing the same operation more than once gives the same result as performing it once (the seed operation) |
