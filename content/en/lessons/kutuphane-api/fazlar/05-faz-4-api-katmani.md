---
title: Phase 4 — The API layer (Minimal API)
summary: "Author and book endpoints, consistent error responses with ProblemDetails, OpenAPI and Scalar."
---
| Phase summary |  |
| --- | --- |
| **Goal** | Expose the use cases over HTTP and produce consistent, standards-compliant responses. |
| **What you'll learn** | Route groups, TypedResults, organizing endpoints with IEndpoint, `[AsParameters]`, route constraints, ProblemDetails, IExceptionHandler, OpenAPI, Scalar, `.http` files. |
| **What you'll have at the end** | An API with working author and book endpoints that you can try out from the Scalar UI. |

## Tasks

### 4.1 Keep Program.cs clean

`Program.cs` should contain only three registration calls (`AddApplication`, `AddInfrastructure`, `AddPresentation`) and the middleware pipeline. Target: under 40 lines. Put the Api-specific registrations (ProblemDetails, the exception handler, OpenAPI, JSON settings) in the `AddPresentation` extension in the Api project.

### 4.2 Endpoint organization

- An `IEndpoint` interface with a single method, `MapEndpoint(IEndpointRouteBuilder app)`.
- Each endpoint is a separate class (e.g. `Endpoints/Books/CreateBook.cs`).
- Write one extension that uses reflection to register every `IEndpoint` in the assembly with DI, and another that maps them all under the `/api/v1` route group.
- Give each endpoint a name (`WithName`), a tag (`WithTags`) and a summary (`WithSummary`); these show up in the OpenAPI document.
- Inject the handler as a parameter of the endpoint delegate; minimal APIs resolve it from DI automatically. Take a `CancellationToken` as a parameter too.
- Use type constraints on route parameters (`{id:guid}`).
- Instead of taking list parameters one by one, gather them into a record and bind it with `[AsParameters]`.
- Define a separate request record for the request body in the Api layer and map it to the command.

> **Why?** Separating the request from the command makes the API contract independent of the use case. For example, in an update the `id` comes from the route and the other fields come from the body; the command combines the two. Even if the API contract changes, the use case doesn't have to.

### 4.3 From Result to HTTP response

- Write a single helper that turns a failed `Result` into ProblemDetails (e.g. `CustomResults.Problem`). Pick the status code based on the table in [Section 3.4](/tracks/kutuphane-api/proje-tanimi). `title` = the error code, `detail` = the description.
- When you get a `ValidationError`, return a ValidationProblem with a per-field `errors` dictionary.
- Success responses: `TypedResults.Created` for creation (with a Location header), `NoContent` for updates and deletes, `Ok` for reads.

> **Tip:** If you add a method called `Match(onSuccess, onFailure)` to the `Result` type, every endpoint shrinks to a one-line expression.

### 4.4 Global exception handler

- A `GlobalExceptionHandler` that implements the `IExceptionHandler` interface: it logs the exception at Error level and returns a 500 ProblemDetails. The exception message and stack trace are visible only in Development.
- Return 409 Conflict for `ConcurrencyException`.
- Don't forget to register `AddProblemDetails` and `UseExceptionHandler`. Use the ProblemDetails customization option to add a `traceId` to ProblemDetails.

### 4.5 UserContext

Implement `IUserContext` in the Api layer: it reads the `MemberId` from the `sub` claim via `IHttpContextAccessor`. If the claim is missing, it throws an exception; that's a programmer error (it means an endpoint that requires authorization was called without it). It won't be used yet in this phase, but have the DI registration ready now.

### 4.6 JSON, OpenAPI and Scalar

- Serialize enums as strings (add a string enum converter to the HTTP JSON options).
- Map the OpenAPI document and the Scalar UI only in the Development environment. Open Scalar in your browser at `/scalar`.

### 4.7 The .http file

Write sample requests for every endpoint in this phase in the `Library.Api.http` file. Use variables like `@baseUrl`. This file will be the living manual test script for the API.

> **Info:** There is no authentication in this phase; the Librarian endpoints are open to everyone for now. You'll lock them down in Phase 5.

## Test it yourself

| # | Request | Expected result |
| --- | --- | --- |
| 1 | GET /api/v1/books | 200; the seed books and paging fields |
| 2 | GET /api/v1/books?pageSize=500 | 400; PageSize in `errors` |
| 3 | GET /api/v1/books/{random-guid} | 404; title = `Books.NotFound` |
| 4 | GET /api/v1/books/abc | 404 (the route constraint didn't match) |
| 5 | POST /api/v1/books, ISBN with a wrong check digit | 400; `Books.InvalidIsbn` (a Validation-type error coming from the domain) |
| 6 | POST /api/v1/books, existing ISBN | 409; `Books.DuplicateIsbn` |
| 7 | POST /api/v1/books, valid data | 201 and a Location header; GET on that address → 200 |
| 8 | PUT /api/v1/books/{id} | 204; GET again → the change is visible, UpdatedAt is filled in |
| 9 | GET /api/v1/books?search=…&sortBy=year&sortOrder=desc | Filtered and correctly sorted results |
| 10 | GET /api/v1/books?sortBy=hack | 400 |
| 11 | DELETE /api/v1/authors/{author-with-books} | 409; `Authors.HasBooks` |
| 12 | DELETE /api/v1/books/{id}, then GET | 204, then 404 (soft delete + query filter) |
| 13 | A temporary test endpoint that throws an exception (delete it afterward) | 500 ProblemDetails; no stack trace in the Production environment |

> **Tip:** To try a different environment, start the application with the `ASPNETCORE_ENVIRONMENT` environment variable set to `Production`.

## Acceptance criteria

- [ ] The endpoints contain no business logic; they only map HTTP → command/query → HTTP.
- [ ] All error responses are in ProblemDetails format and include a `traceId`.
- [ ] Create endpoints return a Location header.
- [ ] In Scalar, every endpoint shows up with the correct name, tag and response types.
- [ ] All 13 scenarios above work as expected.

## What I'll look at in review

- A bloated `Program.cs`
- Wrong status codes
- Using the DbContext or a repository in an endpoint
- Missing route constraints
- Missing `CancellationToken`
- Exception details leaking in Production
- Middleware order
