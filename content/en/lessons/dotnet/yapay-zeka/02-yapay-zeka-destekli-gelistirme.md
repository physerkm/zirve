---
title: AI-Assisted Development
summary: Working productively and safely with coding assistants and agents, managing context, describing tasks well, reviewing generated code, verifying with tests, security and licensing risks, and talking about all of this in an interview.
---

Trendyol's job posting says "experience with AI coding tools (Cursor, Codex, LLMs), or a strong desire to use them, while upholding quality and security standards". GlobalPBX asks for "prompt engineering, context management, AI-assisted refactoring, debugging, and code review". Microsoft lists the use of "agent-based productivity tools" as a plus. The message is clear: companies are looking for engineers who use these tools but don't trust their output blindly.

## Kinds of tools

| Kind | What it does | Example use |
| --- | --- | --- |
| **Inline completion** | Suggests the continuation of the code you're writing | Repetitive code, test data |
| **Chat assistant** | Answers questions, explains code, generates snippets | "What SQL does this LINQ query produce?" |
| **Coding agent** | Reads the repository, changes multiple files, runs commands, runs the tests | "Add pagination to this endpoint and write its tests" |
| **Review assistant** | Examines the changes in a PR and flags possible bugs | A second pair of eyes |

Agents are the most powerful kind but also need the most care, because they take **actions** on your behalf.

## Context is everything

An assistant only knows the context it is given. Most bad results come from bad context.

**Weak request:** "Add cancellation to the order service."

**Strong request:**

> Add order cancellation under `Features/Orders`. Follow the vertical slice structure of the existing `PlaceOrder.cs`. Rule: only orders in the `Submitted` and `Paid` states can be canceled. If it's `Paid`, a `RefundRequested` domain event must be raised. The endpoint is `POST /api/orders/{id}/cancellation`; it should return 204 on success and 409 with ProblemDetails on a rule violation. Write unit tests in the style of `OrderTests.cs` and an integration test in the style of `OrderApiTests.cs`. Don't add new packages.

A good request contains: **what** (the goal), **where** (files, code to follow as an example), **rules** (business rules, constraints), a **definition of done** (tests, status codes), and **what not to do**.

Team-level context: many tools read an instructions file in the repository (e.g. `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) at the start of every session. You put the project structure, coding conventions, test commands, and prohibitions in this file. That way, developers don't have to type the same context over and over.

## Productive working habits

- **Plan first, then code.** For big tasks, first ask the agent for a plan and review it. Fixing a plan that heads in the wrong direction is cheaper than fixing twenty wrongly written files.
- **Small steps.** One meaningful change at a time. After each step, build, run the tests, and commit. That makes it easy to go back.
- **Use tests as the verifier.** "Fix it until the tests pass" gives agents a good goal. But if the agent also wrote the tests, check for yourself that they verify the correct behavior. An agent can change a test so the code passes.
- **Use it for exploration.** In a new codebase, asking "where is the authentication flow, and which files does it go through?" saves minutes.
- **Hand off the tedious work:** test data, mapping code, migration drafts, documentation, bulk renames.
- **Don't hand off the thinking.** Architectural decisions, the security model, and interpreting business rules are your responsibility.

## Reviewing generated code

Review AI-written code the way you'd review code written by an intern: fast and confident, but possibly unaware of the context. Things to look at in particular:

| Risk | Example |
| --- | --- |
| **Invented APIs** | A method or package version that doesn't exist. The compiler catches this, but only if you compile |
| **Outdated patterns** | Old-version habits from the training data: `Startup.cs`, Swashbuckle, `new HttpClient()` |
| **Silent behavior changes** | An edge case or error path lost during a refactor |
| **Security** | SQL built with string concatenation, missing authorization checks, secrets written to logs, loose CORS |
| **Unnecessary complexity** | Abstractions nobody asked for, unused parameters, extra packages |
| **Scope creep** | Changes to files you didn't ask to be touched |
| **Dependency risk** | Whether the suggested package really exists, is maintained, and is trustworthy. Malicious actors registering package names that don't exist is a known attack (slopsquatting) |

Rule: **don't merge code you don't understand.** "The AI wrote it" is not a PR description. Responsibility for the code belongs to whoever commits it.

## Security and privacy

- **Don't share secrets with the assistant:** connection strings, customer data, production logs. Find out which tools and which data your company allows. Enterprise editions have different data retention policies.
- **Limit agent permissions:** an agent that runs commands doesn't need access to production, secret keys, or the right to `git push --force`. If possible, run it in an isolated environment (a container, a temporary branch).
- **Watch out for instructions in the repository:** agents can interpret text in the files and web pages they read as instructions (prompt injection). When working with untrusted content, narrow the agent's permissions.
- **Licensing:** know your company's policy for the possibility that generated code was copied verbatim from an open-source project.

## Measuring

Productivity claims should be measured: PR cycle time, bug rate, number of issues found in review. With AI, teams can write more code and also produce more bugs. Showing that the gains come without lowering quality is a senior engineer's job.

## How to talk about it in an interview

In behavioral interviews, the question "How do you use AI tools?" now comes up often. A good answer is concrete, balanced, and shows ownership:

> "I use a coding agent mainly for two things: exploring a new codebase and making well-defined, testable changes. I ask for a plan first, approve it, and then proceed in small steps. I run the tests at every step. Last month, while adding pagination and filtering to a reporting endpoint, I had the agent write the tests and the mapping code, and I saved roughly half the time the work would have taken. But in review I noticed the agent hadn't put an upper limit on the page size, so I fixed it. I always read security and authorization code line by line myself."

Things to avoid: "I have the AI write everything" (sounds irresponsible) and "I never use it, I don't trust it" (a red flag for many teams in 2026).

## Summary

- Companies want engineers who use AI tools but question their output.
- A good request: the goal, the location, the rules, a definition of done, and what not to do. Team context lives in an instructions file in the repository.
- Plan first, take small steps, verify with tests. Thinking and decisions stay your responsibility.
- Review generated code for invented APIs, outdated patterns, security holes, scope creep, and fake packages.
- Don't share secrets, limit agent permissions, and measure the gains. In an interview, tell a concrete and balanced story.
