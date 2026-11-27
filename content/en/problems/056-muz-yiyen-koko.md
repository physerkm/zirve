---
title: Koko Eating Bananas
---
Koko has `n` piles of bananas in front of her; the `i`-th pile has `piles[i]` bananas. The guards will come back in `h` hours.

Koko chooses her own eating speed of `k` bananas per hour. Each hour, she picks a pile and eats `k` bananas from it. If the pile has fewer than `k` bananas, she eats all of them and doesn't move on to another pile during that hour.

Koko likes to eat slowly but wants to finish all the bananas before the guards return. Return **the minimum integer `k` such that she can eat all the bananas within `h` hours**.

### Example 1

```text
Input:  piles = [3, 6, 7, 11], h = 8
Output: 4
Explanation: With k = 4, the hours are 1 + 2 + 2 + 3 = 8. With k = 3, it takes 1 + 2 + 3 + 4 = 10 hours.
```

### Example 2

```text
Input:  piles = [30, 11, 23, 4, 20], h = 5
Output: 30
```

### Example 3

```text
Input:  piles = [30, 11, 23, 4, 20], h = 6
Output: 23
```

### Constraints

- `1 <= piles.length <= 10^4`
- `piles.length <= h <= 10^9`
- `1 <= piles[i] <= 10^9`

## Hints

- At speed `k`, the hours needed are the sum of the `ceil(piles[i] / k)` values. As `k` grows, does this sum increase or decrease?
- The answer is between `1` and `max(piles)`. In this range, a single boundary splits "finishes in time" from "doesn't finish in time."
- Binary search over the range of values: if the middle speed finishes in time, try a smaller one; if not, try a larger one.

## Solution

### Binary search on the answer

The total hours needed is a **non-increasing** function as `k` grows. So the range `[1, max(piles)]` splits into two parts: the speeds on the left don't finish in time, and those on the right do. We are looking for the first speed that finishes in time.

We start with `lo = 1`, `hi = max(piles)`. If the hours needed at speed `mid` don't exceed `h`, the answer is `mid` or smaller (`hi = mid`); if they do, a larger speed is needed (`lo = mid + 1`). When the range narrows to a single value, that is the answer.

`ceil(p / k)` is computed with integers as `(p + k - 1) / k`. Since the total hours can reach `10^13` when `k = 1`, the total is kept in a `long`.

```csharp solution
public class Solution
{
    public int MinEatingSpeed(int[] piles, int h)
    {
        var lo = 1;
        var hi = piles.Max();

        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2;
            long hours = 0;
            foreach (var pile in piles)
            {
                hours += (pile + (long)mid - 1) / mid;
            }

            if (hours <= h)
            {
                hi = mid;
            }
            else
            {
                lo = mid + 1;
            }
        }

        return lo;
    }
}
```

```typescript solution
function minEatingSpeed(piles: number[], h: number): number {
  let lo = 1;
  let hi = Math.max(...piles);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / mid);
    }

    if (hours <= h) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return lo;
}
```

### Complexity

- **Time:** O(n log m), where `m = max(piles)`; every binary search step scans all the piles.
- **Space:** O(1).

"Binary search on the answer itself" works not only on sorted arrays but anywhere there is a **monotonic condition**. In an interview, it is important to state this monotonicity explicitly.
