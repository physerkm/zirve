---
title: Partition Equal Subset Sum
---
You are given an array `nums` of positive integers. Return `true` if you can partition the array into two subsets whose element sums are **equal**, and `false` otherwise.

### Example 1

```text
Input:  nums = [1, 5, 11, 5]
Output:  true
Explanation: [1, 5, 5] and [11].
```

### Example 2

```text
Input:  nums = [1, 2, 3, 5]
Output:  false
```

### Constraints

- `1 <= nums.length <= 200`
- `1 <= nums[i] <= 100`

## Hints

- If the total is odd, the answer is immediately `false`. If it is even, the question becomes: is there a subset whose sum is `sum / 2`?
- This is a 0/1 knapsack problem: each element is either chosen or not.
- `dp[t]`: can the sum `t` be formed with the elements seen so far? For each element, iterate `t` **from large to small** so that the same element is not used twice.

## Solution

### 0/1 knapsack, one-dimensional table

Let `target = sum / 2`. `dp[t]` is `true` if the sum `t` can be reached with a subset of the elements processed so far. Initially only `dp[0] = true` (the empty set).

For each element `x`, over the range `t = target .. x` in **decreasing** order, set `dp[t] = dp[t] || dp[t - x]`. The decreasing order matters: `dp[t - x]` has not been updated yet in this round, so `x` is used at most once. If `dp[target]` becomes `true`, we can return early.

```csharp solution
public class Solution
{
    public bool CanPartition(int[] nums)
    {
        var sum = nums.Sum();
        if (sum % 2 != 0)
        {
            return false;
        }

        var target = sum / 2;
        var dp = new bool[target + 1];
        dp[0] = true;

        foreach (var x in nums)
        {
            for (var t = target; t >= x; t--)
            {
                dp[t] = dp[t] || dp[t - x];
            }

            if (dp[target])
            {
                return true;
            }
        }

        return dp[target];
    }
}
```

```typescript solution
function canPartition(nums: number[]): boolean {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;

  const target = sum / 2;
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;

  for (const x of nums) {
    for (let t = target; t >= x; t--) {
      dp[t] = dp[t] || dp[t - x];
    }
    if (dp[target]) return true;
  }

  return dp[target];
}
```

### Complexity

- **Time:** O(n × target). At most 200 × 10,000.
- **Space:** O(target).
