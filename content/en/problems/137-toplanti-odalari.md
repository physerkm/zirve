---
title: Meeting Rooms
---
You are given an array `intervals` of meeting time intervals where `intervals[i] = [start_i, end_i]`. Determine whether a person can attend **all** the meetings.

A meeting that starts at the moment another one ends (for example `[0, 8]` and `[8, 10]`) is **not** considered overlapping.

### Example 1

```text
Input:  intervals = [[0,30],[5,10],[15,20]]
Output:  false
Explanation: The meeting [0,30] overlaps with both [5,10] and [15,20].
```

### Example 2

```text
Input:  intervals = [[7,10],[2,4]]
Output:  true
Explanation: [7,10] starts after [2,4] ends; there is no overlap.
```

### Constraints

- `0 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i < end_i <= 10^6`

## Hints

- For a person to attend all meetings, no two meetings may overlap.
- Comparing every meeting with every other meeting takes O(n²). What changes if we put the meetings in time order?
- When we sort the meetings by **start time**, any overlap always shows up between two **adjacent** meetings.
- In the sorted array, if `intervals[i][0] < intervals[i - 1][1]` holds, meeting `i` starts before the previous meeting has ended.

## Solution

A person can attend all meetings exactly when none of the meeting intervals overlap.

When we sort the intervals by **start time (`start`)** in ascending order, the meetings fall into chronological order. Now it is enough to compare each meeting only with the meeting right before it:
- If the start time of meeting `i` (`intervals[i][0]`) is **less** than the end time of meeting `i - 1` (`intervals[i - 1][1]`), the new meeting started before the previous one ended; we return `false` immediately.
- If no adjacent pair overlaps throughout the loop, attending all meetings is possible and we return `true`.

```csharp solution
public class Solution
{
    public bool CanAttendMeetings(int[][] intervals)
    {
        // Arrange the meetings in chronological order by start time.
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));

        for (int i = 1; i < intervals.Length; i++)
        {
            // If the next meeting starts before the previous one ends, there is an overlap.
            if (intervals[i][0] < intervals[i - 1][1])
                return false;
        }

        return true;
    }
}
```

```typescript solution
function canAttendMeetings(intervals: number[][]): boolean {
  intervals.sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) {
      return false;
    }
  }

  return true;
}
```

### Complexity

- **Time:** O(n log n). Sorting takes O(n log n), and the loop that scans adjacent intervals takes O(n).
- **Space:** O(1) extra space (apart from the O(log n) stack space used by the sorting algorithm).
