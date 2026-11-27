---
title: Code Review, ADRs and Technical Leadership
summary: What to look for in a good code review, how to give and receive comments, keeping reviews fast, architecture decision records (ADRs) and design docs, mentoring, what's expected of senior and lead engineers, and how to talk about all this in a behavioral interview.
---

The same trio shows up in every senior and lead job posting: **code review, mentoring and architecture decisions**. GlobalPBX asks for "a code review culture and root cause analysis", Sürat Kargo for "mentoring juniors and architecture decisions", and lead role descriptions for "writing ADRs and running design reviews". These skills are different from writing code, and interviews measure them with behavioral questions.

## Why do code reviews?

The order matters:

1. **Knowledge sharing:** so the code doesn't live in only one person's head. The reviewer learns the codebase too.
2. **Design and maintainability:** so the code is readable and changeable six months from now.
3. **Catching bugs:** important, but it doesn't replace tests and automation.
4. **Consistency:** keeping the team's shared conventions.

Formatting, naming conventions, unused variables and simple security patterns are left to **tools** (formatters, analyzers, CI). Human review focuses on what machines can't see.

## What to look at

In order of priority:

| Area | Questions |
| --- | --- |
| **Correctness** | Does it do what it's supposed to? Edge cases: empty list, null, concurrent requests, timeouts, duplicate messages? |
| **Design** | Is it in the right place? Does it fit the existing structure? Is it more complex than needed? Is there unnecessary abstraction? |
| **Security** | Authorization checks, input validation, sensitive data, SQL injection, information leaking into logs |
| **Performance** | N+1 queries, network calls in a loop, unbounded lists, missing indexes, unnecessary allocations |
| **Tests** | Are there tests that verify the behavior? Are the error paths tested? Are the tests readable? |
| **Readability** | Do the names express intent? Will the next developer understand this? |
| **Operations** | Are the logs, metrics and error messages sufficient? Can it be rolled back? Is the migration backward compatible? |

A good habit: read the PR description and the tests first. Commenting line by line without understanding what the change is trying to do means missing the big design problem and getting stuck on small details.

## Writing comments

Bad:

> This is wrong.

Good:

> This loop sends a separate query for each order (N+1). For a customer with 500 orders, that's 500 queries. We could bring it down to a single query with `Include(o => o.Lines)` or a projection. What do you think?

Principles:

- **Comment on the code, not the person.** Not "you did this wrong", but "this line fails in this case".
- **Say why.** A comment without a reason either gets applied blindly or starts an argument.
- **State the severity.** Teams use prefixes: `blocker:` (must fix before merging), `suggestion:` (consider it), `nit:` (minor, optional), `question:` (asking to understand).
- **Ask questions.** "Did you consider X here?" often works better than "Do X". Maybe the author did consider it and has a reason.
- **Point out what's good too.** "This test is really clear" isn't a waste of time.
- **Don't drag out long discussions in writing.** After the third round of comments, have a quick call and write the decision in the PR.

## Receiving comments

- The comment is about the code, not about you. Don't get defensive.
- Reply to every comment: fixed it, won't fix it (because...), opened a separate ticket.
- If you disagree, explain your reasoning. A senior reviewer can be wrong too.
- If you keep getting the same comment, add it to your own checklist before the next PR.

## Keeping reviews fast

PRs waiting for review are one of a team's biggest hidden costs: the author moves on to other work, context is lost, conflicts grow.

- **Small PRs.** Review quality drops noticeably above 400 lines. Split big work into a sequence of small PRs.
- **A fast first response.** Many teams set a target of "first review within one business day".
- **Treat review as real work.** Reviewing someone else's PR is often more valuable than starting your own new task: it increases the number of finished items on the team.
- **Pair programming** or reviewing together is faster than rounds of written comments for complex changes.

## Architecture decision records (ADRs)

Two years later, when someone asks "Why do we use RabbitMQ here instead of Kafka?", nobody remembers the answer. An ADR is a short document that records an important architecture decision **with its context and rationale**. The format Michael Nygard proposed:

```markdown
# ADR-014: Use RabbitMQ for order events

- Status: Accepted (2026-11-12)
- Deciders: Backend team

## Context
We need asynchronous communication between the order, invoice and notification services.
We expect ~90k messages per day and ~50 messages/s at the peak hour. The team has RabbitMQ
experience but no Kafka experience. Replaying events is not a requirement right now.

## Decision
We will use RabbitMQ with quorum queues and MassTransit 8. Messages will be published via an outbox.

## Options considered
- Kafka: provides replay and very high throughput, but it's overkill for this volume and expensive to operate.
- Azure Service Bus: a managed service, but our infrastructure is currently on-premises.

## Consequences
+ The team is productive right away; operational knowledge already exists.
- If we need to replay the event history later, we'll need a separate solution.
- Monitoring and upgrading the RabbitMQ cluster is the team's responsibility.
```

Principles:

- **Keep it short.** One page is enough.
- **Keep it in the repository, next to the code** (`docs/adr/`), and review it through a PR.
- **It's immutable.** If the decision changes, a new ADR is written and the old one is marked "superseded by ADR-031". The history itself is valuable.
- **Write down the options and the negative consequences** too. An ADR that only describes the good sides of the chosen path isn't a decision record; it's a sales pitch.

For bigger changes, a **design doc** (or RFC) is written: the problem, goals and non-goals, the proposed design, alternatives, risks and the rollout plan. Stakeholders give their input before any code is written. The interview framework in the System Design track is almost identical to the structure of these documents.

## Mentoring

Mentoring junior and mid-level developers is a fixed item in senior job postings. Good mentoring means:

- **Guiding instead of handing over the answer:** "Which logs did you check? Where does the trace show the time being spent?" Next time, the person finds it on their own.
- **Giving work at the right level of difficulty** and allowing mistakes in a safe environment.
- **Using review as a teaching tool:** explaining not just what but why. Writing the next PR together if needed.
- **Regular one-on-ones:** career goals and obstacles alongside technical topics.
- **Giving visibility:** crediting the mentee's work by name in meetings.

## What's expected of senior and lead engineers

| Area | Mid-level | Senior | Lead / Staff |
| --- | --- | --- | --- |
| Scope | Well-defined tasks | A feature or service end to end | Multiple services or teams |
| Ambiguity | Expects a clear definition | Defines and breaks down an ambiguous problem | Decides which problems need solving |
| Impact | Their own output | The team's output (review, mentoring) | The organization's technical direction |
| Decisions | Implements them | Evaluates and documents trade-offs (ADRs) | The long-term technical roadmap |
| Operations | Bugs in their own code | Service ownership, on-call, incident management | Reliability standards and processes |

The mark of a senior engineer isn't just writing harder code; it's **making others more effective**.

## Talking about it in a behavioral interview

These topics are assessed with questions you answer using the STAR method:

- "Tell me about a time you found a serious problem in a code review."
- "Tell me about a time you disagreed with a technical decision and argued for your view."
- "Give an example of helping a junior developer grow."
- "Tell me about an architecture decision you made that turned out to be wrong. What did you learn?"

What makes a good answer: a concrete situation, what **you** did (not "we"), a measurable result and the lesson learned. Stories about mistakes are valuable because they show ownership and learning.

## Asked in interviews

- **"What do you look at in a code review?"** Correctness and design first, then security, performance, tests and readability. I leave formatting to the tools.
- **"What if you get a review comment you disagree with?"** I explain my reasoning. If it drags on, I have a quick call and write the decision in the PR.
- **"What is an ADR, and why write one?"** A short document that records the context, options and consequences of an important architecture decision. So the reason for the decision isn't forgotten over time.
- **"PRs sit waiting for days. What do you do?"** I make the PRs smaller, set a target for the first response and make review a priority for the team.
- **"What separates a senior engineer from a mid-level one?"** Defining and breaking down ambiguous problems, evaluating trade-offs in writing and making the rest of the team more effective.

## Summary

- The primary goals of code review are knowledge sharing and maintainability. Tools police the formatting.
- Prioritize correctness and design. Comments target the code, say why and state their severity.
- Small PRs and a fast first response keep the team's flow going.
- ADRs record decisions next to the code, together with their context, options and negative consequences.
- Mentoring guides rather than giving answers. Being senior means making others more effective.
