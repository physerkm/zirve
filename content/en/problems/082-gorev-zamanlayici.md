---
title: Task Scheduler
---
The tasks a CPU must perform are given as an array `tasks`, where each task is a letter from `A` to `Z`. Each task takes one unit of time to complete. In each unit of time, the CPU either completes a task or stays idle.

There must be **at least `n` units of time** between two tasks with the same letter. Tasks can be done in any order. Return the **minimum number of time units** needed to finish all the tasks.

### Example 1

```text
Input:  tasks = ["A","A","A","B","B","B"], n = 2
Output: 8
Explanation: A → B → idle → A → B → idle → A → B
```

### Example 2

```text
Input:  tasks = ["A","A","A","B","B","B"], n = 0
Output: 6
Explanation: No waiting is needed; the tasks are done back to back in any order.
```

### Example 3

```text
Input:  tasks = ["A","A","A","A","A","A","B","C","D","E","F","G"], n = 2
Output: 16
Explanation: A → B → C → A → D → E → A → F → G → A → idle → idle → A → idle → idle → A
```

### Constraints

- `1 <= tasks.length <= 10^4`
- `tasks[i]` is an uppercase English letter.
- `0 <= n <= 100`

## Hints

- The total time is determined by the **most frequent** task. You have to place it at intervals of `n`.
- If the most frequent task appears `maxCount` times, there are `maxCount - 1` gaps of length `n` between its occurrences. These gaps are filled with the other tasks.
- There may be more than one task with the same `maxCount` frequency; they are added to the last row as well. If the tasks overflow the gaps, no waiting is needed at all.

## Solution

### The frame drawn by the most frequent task

Let `maxCount` be the count of the most frequent task. Imagine placing this task at the start of rows of width `n + 1`: there are `maxCount - 1` full rows and one last row. The full rows take `(maxCount - 1) × (n + 1)` time units. The last row contains only the tasks whose frequency is `maxCount`; let their number be `countMax`.

All the other tasks can be placed in order into the gaps in the full rows; since copies of the same task fall into different rows, there are at least `n` units between them. So the answer is `(maxCount - 1) × (n + 1) + countMax`.

If there are more tasks than gaps, we widen the rows and **no waiting is needed at all**; the answer is the number of tasks. That's why the result is the larger of the two values.

```csharp solution
public class Solution
{
    public int LeastInterval(char[] tasks, int n)
    {
        var counts = new int[26];
        foreach (var task in tasks)
        {
            counts[task - 'A']++;
        }

        var maxCount = counts.Max();
        var countMax = counts.Count(c => c == maxCount);

        var frame = (maxCount - 1) * (n + 1) + countMax;
        return Math.Max(tasks.Length, frame);
    }
}
```

```typescript solution
function leastInterval(tasks: string[], n: number): number {
  const counts = new Array<number>(26).fill(0);
  for (const task of tasks) {
    counts[task.charCodeAt(0) - 65]++;
  }

  const maxCount = Math.max(...counts);
  const countMax = counts.filter((c) => c === maxCount).length;

  const frame = (maxCount - 1) * (n + 1) + countMax;
  return Math.max(tasks.length, frame);
}
```

### Complexity

- **Time:** O(t), where `t` is the number of tasks; the number of letters is constant.
- **Space:** O(1). A counter array of 26 elements.

A simulation is also possible: in each round, pick the most frequent remaining tasks from a max-heap and keep the waiting ones in a queue. It takes O(t log 26) and also answers the question "in what order?"; but if only the total time is asked, the formula is simpler.
