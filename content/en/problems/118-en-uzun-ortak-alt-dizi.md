---
title: Longest Common Subsequence
---
You are given two strings `text1` and `text2`. Return the length of their **longest common subsequence**. If there is no common subsequence, return `0`.

A **subsequence** of a string is a new string formed from the original by deleting some characters (or none) without changing the relative order of the remaining characters. For example, `"ace"` is a subsequence of `"abcde"`.

A **common subsequence** of two strings is a string that is a subsequence of both.

### Example 1

```text
Input:  text1 = "abcde", text2 = "ace"
Output:  3
Explanation: The longest common subsequence is "ace", with length 3.
```

### Example 2

```text
Input:  text1 = "abc", text2 = "abc"
Output:  3
Explanation: The longest common subsequence is "abc", with length 3.
```

### Example 3

```text
Input:  text1 = "abc", text2 = "def"
Output:  0
Explanation: There is no common subsequence, so the result is 0.
```

### Constraints

- `1 <= text1.length, text2.length <= 1000`
- `text1` and `text2` consist only of lowercase English letters.

## Hints

- Imagine comparing the first characters of the two strings (`text1[i]` and `text2[j]`). If they are equal, can this character safely be included in the longest common subsequence?
- When `text1[i] == text2[j]`, you can advance one step in both strings (`i + 1`, `j + 1`) and add `1` to the result.
- If the characters are not equal, you have two options: skip `text1[i]` and look at the subproblem `(i + 1, j)`, or skip `text2[j]` and look at the subproblem `(i, j + 1)`.
- To avoid computing the same `(i, j)` pairs over and over, use a dynamic programming table (`dp`) of size `(m + 1) x (n + 1)`.

## Solution

We solve the problem from the end to the start with a two-dimensional dynamic programming table (`dp`). Let `dp[i, j]` be the length of the longest common subsequence of the suffixes `text1[i..]` and `text2[j..]`.

We size the table `(m + 1) x (n + 1)`. The last row (`dp[m, *]`) and the last column (`dp[*, n]`) correspond to the base cases where one of the strings is empty, and they are naturally `0`.

Going from the end to the start, each cell `(i, j)` has two cases:
1. **The characters match (`text1[i] == text2[j]`):** we take this character into the common subsequence and add `1` to the answer for the remaining parts of both strings: `dp[i, j] = 1 + dp[i + 1, j + 1]`.
2. **The characters do not match (`text1[i] != text2[j]`):** the two characters cannot both be in the common subsequence. We leave one of them out and pick the larger of the two resulting subproblems: `dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j + 1])`.

Once the whole table is filled, `dp[0, 0]` gives the length of the longest common subsequence of the two full strings.

```csharp solution
public class Solution
{
    public int LongestCommonSubsequence(string text1, string text2)
    {
        int m = text1.Length;
        int n = text2.Length;
        // dp[i, j]: LCS length of the suffixes text1[i..] and text2[j..].
        int[,] dp = new int[m + 1, n + 1];

        for (int i = m - 1; i >= 0; i--)
        {
            for (int j = n - 1; j >= 0; j--)
            {
                if (text1[i] == text2[j])
                    dp[i, j] = 1 + dp[i + 1, j + 1];
                else
                    dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j + 1]);
            }
        }

        return dp[0, 0];
    }
}
```

```typescript solution
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (text1[i] === text2[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  return dp[0][0];
}
```

### Complexity

- **Time:** O(m · n). For two strings of lengths `m` and `n`, each of the `m · n` cells is computed in O(1) time.
- **Space:** O(m · n), for the `dp` table of size `(m + 1) x (n + 1)`.
