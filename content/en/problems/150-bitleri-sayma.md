---
title: Counting Bits
---
You are given an integer `n`. Return an array `ans` of length `n + 1` such that for each `i` (`0 <= i <= n`), `ans[i]` equals the **number of `1` bits** in the binary representation of `i`.

Your solution should run in **linear time** (`O(n)`) in a single pass.

### Example 1

```text
Input:  n = 2
Output:  [0, 1, 1]
Explanation:
0 --> 0      (0 one bits)
1 --> 1      (1 one bit)
2 --> 10     (1 one bit)
```

### Example 2

```text
Input:  n = 5
Output:  [0, 1, 1, 2, 1, 2]
Explanation:
0 --> 0      (0)
1 --> 1      (1)
2 --> 10     (1)
3 --> 11     (2)
4 --> 100    (1)
5 --> 101    (2)
```

### Constraints

- `0 <= n <= 10^5`

## Hints

- Instead of counting bits independently for each number, can you use the previously computed results for smaller numbers?
- When you shift a number `i` right by one bit (`i >> 1`, i.e., `i / 2`), only the rightmost bit drops off; all the other bits stay the same.
- For example, if you shift `5` (`101`) right by one bit, you get `2` (`10`), and the last bit that dropped off is `1` (`5 & 1 = 1`).
- So the relation `dp[i] = dp[i >> 1] + (i & 1)` holds for every `i >= 1`.

## Solution

Instead of counting the bits of every number from `0` to `n` from scratch, we can use **dynamic programming (DP)** together with the **bit-shift** relationship.

We can split the binary representation of an integer `i` into two parts:
1. **The upper bits, excluding the rightmost bit:** This value corresponds to the number `i >> 1` (that is, the integer division `i / 2`). Since `i >> 1 < i`, we have **already computed** how many `1` bits this number contains in `dp[i >> 1]`.
2. **The rightmost bit (LSB):** It is `1` if the number is odd and `0` if it is even; this is found in `O(1)` time with the expression `i & 1`.

For example, for `i = 6` (`110`):
- `6 >> 1 = 3` (`11`) and `dp[3] = 2`,
- `6 & 1 = 0` (the rightmost bit is `0`),
- `dp[6] = dp[3] + 0 = 2`.

For `i = 7` (`111`):
- `7 >> 1 = 3` (`11`) and `dp[3] = 2`,
- `7 & 1 = 1` (the rightmost bit is `1`),
- `dp[7] = dp[3] + 1 = 3`.

The base case is `dp[0] = 0`. With a single loop from `1` to `n`, we fill each element in constant time (`O(1)`).

```csharp solution
public class Solution
{
    public int[] CountBits(int n)
    {
        int[] dp = new int[n + 1];

        for (int i = 1; i <= n; i++)
        {
            // Add the rightmost bit (i & 1) to the 1-bit count of i >> 1.
            dp[i] = dp[i >> 1] + (i & 1);
        }

        return dp;
    }
}
```

```typescript solution
function countBits(n: number): number[] {
  const dp = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i >> 1] + (i & 1);
  }

  return dp;
}
```

### Complexity

- **Time:** `O(n)`. For each number from `1` to `n`, only one right shift, one AND (`&`) and one addition are performed.
- **Space:** `O(1)` extra memory (excluding the returned output array `dp` of size `n + 1`).
