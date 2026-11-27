---
title: Pacific Atlantic Water Flow
---
An `m x n` rectangular island is given as the matrix `heights`, where each cell holds its height above sea level. The **Pacific Ocean** touches the island's left and top edges, and the **Atlantic Ocean** touches its right and bottom edges.

Rainwater can flow from a cell to a neighboring cell (up, down, left, right) whose height is **less than or equal to** its own. Water flows from cells adjacent to an ocean directly into that ocean.

Return the `[r, c]` coordinates of all cells from which water can flow to both the Pacific and the Atlantic, in any order.

### Example 1

```text
Input:  heights = [[1,2,2,3,5],
                   [3,2,3,4,4],
                   [2,4,5,3,1],
                   [6,7,1,4,5],
                   [5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
```

### Example 2

```text
Input:  heights = [[1]]
Output: [[0,0]]
```

### Constraints

- `1 <= m, n <= 200`
- `0 <= heights[r][c] <= 10^5`

## Hints

- Trying to let water flow from every cell involves a lot of repeated work. Think in reverse: which cells can you climb **up to** from the ocean?
- Start a DFS/BFS from every cell on the Pacific edge and move only to neighbors whose **height is greater than or equal to** the current one. Do the same for the Atlantic.
- The cells reached by both searches are the answer.

## Solution

### Searching backward from the oceans

Water being able to flow from a cell to an ocean is the same as there being an "uphill" (non-decreasing height) path from the ocean to that cell. So we run two searches:

1. A DFS starting from the cells on the Pacific edge (top row, left column) moves to neighbors whose height is not less than the current cell's. The cells it reaches go into the `pacific` set.
2. The same is done from the Atlantic edge (bottom row, right column).

The cells found in both sets are the answer. Each cell is visited at most once in each search.

```csharp solution
public class Solution
{
    public IList<IList<int>> PacificAtlantic(int[][] heights)
    {
        var rows = heights.Length;
        var cols = heights[0].Length;
        var pacific = new bool[rows, cols];
        var atlantic = new bool[rows, cols];

        void Dfs(int r, int c, bool[,] seen, int previous)
        {
            if (r < 0 || c < 0 || r >= rows || c >= cols || seen[r, c] || heights[r][c] < previous)
            {
                return;
            }

            seen[r, c] = true;
            Dfs(r + 1, c, seen, heights[r][c]);
            Dfs(r - 1, c, seen, heights[r][c]);
            Dfs(r, c + 1, seen, heights[r][c]);
            Dfs(r, c - 1, seen, heights[r][c]);
        }

        for (var r = 0; r < rows; r++)
        {
            Dfs(r, 0, pacific, int.MinValue);
            Dfs(r, cols - 1, atlantic, int.MinValue);
        }

        for (var c = 0; c < cols; c++)
        {
            Dfs(0, c, pacific, int.MinValue);
            Dfs(rows - 1, c, atlantic, int.MinValue);
        }

        var result = new List<IList<int>>();
        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                if (pacific[r, c] && atlantic[r, c])
                {
                    result.Add(new List<int> { r, c });
                }
            }
        }

        return result;
    }
}
```

```typescript solution
function pacificAtlantic(heights: number[][]): number[][] {
  const rows = heights.length;
  const cols = heights[0].length;
  const pacific = heights.map((row) => row.map(() => false));
  const atlantic = heights.map((row) => row.map(() => false));

  const dfs = (r: number, c: number, seen: boolean[][], previous: number): void => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || seen[r][c] || heights[r][c] < previous) return;
    seen[r][c] = true;
    dfs(r + 1, c, seen, heights[r][c]);
    dfs(r - 1, c, seen, heights[r][c]);
    dfs(r, c + 1, seen, heights[r][c]);
    dfs(r, c - 1, seen, heights[r][c]);
  };

  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pacific, -Infinity);
    dfs(r, cols - 1, atlantic, -Infinity);
  }

  for (let c = 0; c < cols; c++) {
    dfs(0, c, pacific, -Infinity);
    dfs(rows - 1, c, atlantic, -Infinity);
  }

  const result: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) result.push([r, c]);
    }
  }

  return result;
}
```

### Complexity

- **Time:** O(m × n). Each cell is processed at most once in each of the two searches.
- **Space:** O(m × n). Two visited tables, plus recursion that deep in the worst case.

Searching "backward from the target" instead of "from the source to the target" is a general technique that removes repeated work in multi-source problems (Walls and Gates, Surrounded Regions).
