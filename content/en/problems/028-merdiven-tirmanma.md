---
title: Climbing Stairs
---
You are climbing a staircase with `n` steps. Each time, you can climb **1 or 2 steps**. In how many **distinct ways** can you reach the top?

### Example 1

```text
Input:  n = 2
Output:  2
Explanation: 1+1 or 2.
```

### Example 2

```text
Input:  n = 3
Output:  3
Explanation: 1+1+1, 1+2 or 2+1.
```

### Constraints

- `1 <= n <= 45`

## Hints

- Where could you have come from on your last move to step `n`?
- The number of ways to reach step `n` is the sum of the ways to reach steps `n-1` and `n-2`.
- Recursion written without caching solves the same subproblems over and over and takes exponential time.

## Solution

You reach step `n` either from step `n-1` with a single step or from step `n-2` with a double step. These two sets are disjoint, so:

```text
ways(n) = ways(n-1) + ways(n-2)
ways(0) = 1,  ways(1) = 1
```

This is the Fibonacci sequence itself. Since each value depends only on the previous two, you don't need to keep the whole table; two variables are enough.

```csharp solution
public class Solution
{
    public int ClimbStairs(int n)
    {
        var previous = 1;   // ways(i-2)
        var current = 1;    // ways(i-1)

        for (var i = 2; i <= n; i++)
        {
            (previous, current) = (current, previous + current);
        }

        return current;
    }
}
```

```typescript solution
function climbStairs(n: number): number {
  let previous = 1;
  let current = 1;

  for (let i = 2; i <= n; i++) {
    [previous, current] = [current, previous + current];
  }

  return current;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(1).

Recursion without memoization (`f(n) = f(n-1) + f(n-2)`) takes O(2ⁿ) time; for `n = 45` it makes billions of calls. This problem is the simplest example of dynamic programming: overlapping subproblems are solved only once.
