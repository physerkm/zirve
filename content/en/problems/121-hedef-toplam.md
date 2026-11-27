---
title: Target Sum
---
You are given an integer array `nums` and an integer `target`. You build an expression by putting `+` or `-` in front of each number and concatenating them all in order. For example, for `nums = [2, 1]` you can build the expression `+2-1`.

Return the **number of different expressions** that evaluate to `target`.

### Example 1

```text
Input:  nums = [1, 1, 1, 1, 1], target = 3
Output:  5
Explanation: -1+1+1+1+1, +1-1+1+1+1, +1+1-1+1+1, +1+1+1-1+1, +1+1+1+1-1
```

### Example 2

```text
Input:  nums = [1], target = 1
Output:  1
```

### Constraints

- `1 <= nums.length <= 20`
- `0 <= nums[i] <= 1000`
- `0 <= sum(nums) <= 1000`
- `-1000 <= target <= 1000`

## Hints

- Each number has two options: trying all `2^n` expressions is feasible even for `n = 20`, but slow. Notice that the same partial sums are reached over and over.
- Let `P` be the set of numbers that get `+` and `N` the set that get `-`. Then `P - N = target` and `P + N = sum`, which gives `P = (sum + target) / 2`.
- The problem becomes counting the **number of subsets** whose sum is `(sum + target) / 2`, which you can count with 0/1 knapsack.

## Solution

### Reduce to subset sum

Let `P` be the sum of the numbers with a `+` sign and `N` the sum of those with a `-` sign. Adding the equations `P - N = target` and `P + N = sum` gives `P = (sum + target) / 2`. So every valid expression corresponds to **exactly one** subset whose sum is this value.

If `|target| > sum` or `sum + target` is odd, the answer is `0`. Otherwise, `dp[t]` is the number of subsets with sum `t`: `dp[0] = 1`, and for each `x`, with `t` **decreasing**, `dp[t] += dp[t - x]`. Zero-valued elements are counted correctly too: each one doubles every subset.

```csharp solution
public class Solution
{
    public int FindTargetSumWays(int[] nums, int target)
    {
        var sum = nums.Sum();
        if (Math.Abs(target) > sum || (sum + target) % 2 != 0)
        {
            return 0;
        }

        var goal = (sum + target) / 2;
        var dp = new int[goal + 1];
        dp[0] = 1;

        foreach (var x in nums)
        {
            for (var t = goal; t >= x; t--)
            {
                dp[t] += dp[t - x];
            }
        }

        return dp[goal];
    }
}
```

```typescript solution
function findTargetSumWays(nums: number[], target: number): number {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > sum || (sum + target) % 2 !== 0) return 0;

  const goal = (sum + target) / 2;
  const dp = new Array<number>(goal + 1).fill(0);
  dp[0] = 1;

  for (const x of nums) {
    for (let t = goal; t >= x; t--) {
      dp[t] += dp[t - x];
    }
  }

  return dp[goal];
}
```

### Complexity

- **Time:** O(n × sum).
- **Space:** O(sum).

You can also solve it without spotting the reduction: shifting the sums by `±x` at each number with a `partial sum → number of ways` dictionary takes O(n × sum). The mathematical reduction, however, turns the code into a classic subset count.
