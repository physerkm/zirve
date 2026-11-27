---
title: Coin Change
---
You are given an array `coins` representing coins of different denominations and an amount `amount`. Return **the fewest number of coins** needed to make up that amount. If the amount can't be made up with these coins, return `-1`.

You may use an unlimited number of coins of each kind.

### Example 1

```text
Input:  coins = [1, 2, 5], amount = 11
Output:  3
Explanation: 11 = 5 + 5 + 1
```

### Example 2

```text
Input:  coins = [2], amount = 3
Output:  -1
```

### Example 3

```text
Input:  coins = [1], amount = 0
Output:  0
```

### Constraints

- `1 <= coins.length <= 12`
- `1 <= coins[i] <= 2^31 - 1`
- `0 <= amount <= 10^4`

## Hints

- Always taking the largest coin (the greedy approach) doesn't always give the right answer: try it for `coins = [1, 3, 4]`, `amount = 6`.
- If the **last** coin of the best solution for `amount` is `c`, then the remaining amount `amount - c` must also be made up with the fewest coins.
- Compute the fewest number of coins for every amount from `0` to `amount` in a table.

## Solution

Let `fewest[a]` be the fewest number of coins needed to make up the amount `a`. If the last coin used is `c`, the remaining amount is `a - c`, so:

```text
fewest[a] = 1 + min(fewest[a - c])     (for every c not greater than a)
fewest[0] = 0
```

Fill the table from small amounts to large. For unreachable amounts, use `amount + 1` instead of "infinity": no valid solution can contain more than `amount` coins (the smallest coin is 1), and this value doesn't overflow when you add to it.

```csharp solution
public class Solution
{
    public int CoinChange(int[] coins, int amount)
    {
        var unreachable = amount + 1;
        var fewest = new int[amount + 1];
        Array.Fill(fewest, unreachable);
        fewest[0] = 0;

        for (var a = 1; a <= amount; a++)
        {
            foreach (var coin in coins)
            {
                if (coin <= a)
                {
                    fewest[a] = Math.Min(fewest[a], fewest[a - coin] + 1);
                }
            }
        }

        return fewest[amount] == unreachable ? -1 : fewest[amount];
    }
}
```

```typescript solution
function coinChange(coins: number[], amount: number): number {
  const unreachable = amount + 1;
  const fewest: number[] = new Array(amount + 1).fill(unreachable);
  fewest[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a) {
        fewest[a] = Math.min(fewest[a], fewest[a - coin] + 1);
      }
    }
  }

  return fewest[amount] === unreachable ? -1 : fewest[amount];
}
```

### Complexity

- **Time:** O(amount × coins.length).
- **Space:** O(amount).

**Why is the greedy approach wrong?** For `coins = [1, 3, 4]`, `amount = 6`, the greedy solution finds `4 + 1 + 1` (3 coins); the best solution is `3 + 3` (2 coins). The greedy method only works for certain special coin systems (e.g. 1, 5, 10, 25).
