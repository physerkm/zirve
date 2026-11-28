---
title: Shortest Path in a Grid with Obstacles Elimination
---
You are given an `m x n` matrix `grid` in which each cell is `0` (empty) or `1` (obstacle), and an integer `k`.

Return the **minimum number of steps** needed to walk from the upper-left corner `(0, 0)` to the lower-right corner `(m - 1, n - 1)`. In one step you can move up, down, left or right to an adjacent cell, and along the way you can eliminate **at most `k` obstacles** (cells with `1`) and walk through them.

If it is not possible to reach the target, return `-1`.

### Example 1

```text
Input:  grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1
Output:  6
Explanation:
The shortest path without touching any obstacle is 10 steps.
But by breaking the single obstacle at (1, 0), you reach the target in 6 steps via (0,0) -> (1,0) -> (2,0) -> (3,0) -> (4,0) -> (4,1) -> (4,2).
```

### Example 2

```text
Input:  grid = [[0,1,1],[1,1,1],[1,0,0]], k = 1
Output:  -1
Explanation: Reaching the target requires breaking at least 2 obstacles; since k = 1, there is no path.
```

### Example 3

```text
Input:  grid = [[0,1,1],[1,1,1],[1,0,0]], k = 2
Output:  4
Explanation: The path (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2) breaks 2 obstacles and reaches the target in 4 steps.
```

### Constraints

- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 40`
- `0 <= k <= m * n`
- `grid[i][j]` is `0` or `1`.
- `grid[0][0] == grid[m - 1][n - 1] == 0`

## Hints

- In a standard BFS, the first time we visit a cell we have reached it by a shortest path, so we never visit it again. Here, however, reaching a cell **in fewer steps but with fewer eliminations left** may keep us from getting past obstacles further on.
- So our state is not just `(r, c)` but the triple `(r, c, remainingBreaks)`.
- Instead of tracking every `(r, c, rem)` state separately, we can store in `bestRemaining[r, c]` the **largest number of remaining eliminations** with which we have reached cell `(r, c)` so far.
- When BFS reaches a cell `(r, c)` again, it is enough to enqueue that path only if `nextRem > bestRemaining[r, c]` (because arriving with more steps and with fewer or equal eliminations left gives no advantage).

## Solution

We use Breadth-First Search (BFS) to find the shortest path in an unweighted grid. Unlike classic BFS, though, the "quality" of reaching a cell depends not only on the number of steps but also on how many obstacle eliminations (`rem`) we still have left when we get there.

Because the BFS queue advances steps layer by layer, when we reach a cell `(r, c)` a second time, our step count is **always greater than or equal to** that of the first visit. The only reason this second visit could be useful is that we arrived with **more eliminations left (`nextRem`)** than on the first visit.

With this observation:
1. Initialize the `bestRemaining[r, c]` array to `-1` for every cell (`bestRemaining[0, 0] = k`).
2. Enqueue the initial state `(0, 0, k, 0)`.
3. At each step, when moving to a neighbor `(nr, nc)`, compute `nextRem = rem - grid[nr][nc]`.
4. If `nextRem >= 0` and `nextRem > bestRemaining[nr, nc]`, update `bestRemaining[nr, nc] = nextRem` and enqueue the state.

By the nature of BFS, the first moment the target cell `(m - 1, n - 1)` is reached gives the shortest path.

```csharp solution
public class Solution
{
    public int ShortestPath(int[][] grid, int k)
    {
        int m = grid.Length;
        int n = grid[0].Length;

        if (m == 1 && n == 1)
            return 0;

        if (k >= m + n - 2)
            return m + n - 2;

        int[,] bestRemaining = new int[m, n];
        for (int r = 0; r < m; r++)
        {
            for (int c = 0; c < n; c++)
            {
                bestRemaining[r, c] = -1;
            }
        }

        Queue<(int r, int c, int rem, int steps)> queue = new Queue<(int r, int c, int rem, int steps)>();
        queue.Enqueue((0, 0, k, 0));
        bestRemaining[0, 0] = k;

        int[] dr = { -1, 1, 0, 0 };
        int[] dc = { 0, 0, -1, 1 };

        while (queue.Count > 0)
        {
            var (r, c, rem, steps) = queue.Dequeue();

            for (int d = 0; d < 4; d++)
            {
                int nr = r + dr[d];
                int nc = c + dc[d];

                if (nr < 0 || nr >= m || nc < 0 || nc >= n)
                    continue;

                int nextRem = rem - grid[nr][nc];
                if (nextRem >= 0 && nextRem > bestRemaining[nr, nc])
                {
                    if (nr == m - 1 && nc == n - 1)
                        return steps + 1;

                    bestRemaining[nr, nc] = nextRem;
                    queue.Enqueue((nr, nc, nextRem, steps + 1));
                }
            }
        }

        return -1;
    }
}
```

```typescript solution
function shortestPath(grid: number[][], k: number): number {
  const m = grid.length;
  const n = grid[0].length;

  if (m === 1 && n === 1) return 0;
  if (k >= m + n - 2) return m + n - 2;

  const bestRemaining: number[][] = Array.from({ length: m }, () =>
    new Array<number>(n).fill(-1)
  );

  const queue: [number, number, number, number][] = [[0, 0, k, 0]];
  bestRemaining[0][0] = k;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let head = 0;
  while (head < queue.length) {
    const [r, c, rem, steps] = queue[head++];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;

      const nextRem = rem - grid[nr][nc];
      if (nextRem >= 0 && nextRem > bestRemaining[nr][nc]) {
        if (nr === m - 1 && nc === n - 1) return steps + 1;
        bestRemaining[nr][nc] = nextRem;
        queue.push([nr, nc, nextRem, steps + 1]);
      }
    }
  }

  return -1;
}
```

### Complexity

- **Time:** O(m * n * min(k, m + n)). Since `bestRemaining[r, c]` strictly increases every time, a cell `(r, c)` can enter the queue at most `min(k, m + n)` times.
- **Space:** O(m * n * min(k, m + n)), for the BFS queue and the `bestRemaining` table.
