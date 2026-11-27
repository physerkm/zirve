---
title: Phase 3 — The Infrastructure layer
summary: "EF Core, migrations, seed data, password hashing and JWT generation."
---
| Phase summary |  |
| --- | --- |
| **Goal** | Implement the ports defined in Application with real technologies: the database, password hashing and token generation. |
| **What you'll learn** | DbContext, Fluent API configuration, value converters, indexes, optimistic concurrency (RowVersion), interceptors, global query filters, migrations, seeding, AsNoTracking projection, the Options pattern. |
| **What you'll have at the end** | A database created in LocalDB and filled with seed data, plus real implementations of every port. |

## Tasks

### 3.1 LibraryDbContext

- `DbSet`s for the four entities.
- In `OnModelCreating`, apply all configurations from the assembly in one go (`ApplyConfigurationsFromAssembly`).
- Implement `IUnitOfWork` (either the DbContext itself or a separate class that uses it; justify your choice).
- Dispatch domain events after a successful save (see 3.4).
- Catch `DbUpdateConcurrencyException` and translate it into the `ConcurrencyException` defined in Application.

### 3.2 Entity configurations

Write a separate `IEntityTypeConfiguration<T>` class for each entity:

| Entity | Configuration |
| --- | --- |
| Author | Table name; FirstName and LastName required, at most 100; Biography at most 2000 |
| Book | Title required, at most 200, and indexed (for search). Isbn: converted to a string with a value converter, 13 characters, **unique index**. AuthorId: foreign key to Author, delete behavior Restrict (so BR-13 is also enforced in the database). RowVersion: concurrency token. `IsDeleted = false` global query filter |
| Member | Email: value converter, at most 256, **unique index**. Role is stored as a string. PasswordHash required |
| Loan | BookId and MemberId foreign keys; an index on (MemberId, ReturnedAt) (for the active-loan query); decimal precision for LateFee (e.g. 10,2) |
| All | Exclude the entity's domain event collection from the model (so EF doesn't try to turn it into a table) |

### 3.3 Interceptors

- **AuditableEntityInterceptor** (derives from `SaveChangesInterceptor`): for entities that implement `IAuditableEntity`, fill in `CreatedAt` when they are added and `UpdatedAt` when they change. Get the time from `TimeProvider`.
- Resolve the interceptors from DI and add them to the DbContext during `AddDbContext`.

### 3.4 Domain event dispatching

- `DomainEventsDispatcher`: collects the events from the tracked entities, clears the lists on the entities, and for each event finds the matching `IDomainEventHandler`s in DI and runs them.
- Dispatching happens **after the save succeeds**.

> **Info:** With this approach, if the save succeeds but an event handler fails, the event is lost. In real systems the fix for this is the Outbox pattern (Bonus phase). For now it's enough to know about this limitation.

### 3.5 Repositories and read services

- All implementations are `internal sealed` and take the DbContext through a primary constructor.
- Repositories load entities with tracking, because they will be modified and saved.
- Read services use `AsNoTracking` and **project directly into DTOs** with `Select`. Don't load entities into memory first and convert them afterward.
- For book search: search text, an author filter, sorting via a whitelist (never map user input directly to a column name), paging with `Skip`/`Take`, and the total record count.
- For book details, get the author name with a join; don't fall into the N+1 query problem.

### 3.6 Identity infrastructure

- **PasswordHasher:** implements `IPasswordHasher` by wrapping ASP.NET Core Identity's built-in `PasswordHasher<T>` class. **Never** write your own hashing algorithm.
- **JwtOptions:** Issuer, Audience, Secret, ExpirationMinutes. Read from the `Jwt` section with the Options pattern, validated with data annotations (Secret at least 32 characters), and validated at application startup (`ValidateOnStart`).
- **TokenProvider:** generates HMAC-SHA256 signed tokens with `JsonWebTokenHandler`. Claims: `sub` (member id), `email`, `role`, `jti`.

### 3.7 Configuration and service registration

Put the connection string under the `ConnectionStrings:Database` key in `appsettings.Development.json`:

```text
Server=(localdb)\MSSQLLocalDB;Database=LibraryDb;Trusted_Connection=True;TrustServerCertificate=True
```

**Never** put the JWT Secret in appsettings; use user secrets:

```bash
dotnet user-secrets init --project src/Library.Api
dotnet user-secrets set "Jwt:Secret" "<a random value at least 32 characters long>" --project src/Library.Api
```

Write an `AddInfrastructure(services, configuration)` extension for Infrastructure: the DbContext (SQL Server + interceptors), repositories and read services (Scoped), the Unit of Work, `TimeProvider.System` (Singleton), the identity services and the Options registration.

### 3.8 Migrations

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate --project src/Library.Infrastructure --startup-project src/Library.Api --output-dir Persistence/Migrations
dotnet ef database update --project src/Library.Infrastructure --startup-project src/Library.Api
```

> **Warning:** Always read the generated migration file: are the tables, column lengths, unique indexes, foreign key delete behaviors and RowVersion what you expect? Migrations are the history of your database; don't accept them blindly.

> **Info:** Applying migrations automatically at application startup is acceptable only in the Development environment. In production, a migration script or a migration bundle is preferred.

### 3.9 Seed data

Write a `DatabaseSeeder` that runs only in the Development environment. If there is no data, it should add:

- 1 Librarian: `librarian@library.local`; the password is read from user secrets (`Seed:LibrarianPassword`).
- 3 authors and 5 books by them with valid ISBNs. You can find valid ISBN examples from real books.

Seeding must be idempotent: no matter how many times the application starts, the data is added only once.

## Test it yourself

1. Connect to `(localdb)\MSSQLLocalDB` with the mssql extension in VS Code; look at the tables, indexes and seed data.
2. Try inserting a row with a duplicate ISBN via SQL → unique index error.
3. Try deleting an author who has books via SQL → foreign key error.
4. Start the application twice → the seed data is not duplicated.

## Acceptance criteria

- [ ] The migration is generated cleanly and applied to the database.
- [ ] The repository and read service classes are `internal`.
- [ ] EF Core hasn't leaked into Application (architecture tests are green).
- [ ] All read queries use `AsNoTracking` and DTO projection.
- [ ] The repo contains no secrets (secret keys, passwords). Check with `git grep -i secret`.

## What I'll look at in review

- N+1 queries and unnecessary `Include`s
- Calling `ToList` before filtering
- Cascade delete behaviors
- Missing string lengths and indexes
- Lifetime bugs (e.g. injecting a Scoped service into a Singleton)
- Hard-coded connection strings or secrets
