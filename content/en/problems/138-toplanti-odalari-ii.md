---
title: Meeting Rooms II
---
You are given an array `intervals` of meeting time intervals where `intervals[i] = [start_i, end_i]`. Return the **minimum number of meeting rooms** required to hold all the meetings without conflicts.

At the moment a meeting ends (`end_i`), another meeting (`start_j == end_i`) can start in the same room.

### Example 1

```text
Input:  intervals = [[0,30],[5,10],[15,20]]
Output:  2
Explanation: The meeting [0,30] can go in the first room, and the meetings [5,10] and [15,20], one after the other, in the second room.
```

### Example 2

```text
Input:  intervals = [[7,10],[2,4]]
Output:  1
Explanation: The meetings do not overlap, so a single room is enough.
```

### Constraints

- `1 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i < end_i <= 10^6`

## Hints

- The minimum number of rooms needed equals the maximum number of meetings **running at the same time** at any moment.
- When a meeting starts, the number of rooms in use goes up by 1; when a meeting ends, it goes down by 1.
- It does not matter which meeting pairs with which; all that matters is whether some meeting has already ended when a new one starts.
- Sort the start times (`starts`) and end times (`ends`) in two separate arrays and move along the timeline with two pointers.

## Solution

The minimum number of meeting rooms needed equals the **maximum number of meetings active at the same time** on the timeline.

When a new meeting starts, if a room has been freed up, we can take it over; otherwise we need to open a new room. It does not matter which specific meeting ended; all that matters is whether the earliest-ending meeting ends before the new meeting starts.

So we sort the start and end times in two separate arrays (`starts` and `ends`) in ascending order and move through time with two pointers (`s` and `e`):
1. If `starts[s] < ends[e]`, a new meeting has started before the earliest-ending meeting is over. We increase the number of active rooms (`rooms++`), update `maxRooms`, and advance the `s` pointer.
2. Otherwise (`starts[s] >= ends[e]`), a meeting has ended and its room is free. We decrease the number of active rooms (`rooms--`) and advance the `e` pointer.

Once all the starts have been processed, `maxRooms` gives us the minimum number of rooms needed.

```csharp solution
public class Solution
{
    public int MinMeetingRooms(int[][] intervals)
    {
        int n = intervals.Length;
        int[] starts = new int[n];
        int[] ends = new int[n];

        for (int i = 0; i < n; i++)
        {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }

        Array.Sort(starts);
        Array.Sort(ends);

        int rooms = 0;
        int maxRooms = 0;
        int s = 0;
        int e = 0;

        while (s < n)
        {
            if (starts[s] < ends[e])
            {
                // The earliest-ending meeting is not over yet; a new room is needed.
                rooms++;
                maxRooms = Math.Max(maxRooms, rooms);
                s++;
            }
            else
            {
                // A meeting has ended; its room is now free.
                rooms--;
                e++;
            }
        }

        return maxRooms;
    }
}
```

```typescript solution
function minMeetingRooms(intervals: number[][]): number {
  const n = intervals.length;
  const starts = new Array<number>(n);
  const ends = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    starts[i] = intervals[i][0];
    ends[i] = intervals[i][1];
  }

  starts.sort((a, b) => a - b);
  ends.sort((a, b) => a - b);

  let rooms = 0;
  let maxRooms = 0;
  let s = 0;
  let e = 0;

  while (s < n) {
    if (starts[s] < ends[e]) {
      rooms++;
      maxRooms = Math.max(maxRooms, rooms);
      s++;
    } else {
      rooms--;
      e++;
    }
  }

  return maxRooms;
}
```

### Complexity

- **Time:** O(n log n). Sorting the start and end arrays takes O(n log n), and scanning them with two pointers takes O(n).
- **Space:** O(n), for the `starts` and `ends` arrays.
