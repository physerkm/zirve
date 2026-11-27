---
title: Unique Paths
---
A robot is located at the top-left corner of an `m x n` grid. At each step, the robot can move only **right** or **down**. Return the number of **unique paths** to the bottom-right corner.

The answer is guaranteed not to exceed `2 * 10^9`.

### Example 1

```text
Input:  m = 3, n = 7
Output:  28
```

### Example 2

```text
Input:  m = 3, n = 2
Output:  3
Explanation: Right → Down → Down, Down → Right → Down, Down → Down → Right.
```

### Constraints

- `1 <= m, n <= 100`

## Hints

- A cell can be reached only from the cell above it or the cell to its left.
- `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. There is exactly one path to every cell in the first row and the first column.
- Since each row depends only on the previous row, a one-dimensional array is enough.

## Solution

### Single-row DP

`row[c]` is the number of paths reaching column `c` in the current row. In the first row there is one path to each cell: `row = [1, 1, ..., 1]`. In each following row, from left to right, `row[c] += row[c - 1]`: `row[c]` before the update is the path count of the cell above, and `row[c - 1]` is the path count of the cell to the left.

```csharp solution
public class Solution
{
    public int UniquePaths(int m, int n)
    {
        var row = new int[n];
        Array.Fill(row, 1);

        for (var r = 1; r < m; r++)
        {
            for (var c = 1; c < n; c++)
            {
                row[c] += row[c - 1];
            }
        }

        return row[n - 1];
    }
}
```

```typescript solution
function uniquePaths(m: number, n: number): number {
  const row = new Array<number>(n).fill(1);

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      row[c] += row[c - 1];
    }
  }

  return row[n - 1];
}
```

### Complexity

- **Time:** O(m × n).
- **Space:** O(n).

Combinatorially, every path consists of `m - 1` down moves and `n - 1` right moves, so the answer is `C(m + n - 2, m - 1)`. This formula can be computed in O(min(m, n)), but you have to watch out for overflow in the intermediate products.
