---
title: Phase 5 — Authentication and authorization
summary: "JWT login, role-based policies, rate limiting and the end-to-end loan flow."
---
| Phase summary |  |
| --- | --- |
| **Goal** | Bring JWT login, role-based access and the complete loan flow to life. |
| **What you'll learn** | JWT Bearer validation, claims, authorization policies, user secrets, rate limiting, the OpenAPI security scheme. |
| **What you'll have at the end** | An end-to-end tested API where every endpoint in [Section 3.3](/tracks/kutuphane-api/proje-tanimi) works with the correct permissions. |

## Tasks

### 5.1 JWT validation

- Add JwtBearer authentication: validate the issuer, audience, lifetime and signing key. Read the values from `JwtOptions` again; don't repeat the same settings in two places.
- The default `ClockSkew` is 5 minutes; find out why it exists and reduce it.
- Look into the `MapInboundClaims` setting so that .NET doesn't convert incoming claim names into long URIs.

### 5.2 Authorization policies

- Two policies: `Librarian` (role is Librarian) and `Member` (role is Member). Keep the policy names in constants.
- Apply authorization at the route group level wherever possible, not on individual endpoints. Explicitly mark the ones that must stay anonymous with `AllowAnonymous`.
- The authorization matrix must match the table in [Section 3.3](/tracks/kutuphane-api/proje-tanimi) exactly.

### 5.3 Auth, Members and Loans endpoints

Write all the endpoints assigned to Phase 5 in [Section 3.3](/tracks/kutuphane-api/proje-tanimi). Register can return 201 with `Location: /api/v1/members/me`.

### 5.4 Rate limiting

- Apply a fixed window limit, partitioned by IP address, to the login endpoint: 5 attempts per minute.
- Return 429 Too Many Requests when the limit is exceeded.
- Pay attention to where `UseRateLimiter` goes in the middleware pipeline.

### 5.5 Bearer scheme in OpenAPI

So that you can enter a token in Scalar and try the protected endpoints, write a document transformer that adds a Bearer security scheme to the OpenAPI document. Search for: “ASP.NET Core OpenAPI document transformer bearer”.

### 5.6 Extend the .http file

Capture the token from the login response in a variable and use it in subsequent requests (REST Client supports this).

## Test it yourself (end-to-end scenario)

Run this scenario in order. Note down the result of each step:

| # | Step | Expected |
| --- | --- | --- |
| 1 | POST /books without a token | 401 |
| 2 | POST /books with a Member token | 403 |
| 3 | Register: weak password / same email a second time / valid | 400 / 409 / 201 |
| 4 | Login: wrong password; then a 6th attempt within the same minute | 401; then 429 |
| 5 | Log in as Librarian; log in as Member | Two separate tokens |
| 6 | As a Member, borrow 3 different books | 201 × 3 |
| 7 | Try to borrow a 4th book | 409 `Members.LoanLimitReached` |
| 8 | Try to borrow a book you already have again | 409 `Members.AlreadyBorrowedThisBook` |
| 9 | Try to borrow a book that has a single copy currently held by someone else | 409 `Books.NoCopiesAvailable` |
| 10 | Extend a loan; extend the same one again | 204; then 409 |
| 11 | Try to extend another member's loan | 404 or 403 (your decision from Phase 2) |
| 12 | Return a loan as Librarian | 200, `lateFee: 0`, the book's stock went up by one |
| 13 | Move a loan's DueAt into the past with SQL; GET /loans/overdue | The loan is in the list |
| 14 | Try to borrow a new book as that member | 409 `Members.HasOverdueLoans` |
| 15 | Return the overdue loan | 200, fee = days overdue × 5.00 |
| 16 | Deactivate a member with an active loan; try again after the returns | 409; then 204 |
| 17 | Try to borrow as an inactive member | 409 `Members.Inactive` |
| 18 | Send a request with an expired token (temporarily set the lifetime to 1 minute for the test) | 401 |

## Acceptance criteria

- [ ] The repo contains no secrets; the Jwt section in `appsettings.json` has no Secret field.
- [ ] The passwords in the database are hashed.
- [ ] No response returns PasswordHash.
- [ ] The authorization matrix matches the endpoint table exactly.
- [ ] All 18 steps above work as expected.

## What I'll look at in review

- Secret leaks
- Consistency of claim names
- Policies applied to the wrong groups
- User enumeration vulnerabilities
- Middleware order (authentication, authorization, rate limiter)
- Missing token validation parameters
