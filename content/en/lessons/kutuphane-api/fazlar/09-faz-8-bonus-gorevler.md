---
title: Phase 8 — Bonus tasks
summary: "Docker, CI, Outbox, strongly-typed IDs, migrating to PostgreSQL and other advanced tasks."
---
Tasks you can pick to level up once you've finished the main project. Each one is independent; you can do them in any order.

| Task | What does it teach? |
| --- | --- |
| **Migrating to PostgreSQL** | You see the payoff of Clean Architecture in concrete terms: only Infrastructure and the configuration should change. Domain, Application and most of the tests shouldn't change at all |
| **Docker**: install Docker Desktop, containerize the application (the SDK's built-in container support via `dotnet publish`, or a multi-stage Dockerfile), SQL Server with docker compose | Containers, configuration through environment variables |
| Moving to **Testcontainers** | Tests running against the same database on every machine |
| CI with **GitHub Actions**: build + test on every push | Continuous integration |
| **Outbox pattern**: write domain events to a table in the same transaction and process them with a background service | Reliable messaging, `BackgroundService` |
| **Strongly-typed IDs** (BookId, MemberId…) | Tearing down the last stronghold of primitive obsession; passing the wrong id to the wrong place becomes a compile error |
| A v2 endpoint with **API versioning** (Asp.Versioning.Http) | Backward compatibility |
| A **refresh token** flow | Short-lived access tokens + long-lived refresh tokens, token revocation |
| A book details cache with **HybridCache** | In-memory + distributed cache, stampede protection |
| Comparing **.NET 10's built-in minimal API validation** with FluentValidation | Evaluating new framework features |
| Traces and metrics with **OpenTelemetry** | Modern observability |
