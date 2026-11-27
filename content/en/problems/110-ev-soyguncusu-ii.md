---
title: House Robber II
---
A robber is planning to rob the houses on a street; `nums[i]` is the amount of money in house `i`. The houses on this street are arranged **in a circle**: the first house is a neighbor of the last one. If two adjacent houses are robbed on the same night, the alarm goes off.

Return the **maximum amount of money** you can rob without setting off the alarm.

### Example 1

```text
Input:  nums = [2, 3, 2]
Output:  3
Explanation: Houses 1 and 3 (2 + 2) are adjacent, so they cannot be robbed together.
```

### Example 2

```text
Input:  nums = [1, 2, 3, 1]
Output:  4
Explanation: House 1 (1) and house 3 (3).
```

### Example 3

```text
Input:  nums = [1, 2, 3]
Output:  3
```

### Constraints

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 1000`

## Hints

- Without the circle, this would be exactly "House Robber".
- The first and last houses cannot both be robbed. So either the first house is **left out**, or the last one is.
- Run the linear solution twice: on `nums[0..n-2]` and on `nums[1..n-1]`. The larger result is the answer. If there is only one house, return it.

## Solution

### Two linear robberies

We split the circle into two linear problems: the range `[1, n-1]` that excludes the first house, and the range `[0, n-2]` that excludes the last house. Any valid robbery fits into at least one of them, because the first and last houses cannot both be chosen.

Two variables are enough for the linear problem: `prev2` is the best take up to two houses back, and `prev1` the best take up to the previous house. At each house, `cur = max(prev1, prev2 + nums[i])`: either we skip this house, or we rob it and add it to the take from two houses back.

```csharp solution
public class Solution
{
    public int Rob(int[] nums)
    {
        if (nums.Length == 1)
        {
            return nums[0];
        }

        return Math.Max(RobLine(nums, 0, nums.Length - 2), RobLine(nums, 1, nums.Length - 1));
    }

    private static int RobLine(int[] nums, int lo, int hi)
    {
        var prev2 = 0;
        var prev1 = 0;
        for (var i = lo; i <= hi; i++)
        {
            var current = Math.Max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = current;
        }

        return prev1;
    }
}
```

```typescript solution
function rob(nums: number[]): number {
  if (nums.length === 1) return nums[0];

  const robLine = (lo: number, hi: number): number => {
    let prev2 = 0;
    let prev1 = 0;
    for (let i = lo; i <= hi; i++) {
      const current = Math.max(prev1, prev2 + nums[i]);
      prev2 = prev1;
      prev1 = current;
    }
    return prev1;
  };

  return Math.max(robLine(0, nums.length - 2), robLine(1, nums.length - 1));
}
```

### Complexity

- **Time:** O(n). Two linear passes.
- **Space:** O(1).

Splitting a circular constraint into two linear cases, "this element is excluded" and "that element is excluded", is a common trick for circular arrays.
