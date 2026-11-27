---
title: Distinct Subsequences
---
You are given two strings `s` and `t`. Return the number of **distinct subsequences** of `s` that equal `t`.

A subsequence of a string is a new string formed from the original by deleting some characters (possibly none) without disturbing the relative order of the remaining characters. For example, `"ACE"` is a subsequence of `"ABCDE"`, but `"AEC"` is not.

The test cases are generated so that the answer fits in a 32-bit signed integer (`int`).

### Example 1

```text
Input:  s = "rabbbit", t = "rabbit"
Output:  3
Explanation:
Below are the 3 different ways to form "rabbit" from the characters of s:
rabb[b]it -> the 3rd 'b' (in brackets) is deleted
rab[b]bit -> the 2nd 'b' (in brackets) is deleted
ra[b]bbit -> the 1st 'b' (in brackets) is deleted
```

### Example 2

```text
Input:  s = "babgbag", t = "bag"
Output:  5
Explanation:
Choosing the indices [0, 1, 3], [0, 1, 6], [0, 5, 6], [2, 5, 6] and [4, 5, 6] in s forms the string "bag".
```

### Constraints

- `1 <= s.length, t.length <= 1000`
- `s` and `t` consist only of English letters.

## Hints

- Define a subproblem: in how many different ways can you form the suffix `t[j..]` within the suffix `s[i..]`?
- If `s[i]` and `t[j]` are the same, you have two options: match `s[i]` with `t[j]` and move to state `(i + 1, j + 1)`, or skip `s[i]` and move to state `(i + 1, j)`.
- If the characters differ, your only option is to skip `s[i]` and look at state `(i + 1, j)`.
- Since each row depends only on the next row (`i + 1`), you can reduce the 2D table to a one-dimensional `dp` array of length `t.length + 1`.

## Solution

We solve the problem with dynamic programming from the end to the start. `dp[j]` holds the number of different ways the suffix `t[j..]` can be formed using the suffix `s[i..]` processed so far.

Initially, the empty suffix of `t` (`j = t.Length`) can always be formed in exactly 1 way (by choosing no characters), so we start with `dp[n] = 1`.

While scanning `s` from the end to the start (from index `i = m - 1` down to `0`), at each step `i` we walk over `t` from `j = 0` to `n - 1`:
- If `s[i] != t[j]`, we cannot use `s[i]`; `dp[j]` stays the same (it keeps its value from step `i + 1`).
- If `s[i] == t[j]`, we add up the number of ways where we skip `s[i]` (`dp[j]`) and the number of ways where we match `s[i]` with `t[j]` (`dp[j + 1]`): `dp[j] += dp[j + 1]`.

Since `j` moves from left to right (`0` to `n - 1`) in the inner loop, when `dp[j]` is updated, `dp[j + 1]` has not yet been changed in this step `i`; it carries exactly the value from the previous row (`i + 1`). This gives a solution in **O(n)** space without needing an extra temporary array.

```csharp solution
public class Solution
{
    public int NumDistinct(string s, string t)
    {
        int m = s.Length;
        int n = t.Length;
        if (m < n)
            return 0;

        // dp[j]: number of ways to form the suffix t[j..] within s[i..].
        long[] dp = new long[n + 1];
        dp[n] = 1;

        for (int i = m - 1; i >= 0; i--)
        {
            for (int j = 0; j < n; j++)
            {
                if (s[i] == t[j])
                {
                    dp[j] += dp[j + 1];
                }
            }
        }

        return (int)dp[0];
    }
}
```

```typescript solution
function numDistinct(s: string, t: string): number {
  const m = s.length;
  const n = t.length;
  if (m < n) return 0;

  const dp = new Array<number>(n + 1).fill(0);
  dp[n] = 1;

  for (let i = m - 1; i >= 0; i--) {
    for (let j = 0; j < n; j++) {
      if (s[i] === t[j]) {
        dp[j] += dp[j + 1];
      }
    }
  }

  return dp[0];
}
```

### Complexity

- **Time:** O(m · n). For each character of `s`, the `dp` array of length `t` is scanned.
- **Space:** O(n). Only a one-dimensional `dp` array of size `t.Length + 1` is kept.
