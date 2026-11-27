---
title: Insert Interval
---
You are given an array `intervals` of **non-overlapping** intervals **sorted** by their start, and a new interval `newInterval = [start, end]`.

Insert `newInterval`, merging overlapping intervals if necessary so that the array stays sorted and free of overlaps. Return the result. Intervals that share an endpoint (`[1, 5]` and `[5, 7]`) overlap.

### Example 1

```text
Input:  intervals = [[1,3],[6,9]], newInterval = [2,5]
Output:  [[1,5],[6,9]]
```

### Example 2

```text
Input:  intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Output:  [[1,2],[3,10],[12,16]]
Explanation: [4,8] overlaps with [3,5], [6,7] and [8,10].
```

### Constraints

- `0 <= intervals.length <= 10^4`
- `intervals[i].length == 2`, `0 <= start_i <= end_i <= 10^5`
- `intervals` is sorted in ascending order by start and contains no overlaps.
- `newInterval.length == 2`, `0 <= start <= end <= 10^5`

## Hints

- Since the intervals are sorted, they fall into three groups: those that end entirely **before** the new interval, those that **overlap** with it, and those that start entirely **after** it.
- Add the ones that end before as they are. Merge the overlapping ones with the new interval: the start becomes the smallest, and the end the largest.
- After adding the merged interval, add the rest as they are.

## Solution

### A single pass in three phases

1. Intervals with `intervals[i][1] < newInterval[0]` end before the new interval; they are added to the result unchanged.
2. As long as `intervals[i][0] <= newInterval[1]`, the interval overlaps with the new interval. The new interval is widened: `start = min(...)`, `end = max(...)`.
3. The merged interval is added, then the remaining intervals are added unchanged.

Since the array is already sorted, there is no need to sort it again.

```csharp solution
public class Solution
{
    public int[][] Insert(int[][] intervals, int[] newInterval)
    {
        var result = new List<int[]>();
        var i = 0;
        var n = intervals.Length;

        while (i < n && intervals[i][1] < newInterval[0])
        {
            result.Add(intervals[i++]);
        }

        var start = newInterval[0];
        var end = newInterval[1];
        while (i < n && intervals[i][0] <= end)
        {
            start = Math.Min(start, intervals[i][0]);
            end = Math.Max(end, intervals[i][1]);
            i++;
        }

        result.Add(new[] { start, end });

        while (i < n)
        {
            result.Add(intervals[i++]);
        }

        return result.ToArray();
    }
}
```

```typescript solution
function insert(intervals: number[][], newInterval: number[]): number[][] {
  const result: number[][] = [];
  let i = 0;
  const n = intervals.length;

  while (i < n && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i++]);
  }

  let [start, end] = newInterval;
  while (i < n && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }

  result.push([start, end]);

  while (i < n) {
    result.push(intervals[i++]);
  }

  return result;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(n) for the output.

Adding the new interval to the list and running "Merge Intervals" also gives the right result, but it takes O(n log n) because of the sort; here we take advantage of the input already being sorted.
