---
title: Phase 0 — Solution skeleton
summary: Set up an empty solution and test projects that keep strict rules from the start and build with zero warnings.
---
| Phase summary |  |
| --- | --- |
| **Goal** | Set up an empty solution that keeps strict rules from the start and builds. |
| **What you'll learn** | The dotnet CLI, the .slnx solution format, project references, Directory.Build.props, Central Package Management, .NET analyzers, global.json. |
| **What you'll have at the end of the phase** | A solution with 4 source projects and 4 test projects that builds with zero warnings and is committed to git. |

## Tasks

### 0.1 Folder, git, and solution files

Open a PowerShell terminal in VS Code and run these in order:

```bash
mkdir C:\Pratik; cd C:\Pratik
mkdir LibraryApi; cd LibraryApi
git init
dotnet new gitignore
dotnet new editorconfig
dotnet new globaljson --sdk-version 10.0.402 --roll-forward latestFeature
dotnet new sln -n Library
```

> **Note:** In .NET 10, `dotnet new sln` produces the new, simple XML-based `.slnx` format by default.

### 0.2 Source projects

```bash
dotnet new classlib -n Library.Domain -o src/Library.Domain
dotnet new classlib -n Library.Application -o src/Library.Application
dotnet new classlib -n Library.Infrastructure -o src/Library.Infrastructure
dotnet new webapi -n Library.Api -o src/Library.Api
dotnet sln add src/Library.Domain src/Library.Application src/Library.Infrastructure src/Library.Api
```

### 0.3 Project references

Find the command yourself (hint: `dotnet add <project> reference <target>`). The references you need to set up:

- Application → Domain
- Infrastructure → Application
- Api → Application and Infrastructure

> **Why?** Infrastructure has no direct reference to Domain; it reaches it transitively through Application. No arrows point outward from Domain.

### 0.4 Clean up template leftovers

- Delete the `Class1.cs` files in the class libraries.
- Delete the sample WeatherForecast endpoint and its registration in Api. `Program.cs` should be left almost empty.
- Keep the name of the `.http` file in Api as `Library.Api.http`; you'll fill in its contents in Phase 4.

### 0.5 Directory.Build.props (shared build settings)

Create it in the root folder with `dotnet new buildprops`. Move these settings, which are shared by all projects, into it and remove them from the csproj files:

- `TargetFramework`: net10.0
- `Nullable`: enable
- `ImplicitUsings`: enable
- `TreatWarningsAsErrors`: true (warnings break the build; discipline starts here)
- `AnalysisLevel`: latest-recommended (the recommended rule set of the .NET code analyzers)
- `EnforceCodeStyleInBuild`: true (.editorconfig style rules are also enforced during the build)

### 0.6 Directory.Packages.props (central package management)

Create it in the root folder with `dotnet new packagesprops`, and make sure the `ManagePackageVersionsCentrally` property is true. Move the `Microsoft.AspNetCore.OpenApi` version added by the Api template into this file.

### 0.7 .editorconfig settings

Read the generated file; in particular, check or add the following:

- A preference for file-scoped namespaces, at warning level.
- Warnings for unused `using`s (IDE0005).
- A separate section for migration files that marks them as generated code. Otherwise, the code EF generates can trigger analyzer warnings and break the build.
- Allow underscores in test method names in the test projects (CA1707). You can put a second `.editorconfig` in the `tests/` folder for this.

### 0.8 Test projects

```bash
dotnet new install xunit.v3.templates
dotnet new xunit3 -n Library.Domain.UnitTests -o tests/Library.Domain.UnitTests
dotnet new xunit3 -n Library.Application.UnitTests -o tests/Library.Application.UnitTests
dotnet new xunit3 -n Library.Api.IntegrationTests -o tests/Library.Api.IntegrationTests
dotnet new xunit3 -n Library.ArchitectureTests -o tests/Library.ArchitectureTests
```

Add them to the solution, move the package versions the template wrote into `Directory.Packages.props`, and set up these references: Domain.UnitTests → Domain; Application.UnitTests → Application; IntegrationTests → Api; ArchitectureTests → all four source projects.

### 0.9 First commit

Run `dotnet build` and `dotnet test`, then make your first commit. To open the project in VS Code, you can type `code .` in the root folder.

## Acceptance criteria

- [ ] `dotnet build` finishes with 0 warnings and 0 errors.
- [ ] The csproj files contain no repeated settings such as `TargetFramework` or `Nullable`.
- [ ] No csproj contains a package version; versions live only in `Directory.Packages.props`.
- [ ] The reference directions match the table in [Section 4.1](/tracks/kutuphane-api/mimari) exactly.
- [ ] `dotnet run --project src/Library.Api` starts the application.
- [ ] The `bin/` and `obj/` folders don't get into git.

## What I'll check in the review

- Reference directions and unnecessary references
- The contents of the props files and repetition in the csproj files
- Template files that weren't deleted
- global.json and .editorconfig settings
