---
title: "Project definition: Library Management API"
summary: Entities, 17 business rules (BR-01…BR-17), the endpoint list and error responses.
---
You'll write a REST API that manages a library's authors, books, members and loans. The system has two roles: **Librarian** (manages the catalog and returns) and **Member** (borrows books and extends loans). I chose this domain because it has real business rules beyond CRUD: a loan limit, late fees, stock tracking, concurrency. The value of Clean Architecture shows up precisely when you put these rules in the right place.

## 3.1 Entities

| Entity | Fields | Notes |
| --- | --- | --- |
| **Author** | Id, FirstName, LastName, Biography (optional), CreatedAt, UpdatedAt | FullName is a computed property |
| **Book** | Id, Title, Isbn, PublicationYear, AuthorId, TotalCopies, AvailableCopies, IsDeleted, DeletedAt, RowVersion, CreatedAt, UpdatedAt | Isbn is a value object. RowVersion is for concurrency control. Deletion is a soft delete |
| **Member** | Id, FullName, Email, PasswordHash, Role, IsActive, CreatedAt, UpdatedAt | Email is a value object. Role: Member or Librarian |
| **Loan** | Id, BookId, MemberId, BorrowedAt, DueAt, ReturnedAt (nullable), IsExtended, LateFee | If ReturnedAt is null, the loan is active |

> **Info:** All time fields will be `DateTimeOffset`, and their values will always come from `TimeProvider` in UTC. Ids will be `Guid`s (version 7).

## 3.2 Business rules

These rules are the heart of the project. When writing code, writing tests and during review, we'll always refer to these codes (BR-xx).

| Code | Rule |
| --- | --- |
| BR-01 | An ISBN must have 13 digits and a correct ISBN-13 check digit. Hyphens and spaces in the input are accepted and stripped before storing. |
| BR-02 | An ISBN is unique in the system. |
| BR-03 | The publication year must be between 1450 and the current year. |
| BR-04 | TotalCopies is at least 1. AvailableCopies never drops below 0 and never exceeds TotalCopies. |
| BR-05 | A book with no available copies left cannot be lent out. |
| BR-06 | A member can hold at most **3** active loans at a time. |
| BR-07 | A member with an overdue loan (past due and not returned) cannot borrow a new book. |
| BR-08 | An inactive member cannot borrow books. |
| BR-09 | The loan period is **14 days**. |
| BR-10 | A loan can be extended only **once**, by **7 days**. An overdue loan cannot be extended. |
| BR-11 | If a return is late, a fee of **5.00 TL** is charged for each full day overdue. |
| BR-12 | A returned loan cannot be returned again or extended. |
| BR-13 | An author who has books cannot be deleted. |
| BR-14 | A book with an active loan cannot be deleted. Deleting a book is a soft delete. |
| BR-15 | A member with an active loan cannot be deactivated. |
| BR-16 | An email is unique in the system; it is trimmed and converted to lowercase. |
| BR-17 | A member cannot borrow the same book twice at the same time. |

> **Warning:** Values like 3, 14, 7 and 5.00 must not be buried in the code as “magic numbers”. Keep them in a single place in the Domain layer as constants with meaningful names (e.g. a static class called `LendingPolicy`).

## 3.3 Endpoint list

All paths start with the `/api/v1` prefix. The “Phase” column shows in which phase you'll write the endpoint.

| Method | Path | Authorization | Description | Success | Phase |
| --- | --- | --- | --- | --- | --- |
| POST | /auth/register | Anonymous | Member registration (BR-16) | 201 | 5 |
| POST | /auth/login | Anonymous + rate limit | Returns a JWT | 200 | 5 |
| GET | /authors | Anonymous | Paged list | 200 | 4 |
| GET | /authors/{id} | Anonymous | Details | 200 | 4 |
| POST | /authors | Librarian | Create an author | 201 | 4 |
| PUT | /authors/{id} | Librarian | Update an author | 204 | 4 |
| DELETE | /authors/{id} | Librarian | Delete an author (BR-13) | 204 | 4 |
| GET | /books | Anonymous | Search, filter, sort, paging | 200 | 4 |
| GET | /books/{id} | Anonymous | Details (with the author name) | 200 | 4 |
| POST | /books | Librarian | Create a book | 201 | 4 |
| PUT | /books/{id} | Librarian | Update title and year | 204 | 4 |
| POST | /books/{id}/copies | Librarian | Add copies | 204 | 4 |
| DELETE | /books/{id} | Librarian | Soft delete (BR-14) | 204 | 4 |
| GET | /members/me | Any logged-in user | My own profile | 200 | 5 |
| GET | /members | Librarian | Paged member list | 200 | 5 |
| POST | /members/{id}/deactivate | Librarian | Deactivate a member (BR-15) | 204 | 5 |
| POST | /loans | Member | Borrow a book (body: bookId) | 201 | 5 |
| POST | /loans/{id}/extend | Member (owner only) | Extend the loan (BR-10) | 204 | 5 |
| POST | /loans/{id}/return | Librarian | Take a return, calculate the fee | 200 | 5 |
| GET | /loans/me | Member | My loans | 200 | 5 |
| GET | /loans/overdue | Librarian | Overdue loans | 200 | 5 |
| GET | /health (no prefix) | Anonymous | Health check | 200 | 6 |

### List query parameters

- `page`: default 1, at least 1.
- `pageSize`: default 20, between 1 and 100.
- `search`: searches the title (books) or the full name (authors, members).
- `authorId`: a filter on the book list only.
- `sortBy`: for books, `title`, `year`, `createdAt`. Any other value returns 400.
- `sortOrder`: `asc` or `desc`.

The fields of a paged response: `items`, `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`.

## 3.4 Error responses

All error responses will be in the RFC 9457 **ProblemDetails** format: `type`, `title`, `status`, `detail`, `instance`, plus `traceId`. Validation errors also include a per-field `errors` dictionary. We'll carry the error code (e.g. `Books.NoCopiesAvailable`) in the `title` field so the client can make decisions based on it.

| Error type (ErrorType) | HTTP | Example |
| --- | --- | --- |
| Validation | 400 Bad Request | Empty title, pageSize = 500 |
| Unauthorized | 401 Unauthorized | Wrong email or password |
| Forbidden | 403 Forbidden | An operation not permitted by the rules |
| NotFound | 404 Not Found | A nonexistent book id |
| Conflict | 409 Conflict | Duplicate ISBN, no copies, limit reached, already returned, concurrency conflict |
| Failure (unexpected) | 500 Internal Server Error | An unhandled exception. Details are shown only in the Development environment |
