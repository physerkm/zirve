---
title: Phase 1 — Domain layer
summary: A rich domain model that protects the business rules, the Result pattern, unit tests, and architecture tests.
---
| Phase summary |  |
| --- | --- |
| **Goal** | Build a rich, framework-independent domain model that never lets itself fall into an invalid state (always-valid). |
| **What you'll learn** | The difference between entities and value objects, aggregates, encapsulation, factory methods, the Result pattern, domain events, domain services, and writing unit tests and architecture tests. |
| **What you'll have at the end of the phase** | A Domain project that implements all the business rules (those of BR-01…BR-17 that belong to the domain), proven by tests. |

## Tasks

### 1.1 Core abstractions (Abstractions folder)

| Type | What should it be? |
| --- | --- |
| `Entity` (abstract class) | An `Id` of type Guid that can't be changed from outside. A private list for domain events, exposed to the outside only as a read-only collection. A protected `Raise` method for subclasses to add events, and a `ClearDomainEvents` method that clears the list |
| `IDomainEvent` (interface) | A marker interface. Concrete events will be sealed records whose names end with `DomainEvent` (e.g. `LoanCreatedDomainEvent`) |
| `IAuditableEntity` (interface) | `CreatedAt` and `UpdatedAt` fields. In Phase 3 an interceptor will fill in their values automatically; the domain never touches these fields by hand |
| `ISoftDeletable` (interface) | `IsDeleted` and `DeletedAt` fields |
| `ErrorType` (enum) | Failure, Validation, NotFound, Conflict, Unauthorized, Forbidden |
| `Error` (record) | `Code`, `Description`, and `Type` properties. Static factory methods for each type (e.g. `Error.NotFound(code, description)`) and a static `None` value meaning “no error”. It won't be sealed, because `ValidationError` will derive from it |
| `ValidationError` (sealed record) | An `Error` subtype that carries multiple validation errors. It contains an array of errors; each element's `Code` is the field name and its `Description` is the message |
| `Result` | `IsSuccess`, `IsFailure`, `Error`. Static `Success()` and `Failure(error)` methods. The constructor must prevent inconsistent states: on success, Error must be `None`; on failure, it can't be `None`; if this is violated, an exception is thrown (it's a programmer error) |
| `Result<TValue>` | Derives from `Result` and adds a `Value` property. Trying to access the `Value` of a failed result must throw `InvalidOperationException`. Bonus: write implicit conversion operators from the value and from `Error`; your handlers will become much more readable |

> **Why?** With the Result pattern, the signature tells you a method can fail, and the caller is forced to handle the error. Exceptions, on the other hand, are invisible and expensive; save them for truly unexpected situations.

### 1.2 Value objects

| Type | Rules |
| --- | --- |
| `Isbn` | Private constructor; only `Create(string)` is exposed, and it returns `Result<Isbn>`. It strips hyphens and spaces, requires 13 digits, and validates the ISBN-13 check digit (BR-01). Look up: “ISBN-13 check digit” (a sum weighted by 1 and 3) |
| `Email` | `Create(string)` → `Result<Email>`. Trims, converts to lowercase (BR-16), and checks a simple format and a maximum of 256 characters |

> **Hint:** Defining value objects as records gives you value equality for free. Ask yourself: should two `Isbn`s with the same text be considered equal?

### 1.3 Entities

Rules shared by all entities:

- All property setters are private. The only way to change state from outside is through meaningfully named methods (`book.UpdateDetails(…)`, not `Book.Title = …`).
- Objects are created through a static factory method, which returns an error via `Result` on invalid input. It must be impossible to create an invalid entity at all.
- There is a private parameterless constructor so that EF Core can materialize the object.
- Ids are generated with `Guid.CreateVersion7()`.
- The domain layer doesn't know about the clock: methods that need the time take the current time as a parameter.

| Entity | Methods and behavior |
| --- | --- |
| **Author** | `Create(firstName, lastName, biography)`: first and last names can't be empty and are at most 100 characters. `Update(…)` applies the same rules. `FullName` is a computed property |
| **Book** | `Create(title, isbn, publicationYear, authorId, totalCopies, currentYear)`: BR-03, BR-04. Initially AvailableCopies = TotalCopies. `UpdateDetails(title, publicationYear, currentYear)`. `AddCopies(count)`: increases both Total and Available. `Checkout()`: decreases Available by one; if it's 0, an error (BR-05). `ReturnCopy()`: increases Available by one, but it can't exceed Total (BR-04). `Delete(now)`: if Available is less than Total, there are active loans and it returns an error (BR-14); otherwise it applies a soft delete |
| **Member** | `Register(fullName, email, passwordHash, role)`: the default role is Member, IsActive is true. Publishes `MemberRegisteredDomainEvent`. `Deactivate(activeLoanCount)`: an error if there are active loans (BR-15) |
| **Loan** | Can't be created directly from outside; its creation method is `internal` and is called only by `LendingService`. DueAt = BorrowedAt + 14 days (BR-09). `IsOverdue(now)`: is it unreturned and past due? `Extend(now)`: BR-10 and BR-12. `Return(now)`: BR-11 and BR-12; calculates the fine, fills in ReturnedAt, and publishes `LoanReturnedDomainEvent` |

### 1.4 Domain service: LendingService

The lending rule doesn't belong to a single aggregate: it involves the member's status, the book's stock, and the member's current loans together. Rules like this live in a **domain service**.

- A stateless, sealed class.
- `Borrow(member, book, activeLoansOfMember, now)` → `Result<Loan>`.
- Check the rules in this order: BR-08 (inactive member), BR-07 (has an overdue loan), BR-06 (limit), BR-17 (the member already has the same book), BR-05 (out of stock).
- If all of them pass, it calls `book.Checkout()`, creates a new `Loan`, and publishes `LoanCreatedDomainEvent`.

### 1.5 Error definitions

Write a static error class for each feature: `AuthorErrors`, `BookErrors`, `MemberErrors`, `LoanErrors`. Error codes should have the form `Feature.Condition`. Some of the expected errors:

| Class | Errors |
| --- | --- |
| BookErrors | NotFound(id), InvalidIsbn, DuplicateIsbn, InvalidPublicationYear, InvalidCopyCount, NoCopiesAvailable, HasActiveLoans |
| AuthorErrors | NotFound(id), HasBooks, InvalidName |
| MemberErrors | NotFound(id), EmailNotUnique, InvalidEmail, Inactive, LoanLimitReached, HasOverdueLoans, HasActiveLoans, InvalidCredentials, AlreadyBorrowedThisBook |
| LoanErrors | NotFound(id), AlreadyReturned, AlreadyExtended, OverdueCannotBeExtended |

### 1.6 Role

An enum named `Role` (Member, Librarian). We'll use the same names in JWT claims and authorization policies; define the string values in a single place.

### 1.7 Unit tests (Library.Domain.UnitTests)

Test naming: `Method_Scenario_ExpectedResult` (e.g. `Extend_WhenAlreadyExtended_ReturnsAlreadyExtendedError`). Each test should consist of Arrange / Act / Assert sections and verify a single behavior. Test at least these scenarios:

| Topic | Scenarios |
| --- | --- |
| Isbn | `978-0-306-40615-7` is valid and is normalized to `9780306406157`; a version written with spaces is also accepted; 12 digits → error; wrong last digit (`9780306406158`) → error; contains letters → error |
| Email | Uppercase letters are lowercased and whitespace is trimmed; no `@` → error |
| Book | Checkout reduces the stock; Checkout with stock 0 is an error; ReturnCopy doesn't exceed Total; Delete with an active loan is an error; publication year 1449 is an error |
| Loan | DueAt is 14 days later; Extend adds 7 days; a second Extend is an error; Extend while overdue is an error; on-time return has a fine of 0; 3 days late gives a fine of 15.00; returning twice is an error; return publishes an event |
| LendingService | A failure test for each rule (BR-05, 06, 07, 08, 17) and a success test that publishes the event |

> **Hint:** In tests that need time, use a fixed date (e.g. January 1, 2026, UTC). Don't let your tests depend on today's date; otherwise one day they'll break on their own.

### 1.8 Architecture tests (Library.ArchitectureTests)

Test these rules with NetArchTest:

- Domain doesn't depend on Application, Infrastructure, Api, or the `Microsoft.EntityFrameworkCore` and `Microsoft.AspNetCore` namespaces.
- Application doesn't depend on Infrastructure or Api.
- Infrastructure doesn't depend on Api.
- Domain events are sealed and their names end with `DomainEvent`.

> **Hint:** A common way to reach each assembly is to define a small “AssemblyReference” class that points to any type in that assembly.

## Acceptance criteria

- [ ] The Domain csproj has no `PackageReference`.
- [ ] No entity has a public setter or a mutable collection exposed to the outside.
- [ ] It's impossible to create an invalid entity or value object.
- [ ] `DateTime.Now`, `DateTime.UtcNow`, and `DateTimeOffset.UtcNow` don't appear in the domain.
- [ ] The rule constants (3, 14, 7, 5.00) live in a single place with meaningful names.
- [ ] All unit and architecture tests are green.

## What I'll check in the review

- Encapsulation: public setters, leaked `List<T>`s
- Primitive obsession: ISBNs and emails passed around as strings
- Using exceptions for expected errors
- Magic numbers
- Whether the tests really verify behavior, and how readable they are
- Naming consistency
