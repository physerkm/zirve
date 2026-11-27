---
title: Problem-Solving Method for Coding Interviews
summary: Six steps for managing 45 minutes. Clarify the question, think through examples, explain your approach, code, test, and analyze.
---

In a coding interview, two candidates can reach the same solution and get very different scores. The difference is in the **process**: the interviewer evaluates not just the code but how you got there. The six steps below are a framework you can apply to every question.

## 1. Clarify the question (2–3 min)

Restate the question in your own words and ask about anything ambiguous. Questions are deliberately left incomplete.

- **Input:** can it be empty? How large is it? Is it sorted? Are there negative numbers or duplicate elements?
- **Output:** what exactly should be returned? If there are multiple valid answers, which one? If there is no answer, what should be returned?
- **Constraints:** can I modify the input? Is there a memory limit?

The input size gives away the expected complexity: if `n` is around a hundred thousand, an O(n²) solution won't be accepted.

## 2. Think through examples (2–3 min)

Solve the given example by hand; then write **your own** examples: a small general case and a few edge cases (empty input, a single element, all elements the same, already sorted).

The steps your mind takes while solving an example by hand are often the algorithm itself. Write these examples down somewhere; you'll test your code with them.

## 3. Explain your approach and get buy-in (5–8 min)

Explain your plan **before you start writing code**.

1. **State the brute-force solution**, along with its complexity: "I could try every pair, O(n²)." This shows you understand the problem and sets a baseline. Most of the time you don't need to code it.
2. **Find the bottleneck:** where is the repeated work? "I'm doing the same lookup over and over in the inner loop."
3. **Improve it.** Ask yourself these questions:
   - Would sorting help?
   - Would a hash table bring the lookup down to O(1)?
   - Can two pointers or a sliding window be applied?
   - Can this be seen as a graph or tree problem?
   - Do the subproblems overlap (dynamic programming)?
4. **Get buy-in:** "One pass with a hash table, O(n) time, O(n) space. Shall I go with that?"

Skipping this step is the most expensive mistake: coding the wrong approach for 20 minutes and starting over makes the interview unrecoverable. Pay attention to the interviewer's reaction; "can you think of another way?" is a hint.

## 4. Write the code (15–20 min)

- **Talk while you write.** Explain your decisions, not every line: "Here I'm using the value as the key, not the index, because…"
- **Use meaningful names.** `i` and `j` are fine for loop counters; `x`, `tmp`, and `arr2` are not. `seen`, `left`, and `maxProfit` explain themselves.
- **Break it into helper functions.** It's fine to defer details: "Here I'll call a helper named `isValid`; I'll write it in a moment."
- **Finish the main flow first**, then add the edge cases; but don't forget to add them.
- **Don't go silent when you're stuck.** Say where you're stuck; go back to your example.

Language choice: use the language you're most fluent in. Every time you stop to remember the name of a collection or string operation, it eats into your problem-solving time.

## 5. Test (5 min)

Before you say "done," test your code **yourself**. Most candidates skip this step, and the interviewer finds the bug.

1. Read the code from top to bottom: typos, the wrong variable, a forgotten `return`.
2. Trace a small example **line by line, by hand**; write down the variable values. Trace **what the code does**, not what it should do.
3. Try the edge cases: empty input, a single element, boundary values.
4. If you find a bug, don't panic; fix it calmly. A candidate who finds and fixes their own bug leaves a positive impression.

## 6. Analyze and discuss improvements (2–3 min)

State the time and space complexity **with your reasoning**. Then talk about the trade-offs: "I could have solved it with O(1) extra space by sorting, but the time would have gone up to O(n log n)."

The interviewer usually asks a follow-up question: what if the input didn't fit in memory? What if it arrived as a stream? What if it were queried many times? These aren't traps; they're a chance to show you at the next level.

## When you get stuck

- Try **a smaller example**, or simplify the problem: "what if the array were sorted?", "what if it were one-dimensional?"
- Think **backward from the output**.
- Test the **patterns** you know one by one.
- **Use** the interviewer's hints. Taking a hint is not a failure; failing to make use of it is.

## Timeline

| Minutes | What you're doing |
| --- | --- |
| 0–5 | Clarification and examples |
| 5–12 | Approach, complexity, buy-in |
| 12–32 | Coding |
| 32–40 | Testing and bug fixing |
| 40–45 | Analysis, follow-up questions, your questions |

If you still haven't started writing code by minute 15, stop looking for the optimal solution and move forward with a **working** one. A working but slow solution scores more than an unfinished optimal one.

## Summary

1. Clarify → 2. work through examples → 3. explain and get buy-in → 4. code → 5. test → 6. analyze.
2. Agree on the approach before writing code.
3. Think out loud the whole time; the interviewer can only evaluate what they hear.
4. Test your code yourself; be the one who finds the bug.
