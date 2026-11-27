---
title: Agile and Scrum
summary: The essence of the Agile Manifesto, Scrum roles, events and artifacts, a good user story and acceptance criteria, estimation and story points, Kanban and flow metrics, the Jira workflow, fitting technical debt into the sprint, and Agile questions in interviews.
---

About half of the ".NET Software Developer" job postings in the UK mention "Agile". Postings in Turkey ask for "adaptability to Agile methodology", "experience with sprint planning, retrospectives and daily stand-ups", and "Jira". This topic usually comes up in the behavioral interview: "How did your team work?", "What do you do if priorities change in the middle of a sprint?"

## The essence of Agile

The Agile Manifesto from 2001 puts forward four values. The items on the right have value too, but the items on the left are valued more:

- **Individuals and interactions** over processes and tools.
- **Working software** over comprehensive documentation.
- **Customer collaboration** over contract negotiation.
- **Responding to change** over following a plan.

What it means in practice: deliver work in small pieces, get feedback often, change direction as you learn. Instead of one big delivery after six months, a working increment every two weeks.

Agile isn't a methodology; it's a set of values. Scrum and Kanban are frameworks that put those values into practice.

## Scrum

### Roles (accountabilities)

| Role | Responsibility |
| --- | --- |
| **Product Owner** | Maximizes the value of the product. Owns and prioritizes the product backlog. Answers the "what" and "why" questions |
| **Scrum Master** | Makes sure the team applies Scrum effectively. Removes impediments and facilitates meetings. Not a project manager |
| **Developers** | Everyone who produces the increment: backend, frontend, testing, design. Owns the "how" question |

### Events

| Event | Duration (2-week sprint) | Purpose |
| --- | --- | --- |
| **Sprint** | 1–4 weeks, usually 2 | Fixed length, with a usable increment at the end |
| **Sprint Planning** | ~4 hours | The sprint goal, which work to take on and how to do it |
| **Daily Scrum** | 15 minutes | Review progress toward the sprint goal and plan the day |
| **Sprint Review** | ~2 hours | Show what was done to stakeholders, get feedback, update the backlog |
| **Sprint Retrospective** | ~1.5 hours | Improve **how the team works** |

The Daily Scrum isn't a status report meeting. The classic "what I did yesterday, what I'll do today, what's blocking me" format is common, but the real question is "will we reach the sprint goal, and how do we contribute to it today?" Technical discussions happen after the meeting with the people involved.

### Artifacts

- **Product Backlog:** a prioritized list of everything that could be done for the product.
- **Sprint Backlog:** the sprint goal and the work selected for this sprint.
- **Increment:** the usable output at the end of the sprint that meets the **Definition of Done**.

**Definition of Done (DoD):** what's required for a piece of work to count as "done". Example: the code was reviewed, tests were written and pass, it was deployed to staging, the documentation was updated, the product owner accepted it. Without a DoD, the word "done" means something different to each person.

**Definition of Ready:** what's required for a piece of work to be pulled into a sprint: clear acceptance criteria, known dependencies, an estimate.

## User stories and acceptance criteria

```text
As a customer,
I want to be able to cancel my order before it ships,
so that I can get my money back for an order I placed by mistake.

Acceptance criteria:
- A "Cancel" button is visible on orders in the "Paid" or "Preparing" status.
- The button is not visible from "Shipped" onward.
- When a paid order is canceled, a refund is started and the customer gets an email.
- The cancellation appears in the order history with the date and reason.
```

A good story meets the **INVEST** criteria: **I**ndependent, **N**egotiable, **V**aluable, **E**stimable, **S**mall, **T**estable.

Acceptance criteria are sometimes written in **Given/When/Then** form and turn directly into automated tests:

```text
Given an order in the "Paid" status
When the customer cancels the order
Then the order moves to the "Canceled" status
And a refund for the amount is started
```

Large pieces of work are defined as **epics** and split into stories. When splitting, **vertical slicing** is preferred: instead of horizontal layers like "database table", "API" and "UI", you split into slices that each deliver a small piece of value end to end ("canceling only paid orders", "then the refund email").

## Estimation

A **story point** expresses the size of a piece of work (complexity, uncertainty, amount of work) in **relative** terms. It isn't hours. A Fibonacci-like scale is usually used (1, 2, 3, 5, 8, 13): the gaps widen as sizes grow, because uncertainty grows too.

**Planning poker:** everyone reveals their estimate at the same time. The people with the lowest and highest estimates explain their reasoning. The real value isn't in the number but in this conversation: one person says "there's an existing service for this", another says "I know that service doesn't support this case". Hidden assumptions come to light.

**Velocity:** the average number of points the team completes per sprint. It's meaningful only for the team's own planning. Comparing it across teams or turning it into a performance metric leads to point inflation.

An estimate above 13 usually means "this should be split" or "research is needed first". To reduce uncertainty, a time-boxed research task (a **spike**) is opened.

Some teams drop estimation entirely (#NoEstimates), split work into similarly small pieces and **count** them. That's a valid approach too.

## Kanban

Kanban is based on **continuous flow** instead of sprints:

```text
| To Do | Analysis (2) | Development (3) | Review (2) | Test (2) | Done |
```

- **Visualize the flow on a board.**
- **Limit work in progress (WIP limit):** at most 3 items in the "Development" column. When the limit is reached, no new work is started; stuck items get finished. This makes bottlenecks visible and prevents the "everything started, nothing finished" situation.
- **Measure the flow:** **cycle time** (from when work starts to when it's done), **lead time** (from request to delivery), **throughput** (work finished per unit of time).

Kanban suits support and operations teams, and teams with an unpredictable flow of work, better. Many teams combine the two (Scrumban).

## The workflow in Jira

A typical story flow: `To Do → In Progress → Code Review → QA → Done`. What's expected of a developer:

- Assign yourself to the card when you start the work and keep the status up to date.
- Use the issue key in branches and commits (`feature/ORD-412-cursor-pagination`, `ORD-412` in the commit). Jira links them to the card.
- When you're stuck, flag the card instead of waiting, and say so in the daily stand-up.
- In a bug report: steps to reproduce, expected and actual behavior, environment, logs or a trace id.

## Technical debt and the sprint

Technical debt is the shortcuts taken to go fast today and paid back later with interest. If it stays invisible, it piles up and the team slows down.

- Make the debt visible in the backlog: describe its impact in business terms ("Adding any feature to this module takes two extra days").
- Set aside a fixed share of sprint capacity (e.g. 15–20%) for paying down debt on an ongoing basis.
- The "Boy Scout rule": leave the code you touch a little cleaner than you found it.

## Asked in interviews

- **"Is a Scrum Master the same thing as a project manager?"** No. The Scrum Master serves the team and facilitates the process. They don't assign work; the team organizes itself.
- **"Why aren't story points hours?"** They're relative size. They include uncertainty and are independent of the person. Hour estimates vary from person to person and are systematically optimistic.
- **"What if urgent work comes in mid-sprint?"** I discuss its impact on the sprint goal with the product owner. If it's truly urgent, a piece of work of similar size is taken out of the sprint. If it happens often, we talk about it in the retrospective and maybe switch to Kanban or keep buffer capacity.
- **"Why did your velocity drop?"** I try to understand the cause: technical debt, interruptions, unclear work, changes in the team. Velocity is a diagnostic tool, not a target.
- **"What makes a good retrospective?"** A safe environment, concrete observations, and one or two improvement actions at the end with a clear owner and date. Then following up on those actions in the next retrospective.

## Summary

- Agile is a set of values: small increments, frequent feedback, adapting to change.
- Scrum: three roles, fixed-length sprints, four events, three artifacts. The Definition of Done defines "done".
- A good story meets INVEST, has testable acceptance criteria and is sliced vertically.
- A story point is relative size. Its value is in the estimation conversation. Velocity is only for the team's own planning.
- Kanban visualizes the flow, limits work in progress and measures with cycle time.
- Technical debt is made visible and paid down continuously.
