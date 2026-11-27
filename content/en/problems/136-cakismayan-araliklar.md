---
title: Non-overlapping Intervals
---
You are given an array `intervals` where `intervals[i] = [start_i, end_i]`. Return the **minimum** number of intervals you need to remove from the array so that the remaining intervals do **not overlap** each other.

Intervals that only touch at an endpoint (for example `[1, 2]` and `[2, 3]`) are **not** considered overlapping.

### Example 1

```text
Input:  intervals = [[1,2],[2,3],[3,4],[1,3]]
Output:  1
Explanation: After removing the interval [1,3], the remaining intervals [1,2], [2,3] and [3,4] do not overlap.
```

### Example 2

```text
Input:  intervals = [[1,2],[1,2],[1,2]]
Output:  2
Explanation: We must remove two of the [1,2] intervals so that a single non-overlapping [1,2] remains.
```

### Example 3

```text
Input:  intervals = [[1,2],[2,3]]
Output:  0
Explanation: The intervals only touch at an endpoint, so they already do not overlap.
```

### Constraints

- `1 <= intervals.length <= 10^5`
- `intervals[i].length == 2`
- `-5 * 10^4 <= start_i < end_i <= 5 * 10^4`

## Hints

- The question "what is the minimum number of intervals to remove?" is exactly the same as "what is the **maximum** number of mutually non-overlapping intervals you can choose?"
- When two intervals overlap, which one should you keep to leave more free room for future intervals?
- If you sort the intervals by **end time** in ascending order, choosing the interval that ends earliest at each step is the optimal greedy choice.
- Store the end point of the last kept interval (`prevEnd`); if the start of the next interval is less than `prevEnd`, there is an overlap and you remove that interval.

## Solution

This problem is the classic **interval scheduling** (activity selection) problem asked in reverse. Deleting the fewest intervals means keeping the largest number of mutually non-overlapping intervals.

The greedy idea is this: whenever we have to choose between two overlapping intervals, we should **always keep the one that ends earlier**. An interval that ends earlier leaves more room on the right for the intervals still to come.

To apply this in a single pass:
1. We sort the intervals by **end time (`end`)** in ascending order.
2. We keep the first interval and record its end point as `prevEnd = intervals[0][1]`.
3. We look at each following interval `[start, end]`:
   - If `start < prevEnd`, this interval overlaps with the previously kept interval. Thanks to the sort, `end >= prevEnd`, so deleting the new interval (`removed++`) and keeping the earlier-ending previous one is always the right move.
   - If `start >= prevEnd`, there is no overlap; we keep this interval and update our boundary to `prevEnd = end`.

```csharp solution
public class Solution
{
    public int EraseOverlapIntervals(int[][] intervals)
    {
        // Sort the intervals by end time to leave the most room for the future.
        Array.Sort(intervals, (a, b) => a[1].CompareTo(b[1]));

        int removed = 0;
        int prevEnd = intervals[0][1];

        for (int i = 1; i < intervals.Length; i++)
        {
            if (intervals[i][0] < prevEnd)
            {
                // Overlap: remove the current interval, which ends later (or at the same time).
                removed++;
            }
            else
            {
                // No overlap: keep this interval and update the end boundary.
                prevEnd = intervals[i][1];
            }
        }

        return removed;
    }
}
```

```typescript solution
function eraseOverlapIntervals(intervals: number[][]): number {
  intervals.sort((a, b) => a[1] - b[1]);

  let removed = 0;
  let prevEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < prevEnd) {
      removed++;
    } else {
      prevEnd = intervals[i][1];
    }
  }

  return removed;
}
```

### Complexity

- **Time:** O(n log n). Sorting the intervals by end time takes O(n log n), and the single-pass loop after it takes O(n).
- **Space:** O(1) extra space (apart from the O(log n) stack space used by the sorting algorithm).
