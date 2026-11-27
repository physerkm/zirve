---
title: Burst Balloons
---
You are given `n` balloons, indexed from `0` to `n - 1`. Each balloon is painted with a number, represented by the array `nums`. You are asked to burst all the balloons.

When you burst balloon `i`, you get `nums[i - 1] * nums[i] * nums[i + 1]` coins. If `i - 1` or `i + 1` goes out of bounds of the array, treat it as if there is a virtual balloon with `1` painted on it.

Return the **maximum number of coins** you can collect by bursting the balloons in the best order.

### Example 1

```text
Input:  nums = [3, 1, 5, 8]
Output:  167
Explanation:
nums = [3, 1, 5, 8] --> [3, 5, 8] --> [3, 8] --> [8] --> []
coins =  3*1*5      +   3*5*8     +  1*3*8  + 1*8*1 = 167
```

### Example 2

```text
Input:  nums = [1, 5]
Output:  10
Explanation:
First burst 1 (1*1*5 = 5), then burst 5 (1*5*1 = 5). 10 coins in total.
```

### Constraints

- `n == nums.length`
- `1 <= n <= 300`
- `0 <= nums[i] <= 100`

## Hints

- Whichever balloon you choose to burst first, the balloons to its left and right become neighbors, and the subproblems become dependent on each other.
- Think in reverse instead: which balloon (`i`) will you burst **last** in the range `[left, right]`?
- If balloon `i` is the last one burst in `[left, right]`, all the other balloons in `[left, right]` have already burst by then; so at that moment the neighbors of `i` are definitely balloons `left - 1` and `right + 1`!
- Add virtual balloons with value `1` at both ends of the array to get rid of boundary checks.

## Solution

When we burst a balloon **first**, the left and right subarrays become neighbors, which breaks the independence of the subproblems. The key idea is to choose the balloon (`i`) that is **burst last** in the range `[left, right]`.

First we add a `1` to the left and right of the array to build a `balloons` array of length `n + 2` (indices `1..n` are the real balloons). Let `dp[left, right]` hold the maximum number of coins you can earn by bursting all the balloons in the closed range `[left, right]`.

Suppose balloon `i` (`left <= i <= right`) is burst last in `[left, right]`:
- Before `i`, all the balloons in the ranges `[left, i - 1]` and `[i + 1, right]` are burst independently of each other (`dp[left, i - 1] + dp[i + 1, right]`).
- When it is `i`'s turn, no other balloon remains in `[left, right]`, so the left neighbor of `i` is `balloons[left - 1]` and its right neighbor is `balloons[right + 1]`.
- So bursting `i` earns `balloons[left - 1] * balloons[i] * balloons[right + 1]` coins.

We grow the range length from `len = 1` to `n`, compute every subrange `[left, right]`, and return `dp[1, n]`.

```csharp solution
public class Solution
{
    public int MaxCoins(int[] nums)
    {
        int n = nums.Length;
        int[] balloons = new int[n + 2];
        balloons[0] = 1;
        balloons[n + 1] = 1;
        for (int i = 0; i < n; i++)
            balloons[i + 1] = nums[i];

        int[,] dp = new int[n + 2, n + 2];

        for (int len = 1; len <= n; len++)
        {
            for (int left = 1; left <= n - len + 1; left++)
            {
                int right = left + len - 1;
                for (int i = left; i <= right; i++)
                {
                    int coins = balloons[left - 1] * balloons[i] * balloons[right + 1]
                              + dp[left, i - 1] + dp[i + 1, right];
                    dp[left, right] = Math.Max(dp[left, right], coins);
                }
            }
        }

        return dp[1, n];
    }
}
```

```typescript solution
function maxCoins(nums: number[]): number {
  const n = nums.length;
  const balloons = [1, ...nums, 1];
  const dp: number[][] = Array.from({ length: n + 2 }, () =>
    new Array<number>(n + 2).fill(0)
  );

  for (let len = 1; len <= n; len++) {
    for (let left = 1; left <= n - len + 1; left++) {
      const right = left + len - 1;
      for (let i = left; i <= right; i++) {
        const coins =
          balloons[left - 1] * balloons[i] * balloons[right + 1] +
          dp[left][i - 1] +
          dp[i + 1][right];
        dp[left][right] = Math.max(dp[left][right], coins);
      }
    }
  }

  return dp[1][n];
}
```

### Complexity

- **Time:** O(n³). There are O(n²) subranges `[left, right]` in total, and for each range O(n) candidates are tried for the last balloon `i` to burst.
- **Space:** O(n²), for the `dp` table of size `(n + 2) x (n + 2)`.
