---
title: Incident Management and On-Call
summary: SLIs, SLOs and error budgets, good alert design, on-call rotations, roles and communication during an incident, mitigating first, runbooks, root cause analysis and the five whys, blameless postmortems.
---

Items like "live site", "on-call rotation" and "incident response" are a constant in Microsoft's job postings. Senior role descriptions ask for "ownership of production systems and incident response". The team that writes a service also runs it ("you build it, you run it"). This lesson covers what to do when your phone rings at 3 a.m., and what to do afterward so the same incident doesn't happen again.

## Measuring reliability: SLI, SLO, SLA

| Concept | Definition | Example |
| --- | --- | --- |
| **SLI** (indicator) | A metric that measures the user experience | The ratio of successful requests, the ratio of requests answered in under 300 ms |
| **SLO** (objective) | An internal target for an SLI | 99.9% of requests successful over 28 days |
| **SLA** (agreement) | A promise to the customer, with consequences | A refund if it drops below 99.5% |

The SLO is kept stricter than the SLA: when the internal target is missed, the promise to the customer should still be met.

**Error budget** = 100% − SLO. A 99.9% SLO means roughly **40 minutes** of downtime over 28 days, or one in every thousand requests failing.

- While there's budget left, the team ships quickly and can take risks.
- When the budget runs out, the priority shifts to reliability: risky deployments stop and reliability work moves to the front.

This mechanism turns the "should we go fast or be safe?" debate into a data-driven decision. A 100% target is wrong: every extra "nine" multiplies the cost, and users already see errors caused by their own networks.

## Alert design

Bad alerts are on-call's worst enemy. Alerts that fire constantly and usually require no action lead to **alert fatigue**: when a real alert arrives, it gets ignored too.

Principles:

- **Alert on symptoms, not causes.** Not "CPU at 90%", but "users are getting errors" or "latency is threatening the SLO". If CPU is high but users aren't affected, there's no need to wake anyone up.
- **Every alert must be actionable.** The person who gets the alert should know what to do. If they don't, either the alert is unnecessary or the runbook is missing.
- **Separate by urgency:** situations affecting users right now wake someone up (a page). Situations that can wait become a ticket to look at during business hours.
- **Alert on the error budget burn rate:** an alert like "at this rate, the budget runs out in 2 days" is both fast and quiet.
- **Link every alert to a runbook.**

## On-call

- **The rotation** must be fair (usually weekly). There's a primary and a secondary (backup) person.
- **Handoff:** open issues, ongoing work and things to watch are passed to the next person in writing.
- **Sustainability:** if a shift has many night-time alerts, that's a systemic problem, not a personal one, and it's treated as improvement work.
- The on-call person's job isn't to solve everything alone. It's to assess the situation, mitigate it and bring in the right people when needed (escalation).

## During an incident

### Severity levels

| Level | Example | Response |
| --- | --- | --- |
| **SEV1** | Payments can't be taken, the whole system is unreachable, data loss | Immediately, all necessary people, regular status updates |
| **SEV2** | An important feature isn't working, or some users are affected | Immediately, the relevant team |
| **SEV3** | Small impact, a workaround exists | During business hours |

### Roles

In large incidents the roles are split, because one person debugging, communicating and making decisions all at once doesn't work:

- **Incident commander:** coordination and decisions. Doesn't debug.
- **Operations / technical lead:** investigates and responds to the problem.
- **Communications lead:** regular updates to stakeholders and customers. The status page.
- **Scribe:** the timeline: what was seen when, what was done.

### Mitigate first, then diagnose

The goal during an incident is to **stop the user impact as fast as possible**, not to find the root cause. The root cause is found later.

Fast mitigation options:

- **Roll back the last deployment.** Most incidents start after a change. "What changed?" is the first question.
- **Turn off the feature flag.**
- **Scale:** more instances, a bigger database.
- **Reroute traffic:** to a healthy region or instance.
- **Shed load:** stop non-essential work, tighten the rate limit, turn off low-priority features (graceful degradation).
- **Disable a dependency:** skip the crashed recommendation service so checkout keeps working.

### Communication

- Open a shared incident channel. Everyone talks there.
- Status updates at regular intervals (e.g. every 30 minutes for a SEV1): what we know, what we're doing, when the next update is. "We don't know yet" is a valid update too. Silence is not.
- Write down observations, not assumptions.

## Runbooks

A step-by-step response document for a specific alert or situation:

```markdown
# Alert: high 5xx rate on orders-api

## Impact
Customers may be unable to create orders.

## First checks
1. Which endpoint is the error on in the dashboard? (link)
2. Was there a deployment in the last hour? `kubectl rollout history deploy/orders-api`
3. Is the database connection pool saturated? (link: DB dashboard)
4. The payment provider's status page (link)

## Mitigation
- If it started after the last deployment: `kubectl rollout undo deploy/orders-api`
- If it's caused by the payment provider: turn on the `payments.fallback` flag

## Who to contact
- Payments team: #payments-oncall
```

Runbooks are updated after every incident. Over time, the best runbook steps turn into **automation**.

## After the incident: the postmortem

After every significant incident, a written postmortem is done. Its goal is not to find someone to blame but to improve the **system**.

### Blameless culture

People make decisions that seem reasonable with the information they have at the moment. "A developer ran the wrong command" is not a root cause. The real questions are: Why was it so easy to run the wrong command? Why was there no confirmation step? Why wasn't the bug caught in staging before it was noticed in production?

Where there's blame, people hide their mistakes and the organization can't learn.

### Root cause analysis: the five whys

```text
Problem: The order service returned errors for 40 minutes.
1. Why? The database connection pool was exhausted.
2. Why? The new report endpoint ran a long query on every request and held on to connections.
3. Why? The query did a full table scan for large customers.
4. Why? The tests ran only with a small dataset, so the missing index went unnoticed.
5. Why? The staging environment doesn't have production-like data volumes.
```

In real incidents there's usually not a single root cause but **several contributing factors**. The five whys is a starting tool for finding them.

### The postmortem document

- **Summary:** what happened, how long it lasted, how many users and how much revenue were affected.
- **Timeline:** the first symptom, detection, response steps, mitigation, resolution. Time to detect and time to mitigate are measured separately.
- **Root cause and contributing factors.**
- **What went well, what went badly, where we got lucky.**
- **Action items:** each has an owner and a date. Example: add a timeout to the report endpoint, set up an alert for connection pool saturation, load anonymized production-volume data into staging, move report queries to a read replica.

A postmortem whose action items aren't tracked is nothing more than a ritual. The same incident recurring is a sign that the action items weren't closed.

## Asked in interviews

- **"What are an SLO and an error budget?"** An SLO is an internal target for the user experience. The error budget is the amount of failure the target allows. The budget manages the balance between speed and reliability.
- **"What makes a good alert?"** It's based on user impact (symptoms), it's actionable and it's linked to a runbook.
- **"An alert fires at 3 a.m. What do you do first?"** I figure out the impact and scope, look at "what changed?" and mitigate first: usually a rollback or turning off a flag. If needed, I call for help and announce the situation.
- **"Why should a postmortem be blameless?"** So that people don't hide their mistakes and the weaknesses in the system come to light. The question isn't "who" but "why did the system make this possible?".
- **"Tell me about a problem you solved in production."** Use STAR: the symptom, the diagnosis steps, the mitigation, the permanent fix and the improvements made afterward.

## Summary

- An SLI measures the user experience, an SLO is its target, and the error budget manages the balance between speed and reliability.
- Alerts are based on symptoms, are actionable and are linked to a runbook. Alert fatigue is a real risk.
- During an incident you mitigate first (rollback, flag, scaling) and diagnose afterward. Roles are split and communication is regular.
- Runbooks are updated after every incident and turn into automation over time.
- A postmortem is blameless, finds the contributing factors and ends with action items that have a clear owner and date.
