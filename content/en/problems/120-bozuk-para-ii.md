---
title: Coin Change II
---
You are given an amount `amount` and coins of different denominations `coins`. You may use an **unlimited** number of each coin. Return the number of **distinct combinations** that make up the amount. If the amount cannot be made, return `0`.

Order does not matter in a combination: `1 + 2` and `2 + 1` are the same combination. The answer fits in a 32-bit integer.

### Example 1

```text
Input:  amount = 5, coins = [1, 2, 5]
Output:  4
Explanation: 5 = 5, 5 = 2 + 2 + 1, 5 = 2 + 1 + 1 + 1, 5 = 1 + 1 + 1 + 1 + 1
```

### Example 2

```text
Input:  amount = 3, coins = [2]
Output:  0
```

### Example 3

```text
Input:  amount = 10, coins = [10]
Output:  1
```

### Constraints

- `1 <= coins.length <= 300`
- `1 <= coins[i] <= 5000`; all values are distinct.
- `0 <= amount <= 5000`

## Hints

- `dp[a]`: the number of combinations that make up the amount `a`. `dp[0] = 1` (using no coins).
- For order not to matter, the loop order is critical: the **outer loop must be over the coins**, and the inner loop over the amounts.
- For each coin, `dp[a] += dp[a - coin]` with `a` going from small to large. Since the same coin can be reused, going left to right is correct.

## Solution

### Unbounded knapsack, one round per coin

We "unlock" the coins one at a time. When `coin` is unlocked, the new ways to reach amount `a` are formed by adding one more `coin` to every way of reaching `a - coin`: `dp[a] += dp[a - coin]`.

Because the outer loop runs over the coins, each combination is counted in **exactly one** form, with its coins ordered by when they were unlocked; `1 + 2` and `2 + 1` are not counted separately. (If the loops were swapped, permutations would be counted.) The inner loop going from small to large lets the same coin be used more than once.

```csharp solution
public class Solution
{
    public int Change(int amount, int[] coins)
    {
        var dp = new int[amount + 1];
        dp[0] = 1;

        foreach (var coin in coins)
        {
            for (var a = coin; a <= amount; a++)
            {
                dp[a] += dp[a - coin];
            }
        }

        return dp[amount];
    }
}
```

```typescript solution
function change(amount: number, coins: number[]): number {
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;

  for (const coin of coins) {
    for (let a = coin; a <= amount; a++) {
      dp[a] += dp[a - coin];
    }
  }

  return dp[amount];
}
```

### Complexity

- **Time:** O(n × amount).
- **Space:** O(amount).

"Coin Change" (fewest coins) uses a table of the same shape as this problem; what differs is the combining operation: a **sum** instead of `min`.
