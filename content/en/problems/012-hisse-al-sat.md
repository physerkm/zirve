---
title: Best Time to Buy and Sell Stock
---
`prices[i]` is the price of a stock on day `i`. Return the maximum profit you can make by **buying the stock on one day and selling it on a later day**. If no profit is possible, return `0`.

### Example 1

```text
Input:  prices = [7, 1, 5, 3, 6, 4]
Output:  5
Explanation: Buy on day 2 (price 1) and sell on day 5 (price 6): profit 5.
```

### Example 2

```text
Input:  prices = [7, 6, 4, 3, 1]
Output:  0
Explanation: The price keeps falling; no transaction is made.
```

### Constraints

- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

## Hints

- Trying every buy–sell pair is O(n²).
- If you're going to sell on a given day, the best day to buy is the day with the **lowest price before** it.
- As you walk the array, keep "the lowest price so far" up to date.

## Solution

Treat each day as a possible **selling day**. The best profit from selling on that day is the difference between that day's price and the lowest price seen up to that day. As you walk the array once, it's enough to keep two values up to date: the lowest price so far and the largest profit so far.

```csharp solution
public class Solution
{
    public int MaxProfit(int[] prices)
    {
        var lowest = int.MaxValue;
        var best = 0;

        foreach (var price in prices)
        {
            lowest = Math.Min(lowest, price);
            best = Math.Max(best, price - lowest);
        }

        return best;
    }
}
```

```typescript solution
function maxProfit(prices: number[]): number {
  let lowest = Infinity;
  let best = 0;

  for (const price of prices) {
    lowest = Math.min(lowest, price);
    best = Math.max(best, price - lowest);
  }

  return best;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1).

A common mistake is to find the lowest and highest prices and take their difference. That's wrong: the highest price may come **before** the lowest price (`[7, 1, 5]`). The buy must come before the sell; the one-pass solution guarantees this automatically.
