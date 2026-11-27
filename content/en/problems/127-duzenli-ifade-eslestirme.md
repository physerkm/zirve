---
title: Regular Expression Matching
---
You are given an input string `s` and a pattern `p`. Implement regular expression (regex) matching with support for `'.'` and `'*'`:

- `'.'` matches any single character.
- `'*'` matches **zero or more** of the element immediately before it.

The match must cover the **entire** string `s`, not just part of it.

### Example 1

```text
Input:  s = "aa", p = "a"
Output:  false
Explanation: The pattern "a" does not match the entire string "aa".
```

### Example 2

```text
Input:  s = "aa", p = "a*"
Output:  true
Explanation: '*' means the preceding character 'a' can repeat zero or more times. Repeating 'a' twice gives "aa".
```

### Example 3

```text
Input:  s = "ab", p = ".*"
Output:  true
Explanation: ".*" means zero or more '.' (any character).
```

### Constraints

- `1 <= s.length <= 20`
- `1 <= p.length <= 20`
- `s` consists only of lowercase English letters.
- `p` consists only of lowercase English letters, `'.'` and `'*'`.
- It is guaranteed that every `'*'` is preceded by a valid character (not `'*'`).

## Hints

- Check whether the characters `s[i]` and `p[j]` match at the first-character level with `firstMatch = (i < s.Length) && (p[j] == s[i] || p[j] == '.')`.
- If the next character in the pattern is `'*'` (`j + 1 < p.Length && p[j + 1] == '*'`), treat the pair `p[j]*` as a single unit.
- `p[j]*` has two options: don't use it at all (move to state `(i, j + 2)`), or, if `firstMatch` is true, use it at least once and stay on the same pattern (move to state `(i + 1, j)`).
- Even when `s` is exhausted (`i == s.Length`), `p` may still contain patterns like `"a*b*"` that can be used zero times, so fill your table starting `i` from `s.Length`.

## Solution

We solve the problem from the end to the start with 2D dynamic programming. `dp[i, j]` shows whether the suffix `s[i..]` exactly matches the pattern suffix `p[j..]` (`true` / `false`).

When both `s` and `p` are exhausted, the match succeeds: `dp[m, n] = true`.

We loop `i` from `m` down to `0` (`i = m` represents the empty suffix of `s`; patterns like `"a*"` can match the empty string) and `j` from `n - 1` down to `0`:
1. First we check whether the current characters match: `firstMatch = i < m && (p[j] == s[i] || p[j] == '.')`.
2. **If the next pattern character is `'*'` (`j + 1 < n && p[j + 1] == '*'`):**
   - **Use it 0 times:** skip the pair `p[j]*` entirely (`dp[i, j + 2]`).
   - **Use it 1 or more times:** if `firstMatch` is true, consume the character `s[i]` and keep the pattern `p[j]*` (`firstMatch && dp[i + 1, j]`).
3. **If the next character is not `'*'`:**
   - `firstMatch` must be true and the remaining parts must match (`firstMatch && dp[i + 1, j + 1]`).

The result is in cell `dp[0, 0]`.

```csharp solution
public class Solution
{
    public bool IsMatch(string s, string p)
    {
        int m = s.Length;
        int n = p.Length;
        bool[,] dp = new bool[m + 1, n + 1];
        dp[m, n] = true;

        for (int i = m; i >= 0; i--)
        {
            for (int j = n - 1; j >= 0; j--)
            {
                bool firstMatch = i < m && (p[j] == s[i] || p[j] == '.');

                if (j + 1 < n && p[j + 1] == '*')
                {
                    dp[i, j] = dp[i, j + 2] || (firstMatch && dp[i + 1, j]);
                }
                else
                {
                    dp[i, j] = firstMatch && dp[i + 1, j + 1];
                }
            }
        }

        return dp[0, 0];
    }
}
```

```typescript solution
function isMatch(s: string, p: string): boolean {
  const m = s.length;
  const n = p.length;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () =>
    new Array<boolean>(n + 1).fill(false)
  );
  dp[m][n] = true;

  for (let i = m; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const firstMatch = i < m && (p[j] === s[i] || p[j] === ".");

      if (j + 1 < n && p[j + 1] === "*") {
        dp[i][j] = dp[i][j + 2] || (firstMatch && dp[i + 1][j]);
      } else {
        dp[i][j] = firstMatch && dp[i + 1][j + 1];
      }
    }
  }

  return dp[0][0];
}
```

### Complexity

- **Time:** O(m · n). Each cell of the `(m + 1) x (n + 1)` table is computed in constant time.
- **Space:** O(m · n), the memory allocated for the `dp` table.
