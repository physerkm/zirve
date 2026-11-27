---
title: Gas Station
---
There are `n` gas stations along a circular route. At station `i` you can get `gas[i]` units of gas; traveling from station `i` to the next one costs `cost[i]` units of gas. You start the journey at one of the stations with an empty tank, in a car with an unlimited tank.

Return the index of the starting station from which you can travel around the circuit **once** in the clockwise direction; if it is not possible, return `-1`. If a solution exists, it is **unique**.

### Example 1

```text
Input:  gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]
Output:  3
Explanation: Start at station 3 with 4 units. You reach station 4 with 4 - 1 + 5 = 8, station 0 with 8 - 2 + 1 = 7,
station 1 with 7 - 3 + 2 = 6, station 2 with 6 - 4 + 3 = 5, and get back to station 3 with 5 - 5 = 0.
```

### Example 2

```text
Input:  gas = [2, 3, 4], cost = [3, 4, 3]
Output:  -1
```

### Constraints

- `n == gas.length == cost.length`, `1 <= n <= 10^5`
- `0 <= gas[i], cost[i] <= 10^4`

## Hints

- If the total gas is less than the total cost, the trip is impossible. Otherwise a solution always exists.
- If you start at station `s` and your tank goes negative before reaching `k`, then **none** of the stations between `s` and `k` can be the start either. Why?
- Walk the stations once; when the tank goes negative, move the start to the next station and reset the tank.

## Solution

### Greedy choice in a single pass

1. If `sum(gas) < sum(cost)`, the answer is `-1`.
2. Otherwise we start with `start = 0`, `tank = 0`. At each station, `tank += gas[i] - cost[i]`. If the tank goes negative, `start = i + 1`, `tank = 0`.

Why can we skip the stations between `start` and `i`? Every time we left `start` and reached some `j` (`start < j <= i`), our tank was **non-negative**. Starting from `j` with an empty tank means losing that positive contribution carried from `start`; so a trip starting from `j` also gets stuck at `i`. When the total gas is sufficient, the last remaining `start` completes the circuit.

```csharp solution
public class Solution
{
    public int CanCompleteCircuit(int[] gas, int[] cost)
    {
        if (gas.Sum() < cost.Sum())
        {
            return -1;
        }

        var start = 0;
        var tank = 0;
        for (var i = 0; i < gas.Length; i++)
        {
            tank += gas[i] - cost[i];
            if (tank < 0)
            {
                start = i + 1;
                tank = 0;
            }
        }

        return start;
    }
}
```

```typescript solution
function canCompleteCircuit(gas: number[], cost: number[]): number {
  const total = gas.reduce((a, b) => a + b, 0) - cost.reduce((a, b) => a + b, 0);
  if (total < 0) return -1;

  let start = 0;
  let tank = 0;
  for (let i = 0; i < gas.length; i++) {
    tank += gas[i] - cost[i];
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }

  return start;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1).
