---
title: SQL Queries and Joins
summary: The logical execution order of a query, join types, NULL's three-valued logic, grouping and window functions. The classic SQL patterns asked in interviews.
---

In backend interviews, SQL is often not a separate round; it comes up inside a coding or system design round as "how would you get this with a single query?" What's expected is not memorized syntax but the ability to explain, step by step, **what the query does to the rows**.

The examples in this lesson are written for PostgreSQL and use these tables:

```sql
CREATE TABLE customers (
    id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  text NOT NULL,
    city  text
);

CREATE TABLE orders (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES customers (id),
    total       numeric(12, 2) NOT NULL,
    status      text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
```

## The order in which a query runs

The order in which we write SQL differs from the order in which the database **logically** evaluates it:

| Order | Clause | What it does |
| --- | --- | --- |
| 1 | `FROM`, `JOIN` | Builds the source rows |
| 2 | `WHERE` | Filters individual rows |
| 3 | `GROUP BY` | Collects rows into groups |
| 4 | `HAVING` | Filters groups |
| 5 | `SELECT` | Computes columns and expressions |
| 6 | `DISTINCT` | Removes duplicates |
| 7 | `ORDER BY` | Sorts |
| 8 | `LIMIT` / `OFFSET` | Truncates the result |

This table answers many "why doesn't this work?" questions:

- You can't use an alias defined in `SELECT` inside `WHERE`; that name hasn't been computed yet. You can use it in `ORDER BY`.
- You can't use an aggregate function such as `COUNT(*)` inside `WHERE`; the groups don't exist yet. A condition on a group goes in `HAVING`.
- `LIMIT` is applied last; if no ordering is specified, "the first 10 rows" is undefined.

In practice the planner may perform operations in a different order (e.g. it can push a condition before a join), but the result is always defined by this logical order.

## Join types

| Join | Result |
| --- | --- |
| `INNER JOIN` | Only rows that match on both sides |
| `LEFT JOIN` | All rows on the left; if there's no match on the right, the right columns are `NULL` |
| `RIGHT JOIN` | The mirror of `LEFT JOIN`; in practice you swap the tables and write `LEFT` |
| `FULL JOIN` | All rows on both sides; the side without a match is `NULL` |
| `CROSS JOIN` | The Cartesian product: every left row × every right row |

Joining a table to itself (a **self join**) is also asked often, e.g. "employees who earn more than their manager."

```sql
SELECT e.name
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;
```

### Customers with no orders

The classic "find the ones without a match" question. There are two correct answers:

```sql
-- 1) LEFT JOIN + IS NULL (anti-join)
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- 2) NOT EXISTS
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

PostgreSQL usually runs both forms with the same efficient "anti join" plan. `NOT EXISTS` states the intent more clearly.

### The most common join mistake

Writing a `LEFT JOIN` and putting a condition on the right table in `WHERE` silently turns the join into an `INNER JOIN`:

```sql
-- Goal: all customers and their delivered orders (if any)
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'delivered';     -- WRONG: customers without orders were dropped
```

For customers without a match, `o.status` is `NULL`; since `NULL = 'delivered'` isn't true, those rows fall out. The fix is to move the condition into `ON`:

```sql
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'delivered'
```

Rule: **a condition that filters the right table goes in `ON`; a condition that filters the result goes in `WHERE`.**

### Joins multiply rows

In a one-to-many relationship, a join repeats the row on the "one" side as many times as there are matches. If you join two separate "many" tables in the same query and aggregate, the result inflates:

```sql
-- Each customer's order total and number of support tickets: WRONG
SELECT c.id, SUM(o.total), COUNT(t.id)
FROM customers c
LEFT JOIN orders o  ON o.customer_id = c.id
LEFT JOIN tickets t ON t.customer_id = c.id
GROUP BY c.id;
```

A customer with 3 orders and 2 tickets produces 3 × 2 = 6 rows: the total doubles and the ticket count triples. The solution is to aggregate each "many" table **separately** first and then join (with a subquery or a CTE).

## NULL and three-valued logic

`NULL` means "unknown"; it is not a value. Comparisons can evaluate to `TRUE`, `FALSE` or `UNKNOWN`, and `WHERE` lets through only the rows that are `TRUE`.

| Expression | Result |
| --- | --- |
| `NULL = NULL` | `UNKNOWN` (not true!) |
| `NULL <> 1` | `UNKNOWN` |
| `x IS NULL` | `TRUE` or `FALSE` |
| `NULL IS NOT DISTINCT FROM NULL` | `TRUE` |
| `TRUE OR NULL` | `TRUE` |
| `FALSE AND NULL` | `FALSE` |

The trap that catches people most often in interviews is `NOT IN`:

```sql
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM legacy_orders);
```

If the subquery returns even a single `NULL`, this query **returns no rows at all**. The expression `id NOT IN (1, NULL)` means `id <> 1 AND id <> NULL`; since the second part is always `UNKNOWN`, the whole condition is never `TRUE`. `NOT EXISTS` doesn't suffer from this problem; use it by default.

Aggregate functions also skip `NULL`s:

- `COUNT(*)` counts rows; `COUNT(city)` counts only the rows where `city` is not `NULL`.
- `AVG(score)` doesn't include `NULL` scores in the denominator; if you want to treat `NULL` as zero, write `AVG(COALESCE(score, 0))`.
- `SUM` over an empty set returns `NULL`, not zero.

## Grouping

```sql
-- Cities with more than 5 orders in 2025, from most to fewest
SELECT c.city, COUNT(*) AS order_count, SUM(o.total) AS revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at >= '2025-01-01' AND o.created_at < '2026-01-01'
GROUP BY c.city
HAVING COUNT(*) > 5
ORDER BY order_count DESC;
```

- `WHERE` removes rows **before** grouping; it is cheap and can use an index. If a condition is at the row level, put it in `WHERE`, not `HAVING`.
- Every non-aggregated column in the `SELECT` list must appear in `GROUP BY`. (When grouping by the primary key, PostgreSQL allows other columns of the same table, because they are determined by the key.)
- Write date ranges as `created_at >= start AND created_at < end`; wrapping the column in a function such as `EXTRACT(YEAR FROM created_at) = 2025` prevents index use.

### Finding duplicate records

```sql
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

## Subqueries and CTEs

Common table expressions (CTEs) defined with `WITH` make long queries readable step by step:

```sql
WITH customer_totals AS (
    SELECT customer_id, SUM(total) AS spent
    FROM orders
    GROUP BY customer_id
)
SELECT c.name, t.spent
FROM customer_totals t
JOIN customers c ON c.id = t.customer_id
WHERE t.spent > 10000;
```

Since PostgreSQL 12, CTEs that are used only once are inlined into the main query, so writing a CTE no longer carries a performance cost. `WITH RECURSIVE` is used for tree and hierarchy queries (a category tree, a management chain).

## Window functions

A window function computes over a group of rows **without collapsing** them into a single row the way `GROUP BY` does. Each row stays in place and gets a value added next to it.

```sql
SELECT
    customer_id,
    created_at,
    total,
    SUM(total) OVER (PARTITION BY customer_id ORDER BY created_at) AS running_total,
    LAG(total) OVER (PARTITION BY customer_id ORDER BY created_at)  AS previous_total
FROM orders;
```

- `PARTITION BY`: defines the groups (each customer is computed separately).
- `ORDER BY`: defines the order within the group; running totals and functions such as `LAG`/`LEAD` work according to it.

The difference between the ranking functions shows up with ties. If the salaries are 100, 100, 90:

| Function | Result | Rule |
| --- | --- | --- |
| `ROW_NUMBER()` | 1, 2, 3 | A unique number for each row; the order among ties is arbitrary |
| `RANK()` | 1, 1, 3 | Ties get the same rank, and a gap follows |
| `DENSE_RANK()` | 1, 1, 2 | Ties get the same rank, with no gap |

### Top N per group

"The top 3 earners in each department" is the most classic use of window functions:

```sql
SELECT department_id, name, salary
FROM (
    SELECT department_id, name, salary,
           DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk <= 3;
```

Because window functions are computed after `WHERE`, you can't write `WHERE rnk <= 3` at the same level; that's why the subquery is needed.

The "second highest salary" question follows the same pattern: rank with `DENSE_RANK` and select the row with `rnk = 2`. To handle equal salaries correctly, use `DENSE_RANK`, not `ROW_NUMBER`; if there is no second highest salary, the query returns an empty result, and mentioning this in the interview leaves a good impression.

## Writing SQL in an interview

1. Confirm the tables and relationships out loud: "A customer can have multiple orders, right?"
2. Think about how joins will change the row count; watch out for inflated totals in one-to-many relationships.
3. Handle columns that may be `NULL` and empty groups explicitly.
4. Ask what should happen with ties (two people with the same salary, two orders with the same date).

## Summary

- Logical order: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`.
- In a `LEFT JOIN`, a condition on the right table goes in `ON`; otherwise the join turns into an `INNER` join.
- `NULL` comparisons produce `UNKNOWN`; use `NOT EXISTS` instead of `NOT IN`.
- One-to-many joins multiply rows; aggregate multiple "many" tables separately before joining them.
- Window functions compute over a group without removing rows; they are the key to "top N per group" and "Nth largest" questions.
