---
title: Phase 2 — Application layer
summary: "Use cases, port interfaces, validation and logging decorators, handler tests."
---
| Phase summary |  |
| --- | --- |
| **Goal** | Write all the use cases and hide the outside world (database, clock, identity) behind interfaces. |
| **What you'll learn** | CQRS, dependency inversion, the ports & adapters approach, the decorator pattern, DTO design, FluentValidation, DI scanning with Scrutor, mocking with NSubstitute. |
| **What you'll have at the end of the phase** | The handlers behind every endpoint in [Section 3.3](/tracks/kutuphane-api/proje-tanimi), the validators, and handler unit tests. There's no database yet; everything is tested through interfaces. |

## Tasks

### 2.1 Messaging abstractions (Abstractions/Messaging)

| Interface | Description |
| --- | --- |
| `ICommand`, `ICommand<TResponse>` | Marker interfaces for requests that change state |
| `IQuery<TResponse>` | A marker interface for read-only requests |
| `ICommandHandler<TCommand>` | `HandleAsync(command, cancellationToken)` → `Task<Result>` |
| `ICommandHandler<TCommand, TResponse>` | `HandleAsync(…)` → `Task<Result<TResponse>>` |
| `IQueryHandler<TQuery, TResponse>` | `HandleAsync(…)` → `Task<Result<TResponse>>` |
| `IDomainEventHandler<TEvent>` | For classes that react to domain events: `HandleAsync(domainEvent, cancellationToken)` |

> **Hint:** Use generic constraints (e.g. requiring TCommand to be an `ICommand<TResponse>`) to prevent the wrong command from being paired with the wrong handler at compile time.

### 2.2 Port interfaces

**Write side (repositories):** One repository per aggregate. Repositories only load and add; they never save. Saving lives in a single `SaveChangesAsync` method on `IUnitOfWork`.

| Interface | Methods |
| --- | --- |
| `IAuthorRepository` | GetByIdAsync, HasBooksAsync, Add, Remove |
| `IBookRepository` | GetByIdAsync, IsbnExistsAsync, Add |
| `IMemberRepository` | GetByIdAsync, GetByEmailAsync, EmailExistsAsync, Add |
| `ILoanRepository` | GetByIdAsync, GetActiveByMemberIdAsync, CountActiveByMemberIdAsync, Add |
| `IUnitOfWork` | SaveChangesAsync |

**Read side (read services):** Instead of loading entities, queries use interfaces that return DTOs directly. This keeps reads fast and simple.

| Interface | Methods |
| --- | --- |
| `IAuthorReadService` | GetByIdAsync → AuthorResponse (null if missing), ListAsync → PagedList |
| `IBookReadService` | GetByIdAsync → BookResponse (including the author name), SearchAsync → PagedList |
| `IMemberReadService` | GetByIdAsync, ListAsync |
| `ILoanReadService` | GetByMemberIdAsync, ListOverdueAsync(now, paging) |

**Other ports:**

- `IPasswordHasher`: Hash and Verify.
- `ITokenProvider`: returns a token and its expiry time for a member.
- `IUserContext`: the `MemberId` of the signed-in user.
- Don't write an interface for the clock; inject .NET's built-in abstract `TimeProvider` class.
- `ConcurrencyException`: an exception that represents a concurrency conflict at the Application level. Infrastructure will replace EF's exception with this one, and Api will turn it into a 409.

### 2.3 Pagination

A record named `PagedList<T>`: Items, Page, PageSize, TotalCount, plus TotalPages, HasNextPage, and HasPreviousPage computed from them. Define a shared type for the page parameters too, and keep the default values there.

### 2.4 Use case list

| Feature | Command / Query | Output | Things to watch |
| --- | --- | --- | --- |
| Authors | CreateAuthorCommand | Guid | Domain validation |
|  | UpdateAuthorCommand | — | NotFound if missing |
|  | DeleteAuthorCommand | — | BR-13 → Conflict |
|  | GetAuthorByIdQuery | AuthorResponse | NotFound if missing |
|  | ListAuthorsQuery | PagedList\<AuthorResponse\> | Search and pagination |
| Books | CreateBookCommand | Guid | NotFound if the author is missing; Conflict if the ISBN exists (BR-02) |
|  | UpdateBookCommand | — | BR-03 |
|  | AddBookCopiesCommand | — | The copy count is positive |
|  | DeleteBookCommand | — | BR-14 |
|  | GetBookByIdQuery | BookResponse | Deleted books aren't visible |
|  | SearchBooksQuery | PagedList\<BookSummaryResponse\> | Search, authorId, sortBy allowlist |
| Members | RegisterMemberCommand | Guid | BR-16; the password is hashed |
|  | LoginCommand | TokenResponse | The **same** error whether the email doesn't exist or the password is wrong |
|  | GetCurrentMemberQuery | MemberResponse | The Id comes from `IUserContext` |
|  | ListMembersQuery | PagedList\<MemberResponse\> | The password hash is never returned |
|  | DeactivateMemberCommand | — | BR-15 |
| Loans | BorrowBookCommand | Guid | MemberId comes from `IUserContext`; `LendingService` |
|  | ExtendLoanCommand | — | Only the loan's owner can extend it |
|  | ReturnLoanCommand | ReturnLoanResponse | Fine + the book's stock goes back up |
|  | GetMyLoansQuery | IReadOnlyList\<LoanResponse\> |  |
|  | ListOverdueLoansQuery | PagedList\<OverdueLoanResponse\> | The current time comes from `TimeProvider` |

> **Why?** If your login distinguishes between “no such email” and “wrong password”, an attacker can learn which emails are registered (user enumeration). Both must return the same `InvalidCredentials` error.

> **Note:** For someone trying to extend another member's loan, there are two options: 403 Forbidden or 404 Not Found. A 404 doesn't even leak that the resource exists. State which one you chose and why in a comment in the handler; we'll discuss it in the review.

### 2.5 The typical flow of a command handler

1. Load the required aggregates from the repositories; return NotFound if they aren't found.
2. Do the necessary pre-checks (e.g. uniqueness).
3. Delegate the business logic to the domain: an entity method or a domain service.
4. If the domain returns a failed `Result`, pass it up as is.
5. Add new entities to the repository.
6. Save everything in one go with `IUnitOfWork.SaveChangesAsync`.
7. Return the result (an id or a DTO).

> **Watch out:** If you find yourself writing a business rule with an `if` inside a handler, stop and think: that rule most likely belongs in the Domain. Handlers are conductors; they don't play the instruments themselves.

### 2.6 Validation and decorators

- Write an `AbstractValidator` for every command (and every query that takes parameters). Example rules: Title is required and at most 200 characters; ISBN is required; TotalCopies is 1–1000; PageSize is 1–100; SortBy is one of the allowed values; the password is at least 8 characters and contains an uppercase letter, a lowercase letter, and a digit.
- **ValidationDecorator:** a class that implements the handler interface and wraps the real handler. It runs all validators registered for the command; if there are errors, it returns a `ValidationError` without ever calling the handler.
- **LoggingDecorator:** logs the request's name and duration; if a failed `Result` is returned, it logs the error code at Warning level.

> **Why?** Validation happens in two places, and both are necessary. The validator in Application checks the **input**: it's fast, collects all errors at once, and returns a 400. The domain, on the other hand, protects the **invariants**; it's the last line of defense. Don't write a complex rule like the ISBN check digit in two places; in the validator just say “not empty” and leave the rest to the domain.

### 2.7 DTOs and mapping

- Response types are sealed records and only carry data.
- Entities never leave the layer; Api always receives DTOs.
- Write the entity-to-DTO conversion by hand (a static factory method or an extension method).

### 2.8 Dependency registration (DependencyInjection.cs)

- Write an `AddApplication` extension method for `IServiceCollection`.
- Register the handlers as Scoped by scanning the assembly with Scrutor. Then add the decorators. Pay attention to the registration order: which decorator should be the outermost?
- Register the validators with FluentValidation's assembly scanning method.
- Register the domain event handlers by scanning as well.
- Since `LendingService` is stateless, it can be a Singleton.

> **Hint:** Before moving to Scrutor, try registering one or two handlers by hand. Seeing what you're automating helps you understand how scanning works.

### 2.9 Unit tests (Library.Application.UnitTests)

Fake the repositories and other ports with NSubstitute, and use `FakeTimeProvider` for time. At least these scenarios:

| Handler | Scenarios |
| --- | --- |
| CreateBook | No author → NotFound; ISBN exists → Conflict; success → `Add` and `SaveChangesAsync` were each called exactly once |
| BorrowBook | No book → NotFound; inactive member → error; limit reached → error; success → the book's stock went down and it was saved |
| ReturnLoan | Move the clock 17 days forward → fine of 15.00; already returned → Conflict |
| Login | Wrong password and nonexistent email → both give the same error code; correct credentials → a token is returned |
| ValidationDecorator | With an invalid command, the inner handler is never called |
| Validators | At least one test per rule using FluentValidation's test helpers (`TestValidate`) |

## Acceptance criteria

- [ ] Application has no reference to EF Core or ASP.NET Core (the architecture tests prove this).
- [ ] Every command has a validator.
- [ ] Handlers are sealed, `internal`, and do one thing.
- [ ] All async methods take a `CancellationToken` and pass it down.
- [ ] No handler throws an exception for an expected error.
- [ ] All tests are green.

## What I'll check in the review

- Business rules that leaked into handlers
- `SaveChangesAsync` being called more than once
- Returning entities instead of DTOs
- `CancellationToken` not being passed along
- Decorator order
- Mocks verifying more detail than necessary (brittle tests)
