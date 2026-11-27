---
title: Edit Distance
---
You are given two strings `word1` and `word2`. Return the **minimum number of operations** needed to convert `word1` into `word2`.

You may perform each of the following three operations on a string:
- Add a character (**Insert**)
- Remove a character (**Delete**)
- Change a character into another character (**Replace**)

### Example 1

```text
Input:  word1 = "horse", word2 = "ros"
Output:  3
Explanation:
horse -> rorse (replace 'h' with 'r')
rorse -> rose (delete 'r')
rose -> ros (delete 'e')
```

### Example 2

```text
Input:  word1 = "intention", word2 = "execution"
Output:  5
Explanation:
intention -> inention (delete 't')
inention -> enention (replace 'i' with 'e')
enention -> exention (replace 'n' with 'x')
exention -> exection (replace 'n' with 'c')
exection -> execution (insert 'u')
```

### Constraints

- `0 <= word1.length, word2.length <= 500`
- `word1` and `word2` consist only of lowercase English letters.

## Hints

- Compare prefixes of the two strings: define `dp[i, j]` as the minimum cost of converting the first `i` characters of `word1` into the first `j` characters of `word2`.
- If `word1[i - 1] == word2[j - 1]`, the last characters are already the same; you can take `dp[i - 1, j - 1]` without any extra operation.
- If the characters differ, try the three possible last operations (delete, insert, replace) and add `1` to the smallest.
- The first row and first column of the table represent the costs of converting to/from the empty string (`0, 1, 2, ...`).

## Solution

For this problem, also known as the **Levenshtein distance**, we build a dynamic programming table of size `(m + 1) x (n + 1)`. `dp[i, j]` is the minimum number of operations needed to convert the prefix made of the first `i` characters of `word1` (`word1[0..i]`) into the prefix made of the first `j` characters of `word2` (`word2[0..j]`).

Base cases:
- `dp[i, 0] = i`: converting a string of length `i` into the empty string takes `i` deletions.
- `dp[0, j] = j`: converting the empty string into a string of length `j` takes `j` insertions.

For each cell `(i, j)` we look at the last characters (`word1[i - 1]` and `word2[j - 1]`):
1. **The characters are the same (`word1[i - 1] == word2[j - 1]`):** no operation is needed for the last letters; `dp[i, j] = dp[i - 1, j - 1]`.
2. **The characters differ:** we pick the cheapest of the three operations and add `1`:
   - **Replace:** turn `word1[i - 1]` into `word2[j - 1]` (`dp[i - 1, j - 1] + 1`)
   - **Delete:** delete `word1[i - 1]` (`dp[i - 1, j] + 1`)
   - **Insert:** append `word2[j - 1]` at the end (`dp[i, j - 1] + 1`)

The value `dp[m, n]` in the bottom-right corner of the table is the minimum edit distance we are looking for.

```csharp solution
public class Solution
{
    public int MinDistance(string word1, string word2)
    {
        int m = word1.Length;
        int n = word2.Length;
        int[,] dp = new int[m + 1, n + 1];

        for (int i = 0; i <= m; i++)
            dp[i, 0] = i;

        for (int j = 0; j <= n; j++)
            dp[0, j] = j;

        for (int i = 1; i <= m; i++)
        {
            for (int j = 1; j <= n; j++)
            {
                if (word1[i - 1] == word2[j - 1])
                {
                    dp[i, j] = dp[i - 1, j - 1];
                }
                else
                {
                    int replace = dp[i - 1, j - 1];
                    int delete = dp[i - 1, j];
                    int insert = dp[i, j - 1];
                    dp[i, j] = 1 + Math.Min(replace, Math.Min(delete, insert));
                }
            }
        }

        return dp[m, n];
    }
}
```

```typescript solution
function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

### Complexity

- **Time:** O(m · n). Each cell of the `(m + 1) x (n + 1)` table is computed in O(1) time.
- **Space:** O(m · n), for the dynamic programming table (it can also be reduced to O(min(m, n)) by keeping only the previous row).
