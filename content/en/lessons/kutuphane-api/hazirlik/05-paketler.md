---
title: Packages
summary: Which NuGet package goes into which project, in which phase and for what purpose.
---
You'll add the packages below in the relevant phase. I'm not giving version numbers: pick the **latest stable** version compatible with .NET 10 from NuGet.org or with the `dotnet package search <package-name>` command. That's part of the learning too.

| Project | Package | Purpose | Phase |
| --- | --- | --- | --- |
| Domain | (none) | The Domain stays pure C# | 1 |
| Application | FluentValidation, FluentValidation.DependencyInjectionExtensions | Validation rules and DI registration | 2 |
| Application | Scrutor | Automatic handler scanning and decorator registration | 2 |
| Application | Microsoft.Extensions.Logging.Abstractions | `ILogger` for the logging decorator | 2 |
| Infrastructure | Microsoft.EntityFrameworkCore.SqlServer | EF Core + SQL Server | 3 |
| Infrastructure | Microsoft.Extensions.Identity.Core | A ready-made, secure `PasswordHasher` (PBKDF2) | 3 |
| Infrastructure | Microsoft.IdentityModel.JsonWebTokens | JWT generation (`JsonWebTokenHandler`) | 3 |
| Infrastructure | Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore | Database health check | 6 |
| Api | Microsoft.AspNetCore.OpenApi | The OpenAPI document (already in the template) | 0 |
| Api | Microsoft.EntityFrameworkCore.Design | Migration tooling (must be in the startup project) | 3 |
| Api | Scalar.AspNetCore | A UI for trying out the API from the browser | 4 |
| Api | Microsoft.AspNetCore.Authentication.JwtBearer | Validating incoming JWTs | 5 |
| Api | Serilog.AspNetCore | Structured logging | 6 |
| All tests | xunit.v3, xunit.runner.visualstudio, Microsoft.NET.Test.Sdk | Test infrastructure (comes with the template) | 0 |
| All tests | Shouldly | Readable assertions | 1 |
| Application.UnitTests | NSubstitute | Mocking interfaces | 2 |
| Unit + Integration | Microsoft.Extensions.TimeProvider.Testing | Controlling time with `FakeTimeProvider` | 1 |
| IntegrationTests | Microsoft.AspNetCore.Mvc.Testing | Spinning up the API in memory with `WebApplicationFactory` | 7 |
| ArchitectureTests | NetArchTest.Rules | Testing layer dependencies | 1 |

> **Tip:** With Central Package Management enabled, `dotnet add package` writes the version to `Directory.Packages.props` and the reference to the csproj without a version. If a template has added a versioned reference to the csproj, you'll get error NU1008; you need to move the version to the props file and remove it from the csproj.
