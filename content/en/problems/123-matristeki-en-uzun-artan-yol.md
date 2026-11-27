---
title: Longest Increasing Path in a Matrix
---
You are given an `m x n` integer matrix `matrix`. Return the length of the longest **strictly increasing** path in the matrix.

From each cell you can move in four directions (up, down, left, right). Moving diagonally or outside the matrix is not allowed.

### Example 1

```text
Input:  matrix = [[9,9,4],[6,6,8],[2,1,1]]
Output:  4
Explanation: The longest increasing path is [1, 2, 6, 9].
```

### Example 2

```text
Input:  matrix = [[3,4,5],[3,2,6],[2,2,1]]
Output:  4
Explanation: The longest increasing path is [3, 4, 5, 6].
```

### Constraints

- `1 <= m, n <= 200`
- `0 <= matrix[i][j] <= 2^31 - 1`

## Hints

- Starting a DFS from every cell to search for the longest path recomputes the same subpaths over and over.
- The longest increasing path starting from a cell is **independent** of which cell you came from. Compute the result once per cell and store it (memoization).
- Since the path is strictly increasing, no cycle can form; you don't need a "visited" marker.

## Solution

### DFS with memoization

`Dfs(r, c)` returns the length of the longest increasing path starting at cell `(r, c)`:

- If the result has already been computed, return `memo[r, c]`.
- Otherwise the length is at least `1`; for each neighbor with a larger value, try `1 + Dfs(neighbor)` and store the largest.

Since values strictly increase along the path, a DFS path can never return to the same cell; the computation runs on a DAG. The answer is the largest `Dfs` value over all cells.

```csharp solution
public class Solution
{
    public int LongestIncreasingPath(int[][] matrix)
    {
        var rows = matrix.Length;
        var cols = matrix[0].Length;
        var memo = new int[rows, cols];
        var directions = new (int Dr, int Dc)[] { (1, 0), (-1, 0), (0, 1), (0, -1) };

        int Dfs(int r, int c)
        {
            if (memo[r, c] != 0)
            {
                return memo[r, c];
            }

            var best = 1;
            foreach (var (dr, dc) in directions)
            {
                var nr = r + dr;
                var nc = c + dc;
                if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && matrix[nr][nc] > matrix[r][c])
                {
                    best = Math.Max(best, 1 + Dfs(nr, nc));
                }
            }

            memo[r, c] = best;
            return best;
        }

        var answer = 0;
        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                answer = Math.Max(answer, Dfs(r, c));
            }
        }

        return answer;
    }
}
```

```typescript solution
function longestIncreasingPath(matrix: number[][]): number {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const memo = matrix.map((row) => row.map(() => 0));
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const dfs = (r: number, c: number): number => {
    if (memo[r][c] !== 0) return memo[r][c];

    let best = 1;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + dfs(nr, nc));
      }
    }

    memo[r][c] = best;
    return best;
  };

  let answer = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      answer = Math.max(answer, dfs(r, c));
    }
  }

  return answer;
}
```

### Complexity

- **Time:** O(m × n). Each cell's value is computed once, and each computation looks at four neighbors.
- **Space:** O(m × n) for the memo table and the recursion.

Alternative: a topological sort (Kahn) that peels the cells layer by layer based on their "number of larger neighbors". The number of layers is the answer, and no recursion is needed.
