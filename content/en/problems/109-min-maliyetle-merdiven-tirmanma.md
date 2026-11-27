---
title: Min Cost Climbing Stairs
---

You are given an integer array `cost` representing the step costs of a staircase, where `cost[i]` is the cost you pay when you step on step `i`. Once you pay the cost, you can climb one or two steps.

You can start climbing from step `0` or step `1`. Return the **minimum cost** to reach the top of the staircase (one past the last step, at position `cost.length`).

### Example 1

```text
Input:  cost = [10, 15, 20]
Output:  15
Explanation: You start at step 1 (pay 15) and climb two steps straight to the top.
```

### Example 2

```text
Input:  cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]
Output:  6
Explanation: You start at step 0 and step only on the steps that cost 1 (0 -> 2 -> 4 -> 6 -> 7 -> 9 -> top), reaching the top for a total cost of 6.
```

### Constraints

- `2 <= cost.length <= 1000`
- `0 <= cost[i] <= 999`

## Hints

- You can reach step `i` only from step `i - 1` or step `i - 2`.
- So the cheapest way to reach step `i` and pay its cost is `cost[i] + min(dp[i - 1], dp[i - 2])`.
- You can reach the top (position `n`) by taking 1 step from the last step (`n - 1`) or 2 steps from the second-to-last step (`n - 2`).
- Instead of keeping the whole array, you can keep only the minimum costs of the last two steps (`prev2` and `prev1`) and bring the space down to O(1).

## Solution

For each step, compute the minimum cost of stepping on it and being ready to continue from there. Since you can start directly from step `0` or step `1`, the base costs of these two steps are `prev2 = cost[0]` and `prev1 = cost[1]`.

For each step from `i = 2` to `n - 1`:
- The cheapest way to arrive at that step is to jump from whichever is cheaper, the previous step (`prev1`) or the one before it (`prev2`): `cur = cost[i] + Math.Min(prev1, prev2)`.
- Then slide the window forward by one step: `prev2 = prev1`, `prev1 = cur`.

When the loop ends, `prev1` holds the total cost of the last step (`n - 1`) and `prev2` that of the second-to-last step (`n - 2`). Since you can reach the top from either step in one move, `Math.Min(prev1, prev2)` is the answer.

```csharp solution
public class Solution
{
    public int MinCostClimbingStairs(int[] cost)
    {
        int prev2 = cost[0];
        int prev1 = cost[1];

        for (int i = 2; i < cost.Length; i++)
        {
            int cur = cost[i] + Math.Min(prev1, prev2);
            prev2 = prev1;
            prev1 = cur;
        }

        return Math.Min(prev1, prev2);
    }
}
```

```typescript solution
function minCostClimbingStairs(cost: number[]): number {
  let prev2 = cost[0];
  let prev1 = cost[1];

  for (let i = 2; i < cost.length; i++) {
    const cur = cost[i] + Math.min(prev1, prev2);
    prev2 = prev1;
    prev1 = cur;
  }

  return Math.min(prev1, prev2);
}
```

### Complexity

- **Time:** O(n). We scan the array from start to end in a single pass.
- **Space:** O(1). Only the `prev2` and `prev1` variables, which hold the last two states, are used.
