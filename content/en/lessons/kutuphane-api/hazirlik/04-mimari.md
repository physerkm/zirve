---
title: Architecture
summary: Clean Architecture layers, the dependency rule, the folder structure and the key design decisions.
---
## 4.1 Layers and the dependency rule

Clean Architecture has one fundamental rule: **dependencies always point inward.** Inner layers don't know about outer layers. The Domain depends on nothing; database, web and framework details live at the outermost edge.

| Layer | Project | Responsibility | Can reference |
| --- | --- | --- | --- |
| Domain | Library.Domain | Entities, value objects, domain events, error definitions, business rules. No NuGet packages | Nothing |
| Application | Library.Application | Use cases (command and query handlers), DTOs, validators and the interfaces to the outside world (ports) | Domain |
| Infrastructure | Library.Infrastructure | EF Core, repositories and read services, password hashing, JWT generation, interceptors | Application |
| Presentation | Library.Api | Minimal API endpoints, middleware, error mapping, authentication settings; the application's composition root | Application, Infrastructure |

> **Warning:** Api references Infrastructure only so that `Program.cs` can call Infrastructure's service registration method. Endpoints never use Infrastructure types (the DbContext, repository classes) directly. You'll verify this automatically with the architecture tests you write in Phase 1.

## 4.2 Folder structure

You'll group the code **by business feature** (feature folders), not by technical type (Services, Models, Controllers). A use case's command, handler and validator live in the same folder.

```text
LibraryApi/
├── Library.slnx
├── global.json  ·  Directory.Build.props  ·  Directory.Packages.props
├── .editorconfig  ·  .gitignore
├── src/
│   ├── Library.Domain/
│   │   ├── Abstractions/      Entity, IDomainEvent, Error, Result, interfaces
│   │   ├── Authors/           Author, AuthorErrors
│   │   ├── Books/             Book, Isbn, BookErrors
│   │   ├── Members/           Member, Email, Role, MemberErrors, events
│   │   └── Loans/             Loan, LendingService, LendingPolicy, LoanErrors, events
│   ├── Library.Application/
│   │   ├── Abstractions/      Messaging, Data, Authentication, Behaviors, Paging
│   │   ├── Authors/           Create/  Update/  Delete/  GetById/  List/
│   │   ├── Books/             Create/  Update/  AddCopies/  Delete/  GetById/  Search/
│   │   ├── Members/           Register/  Login/  GetCurrent/  List/  Deactivate/
│   │   ├── Loans/             Borrow/  Extend/  Return/  GetMine/  ListOverdue/
│   │   └── DependencyInjection.cs
│   ├── Library.Infrastructure/
│   │   ├── Persistence/       DbContext, Configurations/, Interceptors/,
│   │   │                      Repositories/, ReadServices/, Migrations/, Seeding/
│   │   ├── Authentication/    JwtOptions, TokenProvider, PasswordHasher
│   │   ├── DomainEvents/      DomainEventsDispatcher
│   │   └── DependencyInjection.cs
│   └── Library.Api/
│       ├── Endpoints/         IEndpoint, Auth/, Authors/, Books/, Members/, Loans/
│       ├── Extensions/        Result → HTTP mapping, endpoint registration helpers
│       ├── Infrastructure/    GlobalExceptionHandler, UserContext, OpenAPI transformer
│       ├── Library.Api.http
│       └── Program.cs
└── tests/
    ├── Library.Domain.UnitTests/
    ├── Library.Application.UnitTests/
    ├── Library.Api.IntegrationTests/
    └── Library.ArchitectureTests/
```

## 4.3 Key design decisions

| Topic | Choice | Why? |
| --- | --- | --- |
| API style | Minimal API + route groups + TypedResults | Little ceremony, high performance; the approach .NET recommends for new projects |
| Use case structure | CQRS: separate commands and queries, with our own small interfaces | MediatR moved to a commercial license in 2025. Besides, all you need is a few interfaces; writing them yourself is instructive |
| Reads and writes | Writes: repository + Unit of Work + domain. Reads: read services that return DTOs directly | Writes protect the business rules; reads do fast projections without loading unnecessary entities |
| Error handling | The Result pattern for expected errors, a global exception handler for unexpected ones | Exceptions aren't for control flow; business errors become typed and predictable |
| Validation | FluentValidation + a handler decorator | The rules live in one place and are testable; no repetition in every handler |
| Mapping | Manual mapping (static methods or extensions) | AutoMapper went commercial too; manual mapping is explicit and safe at compile time |
| Database | EF Core 10 + SQL Server LocalDB | Lightweight setup, no Docker required |
| Ids | `Guid.CreateVersion7()` | Time-ordered and unpredictable GUIDs. Note: SQL Server sorts `uniqueidentifier` values starting from the last bytes, so this order is not preserved there; if you want less clustered-index fragmentation, use the sequential GUIDs EF Core generates for SQL Server |
| Time | The built-in `TimeProvider` | Direct `DateTime.UtcNow` can't be tested. You'll test the overdue scenarios with a fake clock |
| Authentication | JWT Bearer + role-based policies | The standard approach for stateless APIs |
| Documentation | Built-in OpenAPI + the Scalar UI | Since .NET 9, the templates have built-in OpenAPI support instead of Swashbuckle |
| Logging | Structured logging with Serilog | Logs become queryable by field |
| Package management | Central Package Management | All package versions in a single file |
| Testing | xUnit v3, Shouldly, NSubstitute, FakeTimeProvider, WebApplicationFactory, NetArchTest | FluentAssertions v8 moved to a commercial license; Shouldly is open source |

## 4.4 The journey of a request

Example: a member borrows a book with `POST /api/v1/loans`. If you keep this flow clear in your head, you'll know where everything belongs:

1. **Api:** The JWT is validated and the `Member` policy is checked. The endpoint reads `bookId` from the body and creates a `BorrowBookCommand`.
2. **Application (decorators):** The logging decorator logs the request; the validation decorator validates the command. If there's an error, the handler never runs.
3. **Application (handler):** Gets the member id from `IUserContext`; loads the member, the book and the member's active loans from the repositories.
4. **Domain:** `LendingService` checks BR-05, 06, 07, 08 and 17. If they pass, it decrements the book's stock, creates a new `Loan` and raises a domain event.
5. **Application:** The handler adds the new loan to the repository and saves everything at once through the Unit of Work.
6. **Infrastructure:** EF Core writes the changes (with a concurrency check via RowVersion), then dispatches the domain events.
7. **Api:** If the `Result` is successful, it returns 201 Created with a Location header; if it failed, it returns ProblemDetails based on the error type.
