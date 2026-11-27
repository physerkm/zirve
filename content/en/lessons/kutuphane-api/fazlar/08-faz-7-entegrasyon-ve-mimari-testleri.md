---
title: Phase 7 — Integration and architecture tests
summary: End-to-end tests against a real database, a concurrency test and code coverage.
---
| Phase summary |  |
| --- | --- |
| **Goal** | Test the API end to end and automatically, against a real database. |
| **What you'll learn** | WebApplicationFactory, test environment configuration, replacing services, test isolation, xUnit fixtures, time travel with FakeTimeProvider, concurrency testing, code coverage. |
| **What you'll have at the end** | A stable (non-flaky), order-independent test suite that runs with a single command. |

## Tasks

### 7.1 Test server

- Write a `LibraryApiFactory` that derives from `WebApplicationFactory<Program>`.
- Set the environment to `Testing`; point the connection string at a separate LocalDB database (`LibraryDb_Tests`).
- Replace `TimeProvider` with a `FakeTimeProvider` (via the method for configuring test services) and expose it so the tests can reach it.
- At the start of the test run, delete the database and apply the migrations. Use migrations, not `EnsureCreated`; that way the migrations themselves get tested too.
- Share the factory across tests with xUnit's fixture mechanism; don't spin up a new server for every test.

> **Tip:** The test project not being able to access the `Program` class is a classic problem. If you get an error, search for: “WebApplicationFactory Program class accessibility”.

### 7.2 Authentication helpers

Write helper methods for the tests that get a token from the real register and login endpoints (e.g. “create a new member and return their token”). That way the identity flow gets tested too.

### 7.3 Test isolation

- Each test should create its own data: write helpers that generate a random ISBN (with a valid check digit!) and a random email.
- Tests must not depend on each other's data or on execution order.
- Bonus: quickly clean the tables between tests with the Respawn package.

### 7.4 Scenarios

- At least one integration test for each row in the Phase 4 and Phase 5 test tables.
- **Overdue flow:** borrow a book → advance the `FakeTimeProvider` by 17 days → the loan shows up in the overdue list → a new loan is rejected → the return fee is 15.00.
- **Concurrency:** send loan requests for a book with a single copy from two different members at the same time (in parallel). One should get 201, the other 409, and the book's stock must never go negative. This test is the proof that RowVersion really works.
- Verify response bodies by their content as well, not just the status code (error code, fields).

### 7.5 Extend the architecture tests

- Handlers are sealed and their names end with `Handler`.
- Endpoint classes in Api don't depend on Infrastructure.
- Domain entities have no public setters (with NetArchTest or plain reflection).
- Repositories in Infrastructure are not public.

### 7.6 Code coverage

```bash
dotnet test --collect:"XPlat Code Coverage"
```

Targets: Domain 90%+, Application 80%+. You can look into the ReportGenerator tool to make the report readable. Coverage is an indicator, not a goal: use it to find important paths that aren't tested.

## Acceptance criteria

- [ ] `dotnet test` runs all tests (unit, architecture, integration) with a single command, and they're all green.
- [ ] The test suite is still green when run 3 times in a row (no flaky tests).
- [ ] The concurrency test passes.
- [ ] No test depends on the real clock.

## What I'll look at in review

- Data dependencies between tests
- Shallow tests that only check the status code
- Tests that wait using `Task.Delay`
- Shared (static) state polluting tests
- Readability of test names
