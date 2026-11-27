---
title: Phase 6 — Cross-cutting concerns
summary: Structured logging, traceability, health checks, CORS and output caching.
---
| Phase summary |  |
| --- | --- |
| **Goal** | Make the application observable and production-ready. |
| **What you'll learn** | Structured logging, request logging, trace ids, domain event handlers, health checks, CORS, output caching, environment-specific configuration. |
| **What you'll have at the end** | An API that produces logs explaining what it does, reports its health and runs with secure defaults. |

## Tasks

### 6.1 Serilog

- Set up Serilog so that it reads its configuration from `appsettings.json`; the Console sink is enough.
- Add the request logging middleware: a one-line summary log per request (method, path, status, duration).
- Raise the log level of the `Microsoft.*` and `System.*` sources to Warning to cut down the noise.
- Use **message templates** in your messages, not string interpolation; that way the values are stored as separate fields.

> **Warning:** Sensitive information such as passwords, tokens and connection strings must never be logged. Make sure the LoggingDecorator doesn't log the entire command: LoginCommand contains a password!

### 6.2 Traceability

Every log line and every ProblemDetails response should carry the same trace id. Given the `traceId` in an error response, you should be able to find all the logs for that request.

### 6.3 Domain event handlers

- `LoanCreatedDomainEvent` → a “Loan notification sent to member” log (we don't send real emails).
- `LoanReturnedDomainEvent` → if there is a fee, a fee log at Warning level.
- `MemberRegisteredDomainEvent` → a welcome notification log.

### 6.4 Health checks

- A `/health` endpoint: it should include a database check and return the result as JSON.
- Bonus: separate `/health/live` (is the application just up?) and `/health/ready` (including the database). Find out why this split is made (Kubernetes liveness and readiness).

### 6.5 CORS

Write a named CORS policy; read the allowed origins from configuration. In Development, allow a frontend address such as `http://localhost:5173`. Never use the “all origins + credentials” combination.

### 6.6 Output caching (optional)

- Cache the `GET /books` and `GET /books/{id}` responses with the `books` tag.
- Invalidate (evict) this tag after creating, updating, adding copies to or deleting a book, and after a loan or a return. Why do loans and returns affect the book cache? Think about it.

### 6.7 Production security

- Enable HTTPS redirection and HSTS in production.
- Validate all Options classes at startup; with missing configuration, the application should not start at all.

## Test it yourself

1. Borrow a book and see the request log, the decorator log and the domain event log in the console, in that order.
2. Search the console logs for the `traceId` from an error response.
3. `/health` → 200 Healthy. Temporarily break the server name in the connection string and try again → 503 Unhealthy.
4. Send a login request and confirm that the password doesn't appear in the logs.
5. If the output cache is on: send the same GET twice and confirm from the EF logs that the second one didn't hit the database; update the book and send the GET again, and you should get the new data.

## Acceptance criteria

- [ ] No sensitive data in the logs.
- [ ] Log messages are structured (they use message templates).
- [ ] The health check accurately reflects the state of the database.
- [ ] With required configuration missing, the application stops at startup with a clear error.
