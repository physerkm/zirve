---
title: Merge Intervals
---
You are given an array of intervals where `intervals[i] = [start, end]`. **Merge all overlapping intervals** and return an array of non-overlapping intervals that cover all the intervals in the input, **sorted by start value**.

Intervals whose endpoints touch also overlap: `[1, 4]` and `[4, 5]` merge into `[1, 5]`.

### Example 1

```text
Input:  intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
Output: [[1, 6], [8, 10], [15, 18]]
Explanation: [1, 3] and [2, 6] overlap.
```

### Example 2

```text
Input:  intervals = [[1, 4], [4, 5]]
Output: [[1, 5]]
```

### Constraints

- `1 <= intervals.length <= 10^4`
- `0 <= start <= end <= 10^4`

## Hints

- When the intervals are in random order, it is hard to find which ones overlap. Which ordering makes this easier?
- If you sort the intervals by **start value**, overlapping intervals end up next to each other.
- While scanning the sorted intervals, compare each one with the **last** interval in the result: if they overlap, extend the end of the last interval; otherwise, add it as a new interval.

## Solution

We sort the intervals by start value. Then we scan them in order and compare each interval with the last interval in the result list:

- If the interval's start is **greater** than the last interval's end, there is no overlap; we add it as a new interval.
- Otherwise they overlap; we set the last interval's end to the **larger** of the two ends.

Taking the larger end matters: merging `[1, 10]` with `[2, 3]` must give `[1, 10]`; blindly replacing the end with the new interval's end produces a wrong result like `[1, 3]`.

```csharp solution
public class Solution
{
    public int[][] Merge(int[][] intervals)
    {
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));

        var merged = new List<int[]>();

        foreach (var interval in intervals)
        {
            if (merged.Count == 0 || interval[0] > merged[^1][1])
            {
                merged.Add(new[] { interval[0], interval[1] });
            }
            else
            {
                merged[^1][1] = Math.Max(merged[^1][1], interval[1]);
            }
        }

        return merged.ToArray();
    }
}
```

```typescript solution
function merge(intervals: number[][]): number[][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];

  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];

    if (last === undefined || start > last[1]) {
      merged.push([start, end]);
    } else {
      last[1] = Math.max(last[1], end);
    }
  }

  return merged;
}
```

### Complexity

- **Time:** O(n log n); sorting dominates, and the scan is O(n).
- **Space:** O(n) (for the output and the space used by sorting).

Almost every interval problem starts with "sort first": meeting rooms, non-overlapping intervals, inserting an interval. Which endpoint you sort by depends on the problem.
