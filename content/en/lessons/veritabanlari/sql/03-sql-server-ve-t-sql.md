---
title: SQL Server and T-SQL
summary: SQL Server for someone who knows PostgreSQL, syntax differences, clustered and nonclustered indexes, INCLUDE columns, lock-based concurrency and RCSI, the danger of NOLOCK, stored procedures, parameter sniffing, reading execution plans, and temp tables.
---

The vast majority of .NET job postings in Turkey ask for **MSSQL**: it appears in 9 of 18 postings, often ahead of PostgreSQL. A large share of banking, insurance, logistics and enterprise software runs on SQL Server. Zirve's database lessons are taught with PostgreSQL. This lesson covers the SQL Server equivalents of the same concepts, plus the SQL Server-specific topics that come up in interviews.

## Syntax differences

| Topic | PostgreSQL | SQL Server (T-SQL) |
| --- | --- | --- |
| First N rows | `LIMIT 10` | `SELECT TOP (10) ...` |
| Pagination | `LIMIT 20 OFFSET 40` | `ORDER BY ... OFFSET 40 ROWS FETCH NEXT 20 ROWS ONLY` |
| Auto-increment | `GENERATED ALWAYS AS IDENTITY` | `INT IDENTITY(1,1)` |
| Unicode text | `text`, `varchar` (always Unicode) | `NVARCHAR(n)`. `VARCHAR` uses a single-byte code page (use `NVARCHAR` or a UTF-8 collation for characters such as Turkish letters) |
| Unbounded text | `text` | `NVARCHAR(MAX)` |
| Date-time | `timestamptz` | `DATETIME2`, `DATETIMEOFFSET` with a time zone (`DATETIME` is legacy; don't use it) |
| Boolean | `boolean` | `BIT` |
| GUID | `uuid` | `UNIQUEIDENTIFIER` |
| Returning the inserted row | `RETURNING id` | `OUTPUT INSERTED.Id` |
| Identifier quoting | `"Orders"` | `[Orders]` |
| String concatenation | `\|\|` | `+` or `CONCAT()` |
| Upsert | `INSERT ... ON CONFLICT DO UPDATE` | `MERGE`, or `UPDATE` + `INSERT` with lock hints |
| Case sensitivity | Case-sensitive by default | **Depends on the collation**; the default is usually case-insensitive (`CI`) |

```sql
SELECT o.Id, o.Total, c.Name
FROM dbo.Orders AS o
JOIN dbo.Customers AS c ON c.Id = o.CustomerId
WHERE o.Status = N'Paid'
ORDER BY o.CreatedAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;
```

The `N'...'` prefix makes a string Unicode (`NVARCHAR`). Comparing an `NVARCHAR` column with a `VARCHAR` parameter (or vice versa) can cause an **implicit conversion** and prevent the index from being used. That's why it matters that parameter types match column types in EF Core and Dapper.

## Clustered and nonclustered indexes

This is SQL Server's most important difference, and it is sure to come up in an interview.

- **Clustered index:** it **is** the table. The rows physically live in a B-tree sorted by this key. There can be only **one** per table. By default, the primary key is clustered.
- **Nonclustered index:** a separate B-tree. Its leaf nodes hold the index columns and the **clustered key** used to find the row.

```mermaid
flowchart LR
    Q["WHERE Email = 'ada@...'"] --> NC[Nonclustered index: Email]
    NC -->|Clustered key: Id=8412| CI[Clustered index: Id]
    CI --> R[All columns of the row]
```

Going back to the clustered index to fetch the other columns for each row found in a nonclustered index is called a **key lookup**. For queries that return many rows this is expensive, and the optimizer may choose not to use the index at all and scan the table instead.

The solution is a **covering index**:

```sql
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Date
ON dbo.Orders (CustomerId, CreatedAt DESC)
INCLUDE (Total, Status);       -- stored in the leaf, not part of the sort order
```

If the query asks only for `CustomerId`, `CreatedAt`, `Total` and `Status`, everything is in the index and there is no key lookup. PostgreSQL has supported `INCLUDE` since version 11, but there the table is a heap and there is no concept of a clustered index. The concept is the same; the reasoning is different.

### Choosing the clustered key

A good clustered key should be **narrow, unique, unchanging and ever-increasing**:

- **Narrow:** every nonclustered index carries the clustered key. A wide key bloats all indexes.
- **Ever-increasing:** new rows are appended at the end.
- If a **random GUID** (`NEWID()`) is the clustered key, every insert goes to a random page of the B-tree: **page splits** and fragmentation. Solutions: `NEWSEQUENTIALID()`, generating sequential GUIDs in the application (`Guid.CreateVersion7()` in .NET 9 is time-ordered), or a `BIGINT IDENTITY` clustered key with the GUID as a separate unique column.

## Concurrency: locks and row versioning

PostgreSQL uses **MVCC**: readers don't wait for writers, and writers don't wait for readers. SQL Server's default, however, is **lock-based**: at the default `READ COMMITTED` level, a read waits for the lock on a row that is being written to be released. In busy systems this leads to read–write blocking and deadlocks.

The solution is to turn on row versioning:

```sql
ALTER DATABASE Orders SET READ_COMMITTED_SNAPSHOT ON;
```

With **RCSI** (Read Committed Snapshot Isolation) on, readers don't wait for locks; they read the last committed version from the version store in `tempdb`. You get behavior similar to PostgreSQL. It is on by default in Azure SQL Database. In addition, the `SNAPSHOT` isolation level gives a consistent view for the whole transaction.

### The NOLOCK trap

```sql
SELECT * FROM dbo.Orders WITH (NOLOCK) WHERE ...
```

It is common in old codebases and is mistaken for a "performance hint." In reality it means `READ UNCOMMITTED`: it reads **uncommitted** data (which may be rolled back), and during page splits it can read the same row twice or not at all. In a financial report it produces wrong totals. The right fix for blocking is RCSI. This explanation is the expected answer to the interview question "would you use NOLOCK?"

### Lock escalation and deadlocks

SQL Server can **escalate** a large number of row locks (the default threshold is about 5,000) into a single **table lock** (lock escalation). A large bulk update can lock the entire table. Splitting bulk jobs into small batches prevents this.

When a deadlock occurs, SQL Server picks one of the participants as the victim and rolls back its transaction (error 1205). The application should treat this error as **retryable**. EF Core's `EnableRetryOnFailure` setting does this. The lasting fix is to keep transactions short and access tables in the same order everywhere.

## Stored procedures

```sql
CREATE OR ALTER PROCEDURE dbo.GetCustomerOrders
    @CustomerId INT,
    @Since DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Total, Status, CreatedAt
    FROM dbo.Orders
    WHERE CustomerId = @CustomerId AND CreatedAt >= @Since
    ORDER BY CreatedAt DESC;
END
```

```csharp
var orders = await connection.QueryAsync<OrderRow>(
    "dbo.GetCustomerOrders", new { CustomerId = 7, Since = since }, commandType: CommandType.StoredProcedure);
// EF Core: db.Database.SqlQuery<OrderRow>($"EXEC dbo.GetCustomerOrders {customerId}, {since}")
```

| Pros | Cons |
| --- | --- |
| Close to the data, fewer network round trips | Business logic is split across two places, hard to test |
| Permissions: a user can be granted rights only to the procedure, not the table | Versioning and deployment must be managed separately from the application |
| Can be tuned by the DBA | No portability (tied to the database) |

In modern applications, business logic usually lives in the application layer. Stored procedures are used for heavy batch jobs and reports. In enterprise job postings you're expected to know them for maintaining legacy systems.

Error handling is done with `TRY...CATCH`, and transactions with `BEGIN TRAN ... COMMIT`. `SET XACT_ABORT ON` makes the transaction roll back completely on any error and is a good default.

## Parameter sniffing

When a query or procedure runs for the first time, SQL Server compiles a plan **based on that first parameter value** and caches it. Subsequent calls use the same plan.

The problem: the customer with `CustomerId = 7` has 3 orders, while the enterprise customer with `CustomerId = 1` has 2 million. If the first call comes in with 7, an index seek plan gets cached. A call with 1 then does millions of key lookups with the same plan and takes minutes. This is the classic cause of the "it was fast yesterday, it's slow today and nothing changed" complaint.

Solutions:

- `OPTION (RECOMPILE)`: a new plan on every execution. It adds compilation cost; use it carefully on frequently run queries.
- `OPTION (OPTIMIZE FOR (@CustomerId UNKNOWN))`: a plan based on the average distribution.
- **Query Store**: keeps plan history, shows regressions and lets you force a good plan. In SQL Server 2022, *Parameter Sensitive Plan optimization* can keep multiple plans for the same query.

## Reading execution plans

In SSMS, use "Include Actual Execution Plan" (`Ctrl+M`) or `SET STATISTICS IO, TIME ON`:

| Operator | Meaning |
| --- | --- |
| **Index Seek** | Direct positioning via an index. Usually good |
| **Index Scan / Clustered Index Scan** | Scanning the whole index or table. Usually bad on a large table |
| **Key Lookup** | Going back to the clustered index for missing columns after a nonclustered index. If there are many, consider `INCLUDE` |
| **Nested Loops / Hash Match / Merge Join** | Join algorithms. Nested loops for few rows, hash for large, unsorted data |
| **Sort** | Can consume memory and `tempdb`. Avoidable if an index can provide sorted data |

Signs to look for: **a big gap between estimated and actual row counts** (stale statistics or parameter sniffing), warning icons (implicit conversion, a sort spilling to `tempdb`), and high "logical reads" in the `STATISTICS IO` output.

Write **SARGable** (index-friendly) conditions: `WHERE YEAR(CreatedAt) = 2026` can't use an index. `WHERE CreatedAt >= '2026-01-01' AND CreatedAt < '2027-01-01'` can. Wrapping the column in a function prevents an index seek. This rule applies to PostgreSQL as well.

## Temporary data: temp tables, table variables, CTEs

| | `#TempTable` | `@TableVariable` | CTE (`WITH`) |
| --- | --- | --- | --- |
| Where it is stored | `tempdb` | `tempdb` | Not stored; part of the query |
| Statistics and indexes | Yes | Limited | None |
| Good for | Large intermediate results, data used more than once | Small sets | Readability, recursion |

To send many rows from the application in one go, use a **table-valued parameter** (TVP). You make a single call instead of thousands of separate `INSERT`s. For bulk loading, `SqlBulkCopy` is the fastest way.

## Asked in interviews

- **"What's the difference between a clustered and a nonclustered index?"** The clustered index is the table itself and keeps rows sorted; there is one per table. A nonclustered index is a separate structure that points to the clustered key.
- **"What is a key lookup, and how do you eliminate it?"** Going back to the clustered index for missing columns after a nonclustered index. A covering index with `INCLUDE`.
- **"Should you use a GUID as the clustered key?"** A random GUID causes fragmentation. I prefer a sequential GUID or `BIGINT IDENTITY`.
- **"Would you use NOLOCK?"** No. It reads uncommitted and inconsistent data. I solve blocking with RCSI.
- **"A procedure is sometimes fast and sometimes very slow. Why?"** Most likely parameter sniffing. I compare plans with Query Store and consider `RECOMPILE` or plan forcing.
- **"Why is `WHERE YEAR(OrderDate) = 2026` slow?"** It isn't SARGable. Because it wraps the column in a function, the index can't be used. I write a range condition.

## Summary

- The syntax differences are small: `TOP`, `OFFSET/FETCH`, `IDENTITY`, `NVARCHAR`, `OUTPUT`, collation.
- The clustered index is the table itself. Its key should be narrow, unique, unchanging and increasing. Eliminate key lookups with `INCLUDE`.
- The default lock-based reads lead to blocking. The fix is RCSI, not NOLOCK.
- Stored procedures belong in batch jobs and reports. Use `SET XACT_ABORT ON` and `TRY...CATCH`.
- Parameter sniffing is the classic cause of "sometimes slow" problems. In the execution plan, look at the gap between estimated and actual rows, and write SARGable conditions.
