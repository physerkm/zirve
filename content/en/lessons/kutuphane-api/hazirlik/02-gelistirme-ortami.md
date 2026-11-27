---
title: Your development environment
summary: The tools you need, recommended VS Code extensions and the project location.
---
The guide was written for the environment below. The commands are for Windows and PowerShell; if you work on another operating system, you'll need to adapt the paths and the database to your environment.

| Tool | Version in the guide | In this project |
| --- | --- | --- |
| .NET SDK | 10.0.402 | Projects will target `net10.0` (.NET 10 is an LTS release) |
| VS Code | 1.143 | The main editor. Install the extensions below |
| SQL Server LocalDB | `MSSQLLocalDB` instance | The development and test database. Verify it's installed with `sqllocaldb info` |
| PostgreSQL | 18 (optional) | For the database-swap exercise in the bonus phase |
| Git | 2.56 | A commit for each phase |
| Docker | Not required | We'll run integration tests against LocalDB instead of Testcontainers. Docker comes in the bonus phase |

## 2.1 Recommended VS Code extensions

- **C# Dev Kit** (Microsoft): IntelliSense, the test explorer, the solution view.
- **REST Client** (Huachao Mao): for sending requests from `.http` files. (C# Dev Kit also has its own `.http` support; pick one.)
- **SQL Server (mssql)** (Microsoft): for connecting to LocalDB and viewing tables and data.
- **EditorConfig for VS Code**: for applying `.editorconfig` rules in the editor.

## 2.2 Project location

Create the project in a short folder path with no spaces; the commands in the guide use the path `C:\Pratik\LibraryApi`. Code, variable and class names will be in English (the industry standard); your commit messages can be in whichever language you prefer.
