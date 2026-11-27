---
title: Max Area of Island
---
You are given an `m x n` binary matrix `grid`. An **island** is a group of `1` cells (land) connected horizontally or vertically (4-directionally). You may assume all four edges of the grid are surrounded by water (`0`).

The **area** of an island is the number of `1` cells that make up that island.

Return the **maximum area** of an island in `grid`. If there is no island, return `0`.

### Example 1

```text
Input:  grid = [
  [0,0,1,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,1,1,0,1,0,0,0,0,0,0,0,0],
  [0,1,0,0,1,1,0,0,1,0,1,0,0],
  [0,1,0,0,1,1,0,0,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,1,1,0,0,0,0]
]
Output: 6
Explanation: The largest island is the 6-cell island in the middle right. Diagonal connections do not count as part of the same island.
```

### Example 2

```text
Input:  grid = [[0,0,0,0,0,0,0,0]]
Output: 0
Explanation: The grid has no land cells (1), so the maximum area is 0.
```

### Constraints

- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 50`
- `grid[i][j]` is either `0` or `1`.

## Hints

- Walk through every cell `(r, c)` of the grid; when you see a `1`, you have stepped onto a new island.
- You can use depth-first search (DFS) to count all the `1` cells connected to this cell horizontally and vertically.
- To avoid counting the same cell twice and getting stuck in an infinite loop, turn every `1` cell you visit into `0` right away (sink it).
- A DFS starting from a cell computes the island's total area by returning the sum `1 + Dfs(up) + Dfs(down) + Dfs(left) + Dfs(right)`.

## Solution

We can think of each cell of the grid as a graph node, and of horizontal/vertical adjacency as edges. Our goal is to find the size of the connected component with the most nodes.

We scan the grid from start to finish. When we meet a cell with `grid[r][c] == 1`, we call `Dfs(r, c)`:
1. If the coordinate is outside the grid or the cell value is `0`, it contributes `0` to the area; we return `0` immediately.
2. We set `grid[r][c] = 0` to mark the cell as visited. This keeps the same cell from being counted again without needing an extra `visited` matrix.
3. We count `1` for the current cell and add up the areas coming from its four neighbors (`r - 1`, `r + 1`, `c - 1`, `c + 1`).

We compare the area returned for each island with `maxArea` and keep the largest.

```csharp solution
public class Solution
{
    public int MaxAreaOfIsland(int[][] grid)
    {
        int rows = grid.Length;
        int cols = grid[0].Length;
        int maxArea = 0;

        int Dfs(int r, int c)
        {
            if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == 0)
                return 0;

            // Sink the visited land cell so it is not counted again
            grid[r][c] = 0;

            return 1
                + Dfs(r - 1, c)
                + Dfs(r + 1, c)
                + Dfs(r, c - 1)
                + Dfs(r, c + 1);
        }

        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (grid[r][c] == 1)
                    maxArea = Math.Max(maxArea, Dfs(r, c));
            }
        }

        return maxArea;
    }
}
```

```typescript solution
function maxAreaOfIsland(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let maxArea = 0;

  function dfs(r: number, c: number): number {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === 0) {
      return 0;
    }

    grid[r][c] = 0;

    return (
      1 +
      dfs(r - 1, c) +
      dfs(r + 1, c) +
      dfs(r, c - 1) +
      dfs(r, c + 1)
    );
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        maxArea = Math.max(maxArea, dfs(r, c));
      }
    }
  }

  return maxArea;
}
```

### Complexity

- **Time:** O(m · n). Each cell of the grid is checked once in the outer loop, and each `1` cell is visited by the DFS at most once and turned into `0`.
- **Space:** O(m · n). In the worst case, when the whole grid is made of `1`s, the DFS recursion stack can reach a depth of `m · n`.
