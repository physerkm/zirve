---
title: EF Core in Depth
summary: DbContext's role as a unit of work, change tracking, IQueryable vs. IEnumerable, the N+1 problem, projection, AsNoTracking, split queries, bulk updates, optimistic concurrency, migration strategies, and choosing between EF Core and Dapper.
---

EF Core is named in the vast majority of .NET job postings. In an interview, saying "I've used EF Core" isn't enough. The interviewer measures this: can you predict the SQL it generates, and can you find and fix a performance problem?

## DbContext: the unit of work

`DbContext` does two jobs: it translates queries into SQL, and it **tracks** the entities it reads (change tracking). When `SaveChangesAsync` is called, it writes all the changes in the tracked entities to the database **in a single transaction**. This is called the *Unit of Work* pattern.

```csharp
var order = await db.Orders.FirstAsync(o => o.Id == id, ct);  // tracking starts
order.MarkAsPaid();                                           // changes only in memory
db.Payments.Add(new Payment(order.Id, amount));
await db.SaveChangesAsync(ct);                                // UPDATE + INSERT, a single transaction
```

That is why writing an extra `IRepository<T>` + `IUnitOfWork` layer on top of EF Core is often unnecessary: `DbSet` is already a repository and `DbContext` is already a unit of work. Teams may still choose this abstraction for easier testing or to preserve the domain language. What matters is being able to explain why.

`DbContext` **is not thread-safe** and should be short-lived (one per request). Running two queries in parallel on the same context with `Task.WhenAll` throws an `InvalidOperationException`.

## Entity states

| State | Meaning | What `SaveChanges` does |
| --- | --- | --- |
| `Added` | Newly added | `INSERT` |
| `Unchanged` | Read, not changed | Nothing |
| `Modified` | At least one property changed | `UPDATE` for the changed columns only |
| `Deleted` | Marked for deletion | `DELETE` |
| `Detached` | Not tracked | Nothing |

Change detection works by comparing a snapshot of the entity taken when it was read with its current state. Tracking thousands of entities costs memory and CPU.

## IQueryable and IEnumerable

```csharp
// 1) The filter runs in the database: WHERE "Status" = 'Paid'
var paid = await db.Orders.Where(o => o.Status == OrderStatus.Paid).ToListAsync(ct);

// 2) The whole table is pulled into memory, and the filter runs in C#
IEnumerable<Order> all = db.Orders;
var paidSlow = all.Where(o => o.Status == OrderStatus.Paid).ToList();
```

`IQueryable` carries an **expression tree** and isn't turned into SQL until a terminal call (`ToListAsync`, `FirstAsync`, `CountAsync`) arrives. The moment you switch to `IEnumerable` (`AsEnumerable`, `ToList`, a parameter typed `IEnumerable`), everything after that runs in memory. A repository method that returns `IEnumerable<Order>` and lets the caller filter it is a classic source of unnoticed full table scans.

## The N+1 problem

```csharp
var orders = await db.Orders.ToListAsync(ct);          // 1 query
foreach (var order in orders)
{
    var count = order.Lines.Count;                      // if lazy loading is on: 1 more query per order
}
```

That's 101 queries for 100 orders. Lazy loading is off by default in EF Core, and keeping it off is recommended. Solutions:

```csharp
// Eager loading: a single query with a JOIN
var orders = await db.Orders.Include(o => o.Lines).ToListAsync(ct);

// Better: select only the columns you need (projection)
var summaries = await db.Orders
    .Select(o => new OrderSummary(o.Id, o.Customer.Name, o.Lines.Count, o.Lines.Sum(l => l.Price * l.Quantity)))
    .ToListAsync(ct);
```

**Projection** is the most effective optimization for read scenarios: fewer columns, less data and no change tracking (anonymous types and DTO types aren't tracked).

### Cartesian explosion and split queries

Including more than one collection with `Include` produces a single JOIN, and the rows multiply: an order with 10 lines and 10 payments returns 100 rows.

```csharp
var orders = await db.Orders
    .Include(o => o.Lines)
    .Include(o => o.Payments)
    .AsSplitQuery()          // a separate query for each collection
    .ToListAsync(ct);
```

Split queries carry a consistency risk: data can change between the queries. Alternatives are running them inside a transaction or summarizing both collections with a projection.

## AsNoTracking

Turn off tracking for data you will only read and not update:

```csharp
var products = await db.Products.AsNoTracking().Where(p => p.IsActive).ToListAsync(ct);
```

For a read-heavy context you can also change the default: `optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)`.

## Bulk updates and deletes

It used to be that updating a thousand rows meant loading a thousand entities into memory. Since EF Core 7, a single SQL command is enough:

```csharp
await db.Sessions
    .Where(s => s.ExpiresAt < DateTime.UtcNow)
    .ExecuteDeleteAsync(ct);

await db.Products
    .Where(p => p.CategoryId == categoryId)
    .ExecuteUpdateAsync(set => set.SetProperty(p => p.Price, p => p.Price * 1.10m), ct);
```

These commands **bypass** the change tracker: tracked entities in memory are not updated, and `SaveChanges` interceptors don't run.

## Optimistic concurrency

Two users updating the same record at the same time leads to a lost update. EF Core's solution is a **concurrency token**:

```csharp
public class Product
{
    public Guid Id { get; set; }
    public int Stock { get; set; }

    [Timestamp] public byte[] RowVersion { get; set; } = [];   // SQL Server: rowversion
}
// PostgreSQL (Npgsql): the xmin system column can be used:
// modelBuilder.Entity<Product>().Property<uint>("xmin").IsRowVersion();
```

EF Core writes the update as `UPDATE ... WHERE Id = @id AND RowVersion = @old`. If the number of affected rows is 0, someone else has changed the record, and a `DbUpdateConcurrencyException` is thrown. The application can catch it and return `409 Conflict` to the user, or reread the record and try again.

## Transactions

`SaveChangesAsync` is already a transaction on its own. If you need to group several `SaveChanges` calls or raw SQL in the same transaction:

```csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);
// ... several operations and SaveChangesAsync ...
await tx.CommitAsync(ct);
```

If connection resiliency (`EnableRetryOnFailure`) is on, manually opened transactions must run inside an **execution strategy**; otherwise a retry starts from the middle of the transaction:

```csharp
var strategy = db.Database.CreateExecutionStrategy();
await strategy.ExecuteAsync(async () =>
{
    await using var tx = await db.Database.BeginTransactionAsync(ct);
    // ...
    await tx.CommitAsync(ct);
});
```

## Performance tools

- **See the SQL:** `optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information)` or `query.ToQueryString()`.
- **Compiled queries:** translate the expression tree of a frequently run query only once. `EF.CompileAsyncQuery((AppDbContext db, Guid id) => db.Orders.First(o => o.Id == id))`.
- **DbContext pooling:** `AddDbContextPool<AppDbContext>()` reuses context objects. The context must not hold per-request state.
- **Global query filters:** automatically add a `WHERE` to every query for soft delete and multi-tenancy. `HasQueryFilter(o => !o.IsDeleted && o.TenantId == tenantId)`. Turn them off when needed with `IgnoreQueryFilters()`.
- **Interceptors:** for filling in audit fields (`CreatedAt`, `UpdatedBy`) before `SaveChanges`, or for collecting domain events.

## Migrations

```bash
dotnet ef migrations add AddOrderNumber
dotnet ef migrations script --idempotent -o migrate.sql   # reviewable SQL for production
dotnet ef migrations bundle                               # a single-file executable bundle
```

Running migrations in production at application startup with `Database.Migrate()` can lead to races and long locks when several instances start at the same time. The safer way is to run them as a separate step in the deployment pipeline.

**Expand/contract for zero-downtime deployments:** you don't rename a column directly. First you add the new column and write to both, migrate the data, switch the code to read from the new column, and finally drop the old column. That way old and new versions of the application can work with the same schema during the deployment.

## EF Core or Dapper?

| | EF Core | Dapper |
| --- | --- | --- |
| What you write | LINQ | SQL |
| Change tracking, migrations | Yes | No |
| Control | EF generates the SQL | The SQL is entirely yours |
| Speed | Very close, with projection and no-tracking | Closest to raw ADO.NET |
| Best fit | The write side, domain models, CRUD | Complex reports, performance-critical reads |

A common and defensible approach is to use both: writes and business rules with EF Core, heavy reads and reports with raw SQL through Dapper or EF Core's `SqlQuery<T>` method. This is the simple form of CQRS in practice.

## Asked in interviews

- **"What is N+1, and how do you find it?"** One query for the list, plus one more for each item. I see the same query repeating in the SQL logs. I fix it with `Include` or a projection.
- **"When do you use AsNoTracking?"** For data that will only be read and not updated.
- **"Two users decrement the same stock. How do you protect it?"** A concurrency token (rowversion/xmin) and `DbUpdateConcurrencyException`. Or an atomic `UPDATE ... SET Stock = Stock - 1 WHERE Stock >= 1`.
- **"Is the repository pattern necessary with EF Core?"** DbSet and DbContext are already a repository and a unit of work. Write an extra layer only if it brings a benefit.
- **"How do you rename a column with zero downtime?"** Expand/contract. First add the new column and write to both, then migrate, and finally drop the old one.

## Summary

- `DbContext` is a short-lived unit of work. `SaveChanges` writes the changes in a single transaction.
- `IQueryable` is translated to SQL, `IEnumerable` runs in memory. Know where that line is.
- Solve N+1 with `Include` or projection, and cartesian explosion with split queries. Use `AsNoTracking` for reads.
- Use `ExecuteUpdate`/`ExecuteDelete` for bulk operations and rowversion for concurrency.
- Run migrations in the deployment pipeline. Make breaking schema changes with expand/contract.
