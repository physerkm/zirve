---
title: Modern C# (C# 9–14)
summary: Records and the with expression, init and required, pattern matching and switch expressions, nullable reference types, primary constructors, collection expressions, raw string literals, file-scoped namespaces and global using, the field keyword, and extension members.
---

Job postings say ".NET 8+", ".NET 9", ".NET 10". Codemotion's posting spells it out: "C# 12/13: primary constructor, collection expression." In an interview, the interviewer expects you to be able to read modern syntax, and if you also use it in live coding, your code gets shorter and its intent clearer. This lesson collects the most widely used features from C# 9 through C# 14 (the version that ships with .NET 10).

## Records (C# 9, 10)

```csharp
public sealed record OrderPlaced(Guid OrderId, decimal Total, DateTimeOffset At);

var a = new OrderPlaced(id, 250m, now);
var b = a with { Total = 300m };     // a copy, only Total differs (non-destructive mutation)

Console.WriteLine(a == b);           // False: value equality
Console.WriteLine(a);                // OrderPlaced { OrderId = ..., Total = 250, At = ... }
```

What records give you: **value equality** (`Equals`, `GetHashCode`, `==`), a readable `ToString`, copying with `with`, and deconstruction with the positional syntax (`var (id, total, _) = a;`).

- `record` (or `record class`) is a reference type. `record struct` is a value type.
- The properties of positional records have `init` accessors: they can't be changed after construction.
- Where to use them: DTOs, commands, events, value objects.
- Watch out: a `List<T>` field inside a record is still a reference. Equality between two records compares the lists by **reference**, and `with` doesn't copy the list (a shallow copy).

## init and required (C# 9, 11)

```csharp
public sealed class CreateUserRequest
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public string? Phone { get; init; }
}

var request = new CreateUserRequest { Email = "ada@example.com", Name = "Ada" };   // compile error if Name is forgotten
```

- `init`: can be assigned only while the object is being created.
- `required`: **must** be assigned in the object initializer. It prevents invalid objects at compile time without writing a constructor.

## Pattern matching (C# 7–11)

```csharp
decimal Shipping(Order order) => order switch
{
    { Total: >= 500m }                          => 0m,
    { Address.Country: "TR", Items.Count: <= 2 } => 29.90m,
    { Address.Country: "TR" }                   => 49.90m,
    { Address.Country: not null }               => 149m,
    _ => throw new ArgumentException("Address is missing", nameof(order)),
};
```

Kinds of patterns:

| Pattern | Example |
| --- | --- |
| Type | `shape is Circle c` |
| Property | `{ Status: OrderStatus.Paid, Total: > 0 }` |
| Relational | `>= 500m`, `< 0` |
| Logical | `and`, `or`, `not` (`not null`, `>= 1 and <= 5`) |
| Positional | `(0, 0)` (with deconstruction) |
| List (C# 11) | `[]`, `[var first, ..]`, `[_, _, ..var rest]` |

```csharp
string Describe(int[] values) => values switch
{
    [] => "empty",
    [var single] => $"single element: {single}",
    [var first, .., var last] => $"starts with {first}, ends with {last}",
};
```

A switch expression is an **expression** (it returns a value), and the compiler warns about cases that aren't covered. It replaces `if/else` chains full of flag checks.

Handling every case in a closed type hierarchy is a powerful tool in domain modeling:

```csharp
public abstract record PaymentResult;
public sealed record Approved(string TransactionId) : PaymentResult;
public sealed record Declined(string Reason) : PaymentResult;
public sealed record RequiresAction(Uri RedirectUrl) : PaymentResult;

IResult ToHttp(PaymentResult result) => result switch
{
    Approved a       => TypedResults.Ok(a),
    Declined d       => TypedResults.Problem(d.Reason, statusCode: 402),
    RequiresAction r => TypedResults.Accepted(r.RedirectUrl),
    _ => throw new UnreachableException(),
};
```

## Nullable reference types (C# 8)

With `<Nullable>enable</Nullable>` turned on, the compiler tracks whether reference types can be `null`:

```csharp
public string Name { get; set; } = "";     // never null
public string? MiddleName { get; set; }    // may be null

int Length(string? text) => text.Length;           // warning: possible null reference
int SafeLength(string? text) => text?.Length ?? 0; // correct
```

- This is a **compile-time** analysis. Nothing changes at runtime. Data coming from outside (JSON, a database) can still be `null`.
- The `!` (null-forgiving) operator silences the warning. It means "I know better." If you use it often, there's a design problem.
- Attributes such as `[NotNullWhen(true)]` give the compiler flow information: `TryGetValue(key, [NotNullWhen(true)] out var value)`.
- It's enabled by default in new projects. Treating warnings as errors (`TreatWarningsAsErrors`) moves most `NullReferenceException`-style bugs to compile time.

## Primary constructors (C# 12)

```csharp
public sealed class OrderService(IOrderRepository orders, ILogger<OrderService> logger)
{
    public async Task CancelAsync(Guid id, CancellationToken ct)
    {
        var order = await orders.GetAsync(id, ct);
        logger.LogInformation("Canceling order: {OrderId}", id);
        order.Cancel();
    }
}
```

It removes the ceremony of declaring and assigning fields for dependencies received through DI. What you need to know:

- The parameters are **not fields**; they are parameters captured throughout the class, and they are **not** `readonly`: they can be reassigned inside the class. Teams that want to prevent this write `private readonly IOrderRepository _orders = orders;` or use an analyzer rule.
- Unlike the positional parameters of records, in classes they **don't generate public properties**.

## Collection expressions (C# 12)

```csharp
int[] numbers = [1, 2, 3];
List<string> names = ["Ada", "Alan"];
ReadOnlySpan<char> separators = [',', ';'];
int[] all = [..numbers, 4, 5];           // spread
List<Order> empty = [];
```

The compiler picks the most efficient way to build the collection based on the target type. It gives you a single syntax for arrays, lists, spans, and immutable collections.

## Other commonly used features

```csharp
// File-scoped namespace (C# 10): saves one level of indentation
namespace Orders.Api;

// Global using (C# 10): written once, applies to the whole project
global using Microsoft.EntityFrameworkCore;

// Raw string literal (C# 11): no escape characters, ideal for JSON and SQL
var sql = """
    SELECT "Id", "Total"
    FROM "Orders"
    WHERE "Status" = 'Paid'
    """;

// Target-typed new (C# 9)
Dictionary<string, List<int>> map = new();

// Static anonymous function (C# 9): prevents accidentally capturing variables
var adults = people.Where(static p => p.Age >= 18);

// Generic math (C# 11): algorithms independent of the numeric type
static T Sum<T>(IEnumerable<T> values) where T : INumber<T> => values.Aggregate(T.Zero, (a, b) => a + b);
```

## C# 13 and 14

- **`params` collections (C# 13):** declarations like `params ReadOnlySpan<int> values`. A variable number of arguments without allocating an array at the call site.
- **The new `Lock` type (C# 13 / .NET 9):** a more efficient lock when used with the `lock` statement.
- **The `field` keyword (C# 14):** add logic to an accessor without declaring the property's backing field by hand:

```csharp
public string Name
{
    get;
    set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
}
```

- **Extension members (C# 14):** new `extension` blocks for defining extension **properties** and static members alongside extension methods:

```csharp
public static class StringExtensions
{
    extension(string text)
    {
        public bool IsBlank => string.IsNullOrWhiteSpace(text);
        public string Truncate(int max) => text.Length <= max ? text : text[..max] + "…";
    }
}

if (input.IsBlank) { /* ... */ }
```

- **Null-conditional assignment (C# 14):** `customer?.Address = newAddress;` assigns only if the customer isn't `null`.

You don't have to use every feature of a new version. A shared style within the team (`.editorconfig` and analyzers) matters more.

## Asked in interviews

- **"What's the difference between a record and a class?"** A record provides value equality, copying with `with`, and an automatic `ToString`. It suits immutable data carriers.
- **"Why can a list inside a record be a problem?"** Equality and `with` are shallow: the list reference is shared and compared by reference.
- **"Do nullable reference types protect you at runtime?"** No, they're only a compile-time analysis. I still validate external data.
- **"Are primary constructor parameters readonly?"** No. They can be reassigned inside the class. If needed, I copy them into a readonly field.
- **"What's the difference between `required` and a constructor parameter?"** Both enforce assignment. `required` works with object initializer syntax and is more readable for DTOs with many fields.

## Summary

- Records make immutable data modeling easy with value equality and `with`. Their equality is shallow.
- `init` and `required` prevent invalid objects at compile time.
- Switch expressions and patterns (property, relational, list) make branching readable and exhaustive.
- Nullable reference types catch null bugs at compile time; they are not runtime protection.
- Primary constructors and collection expressions reduce ceremony. Primary constructor parameters are not readonly.
- C# 14: the `field` keyword, extension members, and null-conditional assignment.
