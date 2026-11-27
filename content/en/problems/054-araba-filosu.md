---
title: Car Fleet
---
There are `n` cars on a single-lane road, all heading to the same destination `target` miles from the start.

You are given two integer arrays `position` and `speed`, both of length `n`: `position[i]` is the starting position of the `i`-th car (in miles), and `speed[i]` is the speed of the `i`-th car (in miles per hour).

A car **cannot pass** the car ahead of it, but it can catch up to it and drive bumper to bumper at the same speed. One or more cars driving together (at the same position and the same speed) form a **car fleet**.

If a car catches up to a fleet exactly at the `target` point, it still counts as part of that fleet.

Return the **number of car fleets** that will arrive at the destination.

### Example 1

```text
Input:  target = 12, position = [10, 8, 0, 5, 3], speed = [2, 4, 1, 1, 3]
Output: 3
Explanation:
  The cars at 10 (speed 2) and 8 (speed 4) meet at mile 12 and become one fleet.
  The car at 0 (speed 1) never catches up to any car; it is a fleet by itself.
  The cars at 5 (speed 1) and 3 (speed 3) meet at mile 6, slow down to speed 1, and arrive together.
```

### Example 2

```text
Input:  target = 10, position = [3], speed = [3]
Output: 1
Explanation: There is only one car, so there is a single fleet.
```

### Example 3

```text
Input:  target = 100, position = [0, 2, 4], speed = [4, 2, 1]
Output: 1
Explanation: The cars at 0 and 2 meet at mile 4, also catch up to the car at 4, and arrive at the destination as a single fleet.
```

### Constraints

- `n == position.length == speed.length`
- `1 <= n <= 10^5`
- `0 < target <= 10^6`
- `0 <= position[i] < target`
- All values in `position` are distinct.
- `0 < speed[i] <= 10^6`

## Hints

- You don't need to compute the exact mile where cars meet; what matters is whether the car behind can reach the destination **before or at the same time as** the car ahead.
- Sort the cars from closest to the destination to farthest (by position, in decreasing order): nothing can slow down the car in front.
- For each car, compute how many hours it would take to reach the destination if unobstructed: `(double)(target - position[i]) / speed[i]`.
- Moving from right to left, if a car's arrival time is **greater** than the fleet ahead's arrival time, it can't catch up and starts a new fleet; if it is less than or equal, it joins the fleet ahead.

## Solution

On a single-lane road, the car ahead can slow down the car behind, but the car behind can't speed up the one ahead. That is why examining the cars from **closest to the destination to farthest** (right to left by position) simplifies the problem a lot: nobody is in front of the lead car, so its arrival time is fixed.

For each car, we use the formula `(target - pos) / speed` to compute, as a floating-point number (`double`), how many hours it would take to reach the destination with nothing in its way. After sorting the cars by position from largest to smallest, we look at them in order:

- If the next car's arrival time is **less than or equal to** the arrival time of the fleet ahead (`leadTime`), the car catches up to the fleet ahead before (or exactly at) the destination and merges with it; since the fleet's speed is set by the slower car in front, `leadTime` doesn't change.
- If its arrival time is **greater** than `leadTime`, the car can never catch up to the fleet ahead; it becomes the leader of a new fleet on its own (`fleets++`), and the cars behind are now compared against this new `leadTime`.

Integer division would cause rounding errors, so we must compute the time as a `double`.

```csharp solution
public class Solution
{
    public int CarFleet(int target, int[] position, int[] speed)
    {
        int n = position.Length;
        var cars = new (int Pos, double Time)[n];

        for (int i = 0; i < n; i++)
        {
            cars[i] = (position[i], (double)(target - position[i]) / speed[i]);
        }

        // Sort from the car closest to the destination to the farthest.
        Array.Sort(cars, (a, b) => b.Pos.CompareTo(a.Pos));

        int fleets = 0;
        double leadTime = 0;

        foreach (var car in cars)
        {
            // If it arrives later than the fleet ahead, it can't catch up; it starts a new fleet.
            if (car.Time > leadTime)
            {
                fleets++;
                leadTime = car.Time;
            }
        }

        return fleets;
    }
}
```

```typescript solution
function carFleet(target: number, position: number[], speed: number[]): number {
  const cars = position
    .map((pos, i) => ({ pos, time: (target - pos) / speed[i] }))
    .sort((a, b) => b.pos - a.pos);

  let fleets = 0;
  let leadTime = 0;

  for (const car of cars) {
    if (car.time > leadTime) {
      fleets++;
      leadTime = car.time;
    }
  }

  return fleets;
}
```

### Complexity

- **Time:** O(n log n). Sorting the cars by position takes O(n log n), then counting the fleets in a single pass takes O(n).
- **Space:** O(n), for the array holding each car's position and arrival time.
