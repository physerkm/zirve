---
title: Best Time to Buy and Sell Stock with Cooldown
---
`prices[i]` is the price of a stock on day `i`. You may complete as many transactions (buy and sell) as you like, but:

- You can hold at most one share at a time (you must sell before you buy again).
- You cannot buy on the **day after** you sell (a one-day cooldown).

Return the **maximum profit** you can achieve.

### Example 1

```text
Input:  prices = [1, 2, 3, 0, 2]
Output:  3
Explanation: buy (1) → sell (2) → cooldown → buy (0) → sell (2)
```

### Example 2

```text
Input:  prices = [1]
Output:  0
```

### Constraints

- `1 <= prices.length <= 5000`
- `0 <= prices[i] <= 1000`

## Hints

- At the end of each day you are in one of three states: you are **holding** a share, you **sold** today, or you are **resting** without holding a share.
- Compute the best profit for each state from the previous day's states. The cooldown rule forbids going directly from the "sold" state to the "holding" state.
- Since only the previous day is needed, three variables are enough.

## Solution

### A three-state state machine

- `hold`: you hold a share at the end of the day.
- `sold`: you sold today (you cannot buy tomorrow).
- `rest`: you hold no share and did not sell today (you can buy tomorrow).

Transitions:

- `hold' = max(hold, rest - p)`: either keep holding, or buy today from the resting state.
- `sold' = hold + p`: sell what you hold today.
- `rest' = max(rest, sold)`: keep resting, or this is the cooldown day after yesterday's sale.

Initially `hold = -∞` (nothing bought yet), `sold = 0`, `rest = 0`. The answer is `max(sold, rest)`.

```csharp solution
public class Solution
{
    public int MaxProfit(int[] prices)
    {
        var hold = int.MinValue / 2;
        var sold = 0;
        var rest = 0;

        foreach (var price in prices)
        {
            var previousSold = sold;
            sold = hold + price;
            hold = Math.Max(hold, rest - price);
            rest = Math.Max(rest, previousSold);
        }

        return Math.Max(sold, rest);
    }
}
```

```typescript solution
function maxProfit(prices: number[]): number {
  let hold = -Infinity;
  let sold = 0;
  let rest = 0;

  for (const price of prices) {
    const previousSold = sold;
    sold = hold + price;
    hold = Math.max(hold, rest - price);
    rest = Math.max(rest, previousSold);
  }

  return Math.max(sold, rest);
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1).

The update order matters: `sold` must use the old `hold`, `hold` the old `rest`, and `rest` the old `sold`. That is why the old `sold` is saved beforehand.
