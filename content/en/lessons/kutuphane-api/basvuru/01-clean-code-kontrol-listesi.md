---
title: Clean Code checklist
summary: The rules to use when you review your own code in every phase.
---
In every phase, review your code against this list. I'll be checking these rules in the review too.

| Topic | Rule |
| --- | --- |
| Naming | Types and methods in PascalCase, local variables in camelCase, private fields `_camelCase`. Async methods end with `Async`. Booleans start with `Is`, `Has`, `Can`. No abbreviations (`count`, not `cnt`) |
| Classes | `sealed` by default; opened up only if inheritance is really needed. Visibility at the narrowest level possible (`internal`, `private`) |
| Data types | DTOs, commands, queries and events are `record`s. Value objects have value equality |
| Files | One type per file; the file name matches the type name. File-scoped namespaces. The namespace follows the folder path |
| Constants | No magic numbers or strings: use a constant, an enum or Options |
| Methods | Short and single-purpose. Return early with guard clauses; no deeply nested `if`s. If there are more than 3–4 parameters, group them into a type |
| Primitive obsession | Values with meaning (ISBN, email) get their own type |
| Null safety | Don't use the `!` operator to suppress nullable warnings without a reason |
| Async | No `.Result`, `.Wait()` or `async void`. `CancellationToken` is passed through every layer |
| Errors | Expected situations use `Result`; unexpected ones use exceptions. Don't swallow exceptions (no empty `catch`) |
| Dependencies | Constructor injection (primary constructor). No service locator. No creating services with `new` |
| Time | No `DateTime.Now` / `UtcNow`; always `TimeProvider` |
| Comments | Explain “why”, not “what”. Code should explain itself; no dead code left commented out |
| Logging | Use message templates, don't log sensitive data, pick the right level |
| Tests | Arrange / Act / Assert; one behavior per test; descriptive names; tests independent of each other |
| Modern C# | Primary constructors, collection expressions, pattern matching, `required` members: use them where they improve readability |
