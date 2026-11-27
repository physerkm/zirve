---
title: Interleaving String
---
You are given three strings `s1`, `s2` and `s3`. Determine whether `s3` can be formed by **interleaving** `s1` and `s2`.

In an interleaving, the characters of `s1` and `s2` are merged into a single string while **each keeps its own order**. For example, for `s1 = "ab"` and `s2 = "cd"`, `"acbd"` is valid but `"bacd"` is not.

### Example 1

```text
Input:  s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
Output:  true
```

### Example 2

```text
Input:  s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
Output:  false
```

### Example 3

```text
Input:  s1 = "", s2 = "", s3 = ""
Output:  true
```

### Constraints

- `0 <= s1.length, s2.length <= 100`
- `0 <= s3.length <= 200`
- The strings consist of lowercase English letters.

**Follow-up:** Can you solve it using only O(s2.length) extra memory?

## Hints

- If the lengths don't add up (`|s1| + |s2| != |s3|`), the answer is `false`.
- A greedy choice doesn't work: the next character of `s3` may equal the first character of both strings.
- `dp[i][j]`: can the first `i` characters of `s1` and the first `j` characters of `s2` form the first `i + j` characters of `s3`? The last character came either from `s1` or from `s2`.

## Solution

### Two-dimensional DP, compressed to one row

If `dp[i][j]` is true, the string `s3[0..i+j)` can be woven from `s1[0..i)` and `s2[0..j)`. For the last character `s3[i+j-1]`:

- If it came from `s1[i-1]`: `dp[i-1][j] && s1[i-1] == s3[i+j-1]`.
- If it came from `s2[j-1]`: `dp[i][j-1] && s2[j-1] == s3[i+j-1]`.

`dp[0][0] = true`. Since each row depends only on the previous row and the cell to its own left, a one-dimensional array is enough: before it is updated, `dp[j]` holds the "above" value, and `dp[j-1]` holds the "left" value.

```csharp solution
public class Solution
{
    public bool IsInterleave(string s1, string s2, string s3)
    {
        if (s1.Length + s2.Length != s3.Length)
        {
            return false;
        }

        var dp = new bool[s2.Length + 1];
        for (var i = 0; i <= s1.Length; i++)
        {
            for (var j = 0; j <= s2.Length; j++)
            {
                if (i == 0 && j == 0)
                {
                    dp[j] = true;
                    continue;
                }

                var fromS1 = i > 0 && dp[j] && s1[i - 1] == s3[i + j - 1];
                var fromS2 = j > 0 && dp[j - 1] && s2[j - 1] == s3[i + j - 1];
                dp[j] = fromS1 || fromS2;
            }
        }

        return dp[s2.Length];
    }
}
```

```typescript solution
function isInterleave(s1: string, s2: string, s3: string): boolean {
  if (s1.length + s2.length !== s3.length) return false;

  const dp = new Array<boolean>(s2.length + 1).fill(false);
  for (let i = 0; i <= s1.length; i++) {
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0 && j === 0) {
        dp[j] = true;
        continue;
      }

      const fromS1 = i > 0 && dp[j] && s1[i - 1] === s3[i + j - 1];
      const fromS2 = j > 0 && dp[j - 1] && s2[j - 1] === s3[i + j - 1];
      dp[j] = fromS1 || fromS2;
    }
  }

  return dp[s2.length];
}
```

### Complexity

- **Time:** O(m × n).
- **Space:** O(n), where `n = s2.length`.
