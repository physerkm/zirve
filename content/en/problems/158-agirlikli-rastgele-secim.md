---
title: Random Pick with Weight
---
You are given a 0-indexed array of positive integers `w`, where `w[i]` is the weight of index `i`. You need to pick an index from the range `[0, w.length - 1]` **with probability proportional to its weight**: the probability of picking index `i` is `w[i] / sum(w)`.

For example, if `w = [1, 3]`, the probability of picking index `0` is `25%` and the probability of picking index `1` is `75%`.

Since randomness can't be verified in tests, the random number is supplied from outside: in a call to `pickIndex(r)`, `r` is an integer chosen **uniformly at random** from `[1, sum(w)]` (in a real implementation, `r = random.Next(1, total + 1)`). Your job is to map `r` to the correct index: think of the weights as ranges laid out side by side, and return the index whose range `r` falls into.

Implement the `WeightedPicker` class:

- `WeightedPicker(w)` creates the object with the weights.
- `pickIndex(r)` returns the index `i` that satisfies `prefix[i-1] < r <= prefix[i]` (`prefix` is the prefix sum of the weights).

### Example

```text
Operations:  WeightedPicker([1, 3]), pickIndex(1), pickIndex(2), pickIndex(4)
Output:      null,                   0,            1,            1
Explanation: Ranges: 0 → [1, 1], 1 → [2, 4]. If r is chosen uniformly, index 1 covers 3 of the 4 values.
```

### Constraints

- `1 <= w.length <= 10^4`
- `1 <= w[i] <= 10^5`
- `1 <= r <= sum(w)`
- `pickIndex` is called at most `10^4` times.

## Hints

- Think of the weights as consecutive ranges on a number line: `w = [2, 5, 3]` → `[1..2]`, `[3..7]`, `[8..10]`.
- The prefix sums `[2, 7, 10]` are the end points of these ranges, and they are in increasing order.
- The range that contains `r` is the **first** `i` with `prefix[i] >= r`: binary search.

## Solution

### Prefix sums and binary search

The constructor computes the `prefix` array: `prefix[i] = w[0] + ... + w[i]`. The range of index `i` is `(prefix[i-1], prefix[i]]`, and its length is exactly `w[i]`. Because `r` is uniformly distributed over these ranges, each index is picked with probability proportional to its weight.

`pickIndex(r)` finds the first `i` with `prefix[i] >= r` using binary search: if `prefix[mid] < r`, the answer is to the right; otherwise it is `mid` or to its left.

```csharp solution
public class WeightedPicker
{
    private readonly long[] prefix;

    public WeightedPicker(int[] w)
    {
        prefix = new long[w.Length];
        long running = 0;
        for (var i = 0; i < w.Length; i++)
        {
            running += w[i];
            prefix[i] = running;
        }
    }

    public int PickIndex(int r)
    {
        var lo = 0;
        var hi = prefix.Length - 1;
        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (prefix[mid] < r)
            {
                lo = mid + 1;
            }
            else
            {
                hi = mid;
            }
        }

        return lo;
    }
}
```

```typescript solution
class WeightedPicker {
  private prefix: number[] = [];

  constructor(w: number[]) {
    let running = 0;
    for (const weight of w) {
      running += weight;
      this.prefix.push(running);
    }
  }

  pickIndex(r: number): number {
    let lo = 0;
    let hi = this.prefix.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.prefix[mid] < r) lo = mid + 1;
      else hi = mid;
    }

    return lo;
  }
}
```

### Complexity

- **Time:** O(n) for the constructor, O(log n) for `pickIndex`.
- **Space:** O(n).

In the original LeetCode problem, `pickIndex()` takes no parameters and generates `r` itself. In an interview, the same mapping is what matters; make sure the random number is generated as an **integer** in `[1, total]` (or, if it is a floating-point number in `[0, total)`, adjust the comparison accordingly).
