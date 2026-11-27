---
title: Number of Islands
---
You are given a two-dimensional grid `grid` made of the characters `'1'` (land) and `'0'` (water). Return **the number of islands**.

An island is a region of land cells that are adjacent horizontally or vertically and is surrounded by water. Diagonal adjacency doesn't count. Assume all four edges of the grid are surrounded by water.

### Example 1

```text
Input:
  1 1 1 1 0
  1 1 0 1 0
  1 1 0 0 0
  0 0 0 0 0
Output:  1
```

### Example 2

```text
Input:
  1 1 0 0 0
  1 1 0 0 0
  0 0 1 0 0
  0 0 0 1 1
Output:  3
```

### Constraints

- `1 <= number of rows, number of columns <= 300`

## Hints

- The grid is an implicit graph: each land cell is a node, and there's an edge between adjacent land cells. The question asks for **the number of connected components**.
- When you find an unvisited land cell, you've found a new island. Mark **the whole** island as visited so it isn't counted again.
- To mark cells, you can keep a separate array or set the cell directly to `'0'`.

## Solution

Walk the grid row by row. When you see a `'1'`, increment the island counter and "sink" the island by turning all its cells into `'0'` with a depth-first search (DFS) starting from that cell. That way, the other cells of the same island aren't counted as new islands later.

```csharp solution
public class Solution
{
    public int NumIslands(char[][] grid)
    {
        var count = 0;

        for (var row = 0; row < grid.Length; row++)
        {
            for (var col = 0; col < grid[row].Length; col++)
            {
                if (grid[row][col] != '1') continue;

                count++;
                Sink(grid, row, col);
            }
        }

        return count;
    }

    private void Sink(char[][] grid, int row, int col)
    {
        if (row < 0 || col < 0 || row >= grid.Length || col >= grid[row].Length || grid[row][col] != '1')
        {
            return;
        }

        grid[row][col] = '0';

        Sink(grid, row + 1, col);
        Sink(grid, row - 1, col);
        Sink(grid, row, col + 1);
        Sink(grid, row, col - 1);
    }
}
```

```typescript solution
function numIslands(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  const sink = (row: number, col: number): void => {
    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== '1') return;

    grid[row][col] = '0';

    sink(row + 1, col);
    sink(row - 1, col);
    sink(row, col + 1);
    sink(row, col - 1);
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] !== '1') continue;

      count++;
      sink(row, col);
    }
  }

  return count;
}
```

### Complexity

- **Time:** O(rows × columns). Each cell is visited a constant number of times.
- **Space:** O(rows × columns) in the worst case; if the whole grid is land, the recursion can go that deep.

This solution **modifies** the input. In the interview, ask whether that's acceptable; if not, keep a separate `visited` structure. On very large grids, using BFS with a queue instead of recursion prevents call stack overflow.
