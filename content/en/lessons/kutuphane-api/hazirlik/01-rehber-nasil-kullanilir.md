---
title: How to use this guide
summary: The structure of the phases, the working loop, finding severity levels and the project roadmap.
---
> **An end-to-end .NET 10 Minimal API — with Clean Architecture, Clean Code and best practices.** This guide contains not a single line of C# code. It tells you what to do, why to do it and how to test it; you write the code.

> **Info:** The guide is written in the voice of someone reviewing your code. The “I” in the text is the person doing the review: a mentor, a teammate or an AI assistant that can read your code. If you're working alone, use each phase's acceptance criteria and its “What I'll look at in review” list to check your own work.

This document is a roadmap for you to write a working Web API from scratch. **It contains no C# code.** At each step you'll find what to build, which rules to follow, how to test it and what I'll look at in review. Terminal commands are given only for setup steps such as creating projects, adding packages and migrations; these are not application code.

## 1.1 The structure of each phase

| Section | Contents |
| --- | --- |
| Goal / What you'll learn | Why the phase exists and which concepts it will give you |
| Tasks | The classes you need to write, their responsibilities and rules. Class and method names are suggested; their bodies are up to you |
| Acceptance criteria | The conditions that must be met for the phase to count as “done” (boxes you can tick) |
| Test it yourself | Scenarios to try manually or automatically, and the expected results |
| What I'll look at in review | The points I'll pay particular attention to when checking. Knowing them in advance helps you make fewer mistakes |

## 1.2 The working loop

1. Read the whole phase from start to finish; picture what you'll build before you start coding.
2. Write the code. If you get stuck, look at the Microsoft Learn documentation first ([Resources](/tracks/kutuphane-api/kaynaklar)). Then you can ask me about the concept: you can ask for explanations and direction, not code.
3. `dotnet build` must finish with **zero warnings and zero errors**; `dotnet test` must be fully green.
4. Commit your changes. Suggested message: `feat(phase-1): domain layer and unit tests`.
5. Write to me **“Phase 1 is done, please review”**. I'll read your code, run the build and the tests, and write up my findings.
6. Fix the findings and ask for another review. Once there are no Critical or Important findings left, move on to the next phase.

> **Info:** During review I don't fix your code and I don't hand you ready-made code. For each finding I write the file and line, what the problem is, why it's a problem and a hint about which direction to take. You can adjust the level by saying “give me more hints” or “just tell me which file it's in”.

## 1.3 Finding severity levels

| Level | Meaning | What should you do? |
| --- | --- | --- |
| **Critical** | A bug, a security vulnerability, data loss or a broken business rule | Don't move on to the next phase without fixing it |
| **Important** | An architecture violation, a layer leak, usage that goes against best practices | Fix it; if you have a reason, let's discuss it |
| **Suggestion** | Readability, naming, small simplifications | Optional |

## 1.4 Roadmap

| Phase | Topic | What you'll have at the end of the phase |
| --- | --- | --- |
| 0 | Solution skeleton | An empty solution with strict rules that compiles; test projects ready |
| 1 | The Domain layer | A rich model that protects the business rules, unit tests, architecture tests |
| 2 | The Application layer | All use cases, validation and logging decorators, handler tests |
| 3 | The Infrastructure layer | EF Core, migrations, seed data, password and token infrastructure |
| 4 | The API layer (Minimal API) | Author and book endpoints, consistent error responses, OpenAPI and Scalar |
| 5 | Authentication and authorization | JWT login, roles, rate limiting, the end-to-end loan flow |
| 6 | Cross-cutting concerns | Structured logging, health checks, CORS, output cache |
| 7 | Integration and architecture tests | End-to-end tests against a real database, a concurrency test, a coverage report |
| 8 | Bonus | Docker, CI, Outbox, strongly-typed IDs, migrating to PostgreSQL… |
