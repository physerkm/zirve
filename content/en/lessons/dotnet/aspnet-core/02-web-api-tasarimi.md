---
title: Web API Design with ASP.NET Core
summary: Choosing between Minimal APIs and controllers, resource-oriented URLs, correct status codes, validation, ProblemDetails, pagination, versioning, idempotency and rate limiting. What the "RESTful API design" line in job postings actually means.
---

Almost every job posting includes a line like "RESTful API design and development". In interviews this usually comes up in one of two ways: "Design an API for this resource" or "What is wrong with this endpoint?". This lesson builds the habits that let you answer both.

## Minimal API or controllers?

| | Minimal API | Controller (MVC) |
| --- | --- | --- |
| Structure | Endpoints are defined with `MapGet`/`MapPost` | Classes and action methods |
| Upfront cost | Little code, fast startup | More ceremony |
| Filters | Endpoint filters | Action, result, exception filters |
| Native AOT | Supported | Not supported |
| When | New services, microservices, vertical slices | Large and legacy codebases, teams used to MVC |

Both use the same infrastructure (routing, model binding, DI, authentication). In an interview, the right answer to "which one is better?" is to list the trade-offs. For new projects, Microsoft's default is Minimal APIs.

In Minimal APIs, grouping endpoints keeps things organized:

```csharp
var orders = app.MapGroup("/api/v1/orders")
    .WithTags("Orders")
    .RequireAuthorization();

orders.MapGet("/{id:guid}", GetOrder).WithName("GetOrder");
orders.MapPost("/", CreateOrder);
orders.MapDelete("/{id:guid}", CancelOrder);

static async Task<Results<Ok<OrderDto>, NotFound>> GetOrder(
    Guid id, AppDbContext db, CancellationToken ct)
{
    var order = await db.Orders.AsNoTracking()
        .Where(o => o.Id == id)
        .Select(o => new OrderDto(o.Id, o.Status, o.Total))
        .FirstOrDefaultAsync(ct);

    return order is null ? TypedResults.NotFound() : TypedResults.Ok(order);
}
```

The `Results<Ok<OrderDto>, NotFound>` return type tells both the compiler and the OpenAPI document which responses the endpoint can return. Using `TypedResults` also makes it easy to assert on the result by its type in unit tests.

## Resource-oriented URLs and the right HTTP verbs

In REST, the URL describes a **resource** and the verb describes **the action to take**. There are no verbs in the URL.

| Bad | Good |
| --- | --- |
| `POST /api/getOrders` | `GET /api/orders` |
| `POST /api/orders/delete/5` | `DELETE /api/orders/5` |
| `GET /api/orders/5/cancel` | `POST /api/orders/5/cancellation` or `POST /api/orders/5:cancel` |
| `GET /api/user-orders?userId=7` | `GET /api/users/7/orders` |

What the verbs mean:

| Verb | Meaning | Safe? | Idempotent? |
| --- | --- | --- | --- |
| `GET` | Read | Yes | Yes |
| `POST` | Create, or start an operation | No | **No** |
| `PUT` | Replace the resource entirely | No | Yes |
| `PATCH` | Partial update | No | Usually not |
| `DELETE` | Delete | No | Yes |

**Idempotent** means the final state on the server is the same whether you send the same request once or ten times. If `DELETE /orders/5` is called twice, the order is still deleted (the second call may return 404, but the state does not change).

## Status codes

The ones most often confused in interviews:

| Code | When |
| --- | --- |
| `200 OK` | Successful read or update, with a body |
| `201 Created` | Resource created. The `Location` header should point to the new resource |
| `202 Accepted` | The work was queued and will finish later |
| `204 No Content` | Success, no body (e.g. a delete) |
| `400 Bad Request` | The request format or validation is wrong |
| `401 Unauthorized` | Not authenticated ("who are you?") |
| `403 Forbidden` | Identity is known but permission is missing ("you can't do this") |
| `404 Not Found` | The resource does not exist |
| `409 Conflict` | State conflict: concurrent update, duplicate unique value |
| `412 Precondition Failed` | The ETag sent with `If-Match` is no longer valid |
| `422 Unprocessable Content` | The format is correct but a business rule was violated |
| `429 Too Many Requests` | Rate limit exceeded |
| `500` / `503` | Server error / service temporarily unavailable |

```csharp
static async Task<Created<OrderDto>> CreateOrder(CreateOrderRequest request, OrderService service, CancellationToken ct)
{
    var order = await service.CreateAsync(request, ct);
    return TypedResults.Created($"/api/v1/orders/{order.Id}", order);
}
```

## Validation and ProblemDetails

Errors should be returned to the client in **a single, standard format**. ASP.NET Core uses the RFC 9457 `ProblemDetails` format for this:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "quantity": ["Quantity must be between 1 and 100."] },
  "traceId": "00-3f9c…-01"
}
```

.NET 10 brought built-in, DataAnnotations-based validation to Minimal APIs:

```csharp
builder.Services.AddProblemDetails();
builder.Services.AddValidation();   // .NET 10: validates Minimal API parameters

public sealed record CreateOrderRequest(
    [property: Required] Guid ProductId,
    [property: Range(1, 100)] int Quantity);
```

For more complex rules, the common choice is the **FluentValidation** library. Wherever the rule lives, the distinction is:

- **Input validation** (is the field empty, is it in range) happens at the endpoint and returns `400`.
- **Business rules** (is there enough stock) are checked in the domain or application layer and return `409`/`422`.

## Pagination, filtering and sorting

List endpoints should **never** return unbounded results.

**Offset pagination** (`?page=3&pageSize=20`): simple, and it lets you jump to a page. But `OFFSET 100000` means the database reads and discards a hundred thousand rows, and if records are inserted while the user is paging, rows shift.

**Cursor (keyset) pagination** (`?after=2026-11-20T10:00:00Z_8412&limit=20`): asks for what comes after the last key seen. It seeks directly via the index and stays equally fast on large tables. It is the right choice for infinite scrolling and feeds.

```csharp
var page = await db.Orders
    .Where(o => o.CreatedAt < cursor.CreatedAt
             || (o.CreatedAt == cursor.CreatedAt && o.Id < cursor.Id))
    .OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
    .Take(limit + 1)                  // read one extra: is there a next page?
    .ToListAsync(ct);
```

Put an upper limit on `pageSize` (e.g. 100). Otherwise someone will send `pageSize=1000000`.

## Versioning

A breaking change to a published API (removing a field, changing its type, adding a required field) requires a new version. A non-breaking change (a new optional field, a new endpoint) does not.

| Method | Example | Note |
| --- | --- | --- |
| URL path | `/api/v2/orders` | Most common, most visible |
| Query string | `/api/orders?api-version=2.0` | Preferred by Azure APIs |
| Header | `Api-Version: 2` | Keeps the URL clean, harder to discover |

The `Asp.Versioning.Http` package lets you define versions and mark old ones as "deprecated". Good practice: don't shut down the old version right away; measure its usage and announce a removal schedule.

## Idempotency key

For `POST` requests such as payments, if the network drops, the client cannot know whether the request was processed, so it retries. The solution is for the client to send a unique key for each operation:

```http
POST /api/payments
Idempotency-Key: 6f1c2b7e-1d3a-4c55-9a0e-2f7b8f9d1c44
```

On the first request, the server stores the key together with its result (in a table with a unique index, or in Redis). When a second request arrives with the same key, it does not repeat the operation; it returns the stored response. Stripe and other payment providers use this pattern. The equivalent idea for messages in a queue is the **idempotent consumer** (see the Architecture module).

## Concurrent updates: ETag

If two users read the same record and both update it, the one who writes last silently overwrites the other's change (a lost update). HTTP's solution is the conditional request:

1. The `GET` response returns the record's version in the `ETag: "17"` header.
2. When updating, the client sends `If-Match: "17"`.
3. If the version is still 17, the server updates it; otherwise it returns `412 Precondition Failed`.

On the database side, the equivalent is the optimistic concurrency token in EF Core (see the EF Core lesson).

## Rate limiting

ASP.NET Core has a built-in rate limiter:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("per-user", context =>
        RateLimitPartition.GetTokenBucketLimiter(
            context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 20,
                TokensPerPeriod = 10,
                ReplenishmentPeriod = TimeSpan.FromSeconds(1),
            }));
});

app.UseRateLimiter();
orders.MapPost("/", CreateOrder).RequireRateLimiting("per-user");
```

This limiter is **in-process**. If several instances are running, the limit is multiplied by the number of instances. A distributed limit needs a Redis-based solution or an API gateway (System Design › Distributed Rate Limiter).

## The OpenAPI document

From .NET 9 on, the templates use built-in OpenAPI generation instead of Swashbuckle:

```csharp
builder.Services.AddOpenApi();
app.MapOpenApi();          // /openapi/v1.json
```

The document gets richer with `TypedResults` return types and metadata such as `WithName`, `WithSummary` and `Produces`. You can add Scalar or Swagger UI for a user interface. Exposing the document only in development, or putting it behind authentication, is a good habit.

## Asked in interviews

- **"What is the difference between PUT and PATCH?"** PUT replaces the whole resource and is idempotent. PATCH changes only the fields that are sent.
- **"What is the difference between 401 and 403?"** 401 says the identity has not been authenticated; 403 says the identity is known but lacks permission.
- **"If the client retries a payment endpoint, how do you prevent a double charge?"** An idempotency key. The server stores the key with its result and returns the same response to the repeated request.
- **"How would you paginate a list with millions of rows?"** Cursor (keyset) pagination. Offset slows down at large values and rows shift.
- **"You need to make a breaking change to the API. What do you do?"** I create a new version, mark the old one as deprecated, monitor usage and remove it on a schedule.

## Summary

- The URL describes the resource, the HTTP verb describes the action. The correct status code is part of the API's contract.
- Errors are returned in `ProblemDetails` format. Input validation produces `400`, a business rule violation produces `409`/`422`.
- Lists are always paginated. For large data, use cursor pagination.
- Retryable `POST`s are protected with an idempotency key, concurrent updates with ETags.
- Versioning is only for breaking changes. Rate limiting is built in for a single instance and must be distributed for multiple instances.
