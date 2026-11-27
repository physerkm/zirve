---
title: Rotting Oranges
---
You are given an `m x n` grid `grid`. Each cell holds one of three values:

- `0`: an empty cell,
- `1`: a fresh orange,
- `2`: a rotten orange.

Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return **the minimum number of minutes that must pass until no fresh orange remains**. If this is impossible, return `-1`.

### Example 1

```text
Input:  grid = [[2,1,1],[1,1,0],[0,1,1]]
Output: 4
```

### Example 2

```text
Input:  grid = [[2,1,1],[0,1,1],[1,0,1]]
Output: -1
Explanation: The orange in the bottom left can never be adjacent to a rotten orange.
```

### Example 3

```text
Input:  grid = [[0,2]]
Output: 0
Explanation: There are no fresh oranges to begin with.
```

### Constraints

- `1 <= m, n <= 10`
- `grid[i][j]` is `0`, `1`, or `2`.

## Hints

- The rot spreads from all rotten oranges **at the same time**. Which kind of search does that suggest?
- Put all the initially rotten oranges into the same queue (multi-source BFS). Each BFS level is one minute.
- Keep a count of fresh oranges; if there are still fresh oranges when the BFS finishes, the answer is `-1`.

## Solution

### Multi-source BFS

All rotten oranges go into the queue at the start, and the fresh oranges are counted. Then the BFS proceeds level by level: each round processes every orange in the queue, the neighboring fresh oranges are rotted and added to the queue, and the fresh count goes down. If at least one orange rotted in a round, one minute has passed.

When the BFS finishes, it returns the elapsed minutes if no fresh oranges remain, and `-1` otherwise.

```csharp solution
public class Solution
{
    public int OrangesRotting(int[][] grid)
    {
        var rows = grid.Length;
        var cols = grid[0].Length;
        var queue = new Queue<(int R, int C)>();
        var fresh = 0;

        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                if (grid[r][c] == 2) queue.Enqueue((r, c));
                else if (grid[r][c] == 1) fresh++;
            }
        }

        var minutes = 0;
        var directions = new (int Dr, int Dc)[] { (1, 0), (-1, 0), (0, 1), (0, -1) };

        while (queue.Count > 0 && fresh > 0)
        {
            var size = queue.Count;
            for (var i = 0; i < size; i++)
            {
                var (r, c) = queue.Dequeue();
                foreach (var (dr, dc) in directions)
                {
                    var nr = r + dr;
                    var nc = c + dc;
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] != 1)
                    {
                        continue;
                    }

                    grid[nr][nc] = 2;
                    fresh--;
                    queue.Enqueue((nr, nc));
                }
            }

            minutes++;
        }

        return fresh == 0 ? minutes : -1;
    }
}
```

```typescript solution
function orangesRotting(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let queue: [number, number][] = [];
  let fresh = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }

  let minutes = 0;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length > 0 && fresh > 0) {
    const next: [number, number][] = [];
    for (const [r, c] of queue) {
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2;
        fresh--;
        next.push([nr, nc]);
      }
    }

    queue = next;
    minutes++;
  }

  return fresh === 0 ? minutes : -1;
}
```

### Complexity

- **Time:** O(m × n). Each cell enters the queue at most once.
- **Space:** O(m × n) for the queue.

The `fresh > 0` in the loop condition prevents counting an extra minute after the last round of rotting.
