---
title: Walls and Gates
---
You are given an `m x n` grid (`rooms`). Each cell in the grid takes one of three values:

- `-1` — represents a **wall** or an obstacle.
- `0` — represents a **gate**.
- `2147483647` (`INF`, that is, `2^31 - 1`) — represents an **empty room**.

Fill each empty room with **its distance to the nearest gate** and return the updated `rooms` matrix. You can move only horizontally and vertically (up, down, left, right), and you cannot pass through walls.

If no gate can be reached from an empty room, that cell's value must stay `2147483647` (`INF`).

### Example 1

```text
Input:  rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]
Output: [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]
Explanation: The two gates are at (0, 2) and (3, 0). Each empty room gets the number of steps from its nearest gate.
```

### Example 2

```text
Input:  rooms = [[-1]]
Output: [[-1]]
Explanation: The grid contains only a wall, so nothing changes.
```

### Example 3

```text
Input:  rooms = [[0,-1,2147483647],[2147483647,-1,2147483647]]
Output: [[0,-1,2147483647],[1,-1,2147483647]]
Explanation: The empty rooms in the right column are behind the walls, so they cannot reach any gate and stay INF.
```

### Constraints

- `m == rooms.length`
- `n == rooms[i].length`
- `1 <= m, n <= 250`
- `rooms[i][j]` is one of `-1`, `0`, or `2^31 - 1` (`2147483647`).

## Hints

- Starting from each empty room and searching for the nearest gate with a separate BFS takes O((m · n)²) time and is far too slow on large grids.
- Flip the question: instead of searching for gates from the empty rooms, spread out **from the gates toward the empty rooms**.
- If you add all gates (`0`) to the queue at the same time at the start (multi-source BFS), each layer discovers, in order, the rooms that are 1 step, 2 steps, 3 steps away from all gates.
- The moment you first reach an empty room (`INF`), you have arrived from its nearest gate; if you update its value immediately, no other visitor will enter that room again.

## Solution

Instead of starting a separate breadth-first search (BFS) from every empty room, we use **multi-source BFS**.

First, we scan the matrix from start to finish and add every gate with value `0` to the queue (`Queue`). All of these gates are starting nodes with distance `0`. Then we run the standard BFS loop:

1. Take a cell `(r, c)` out of the queue.
2. Look at its four neighbors (`up, down, left, right`).
3. If the neighboring cell is inside the grid and its value is still `INF` (`2147483647`), no gate has reached this room yet.
4. Since BFS advances layer by layer, the first wave to reach an empty room always comes **from the nearest gate**. Set the neighbor's value to `rooms[r][c] + 1` and add it to the queue as well.

As soon as a room's value is updated from `INF` to its actual distance, the `rooms[nr][nc] != INF` condition ensures the same cell is never added to the queue again. So there is no need for a separate `visited` array either.

```csharp solution
public class Solution
{
    public int[][] WallsAndGates(int[][] rooms)
    {
        int rows = rooms.Length;
        int cols = rooms[0].Length;
        const int INF = 2147483647;
        Queue<(int r, int c)> queue = new Queue<(int r, int c)>();

        // 1. Add all gates (0) to the queue at once.
        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (rooms[r][c] == 0)
                    queue.Enqueue((r, c));
            }
        }

        int[][] dirs = new int[][]
        {
            new int[] { -1, 0 },
            new int[] { 1, 0 },
            new int[] { 0, -1 },
            new int[] { 0, 1 }
        };

        // 2. Spread the shortest distance to the empty rooms layer by layer with multi-source BFS.
        while (queue.Count > 0)
        {
            var (r, c) = queue.Dequeue();

            foreach (int[] d in dirs)
            {
                int nr = r + d[0];
                int nc = c + d[1];

                // Skip if out of bounds, a wall, or already visited.
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || rooms[nr][nc] != INF)
                    continue;

                rooms[nr][nc] = rooms[r][c] + 1;
                queue.Enqueue((nr, nc));
            }
        }

        return rooms;
    }
}
```

```typescript solution
function wallsAndGates(rooms: number[][]): number[][] {
  const rows = rooms.length;
  const cols = rooms[0].length;
  const INF = 2147483647;
  const queue: [number, number][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rooms[r][c] === 0) {
        queue.push([r, c]);
      }
    }
  }

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || rooms[nr][nc] !== INF) {
        continue;
      }

      rooms[nr][nc] = rooms[r][c] + 1;
      queue.push([nr, nc]);
    }
  }

  return rooms;
}
```

### Complexity

- **Time:** O(m · n). Each cell enters the queue at most once, and its four neighbors are checked in constant time.
- **Space:** O(m · n). In the worst case (if every cell is a gate, or many cells pile up in the queue at once), the queue holds O(m · n) elements.
