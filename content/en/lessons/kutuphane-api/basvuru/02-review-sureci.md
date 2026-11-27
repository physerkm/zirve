---
title: The review process
summary: What to write when you ask for a review, and what gets checked during the review.
---
## 16.1 When you ask me for a review

Short messages like these are enough:

- “Phase 1 is done, please review it.”
- “In Phase 2, only look at the Loans folder.”
- “I don't understand this build error; explain the concept but don't write code.”
- “I couldn't figure out how to register the ValidationDecorator, give me a hint.”
- “I fixed the findings, please review again.”

## 16.2 What I'll do during the review

1. Run `dotnet build` and `dotnet test` and report the results.
2. Read the files that changed in that phase (from the git history).
3. Check the phase's acceptance criteria and the “What I'll check in the review” list one by one.
4. Verify the business rules (BR-xx) against the code.
5. Write up the findings sorted by severity: file:line, the problem, why it matters, a hint.

> **Note:** Unless you explicitly ask, I won't change your code, create files, or show you corrected code. If you need a general example while I explain a concept, you can ask for one from a domain unrelated to this project.
