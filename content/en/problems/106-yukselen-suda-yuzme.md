---
title: Swim in Rising Water
---
You are given an `n x n` grid `grid`, where `grid[i][j]` is the elevation at `(i, j)`, and all values between `0` and `n² - 1` are **distinct**.

Rain starts to fall. At time `t`, the water depth everywhere is `t`. You can swim from a cell to a 4-directionally adjacent cell if **the elevation of both cells is at most `t`**. You can swim infinitely fast; you only have to wait for the water level.

Starting at the top-left corner `(0, 0)`, return the **earliest time** you can reach the bottom-right corner `(n - 1, n - 1)`.

### Example 1

```text
Input:  grid = [[0,2],[1,3]]
Output:  3
Explanation: The bottom-right cell has elevation 3; you can only enter it at t = 3.
```

### Example 2

```text
Input:  grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]
Output:  16
```

### Constraints

- `1 <= n <= 50`
- `0 <= grid[i][j] < n²`; all values are distinct.

## Hints

- The "cost" of a path is the **highest** cell on it. You are looking for the path with the smallest cost.
- Run Dijkstra with a maximum instead of a sum: each time, pop from the heap the cell reachable with the lowest level so far.
- Alternative: binary search on `t`, and for each `t` check with BFS whether the target is reachable.

## Solution

### Dijkstra on the maximum

The heap holds `(level, r, c)` triples with the lowest level first. It starts with `(grid[0][0], 0, 0)`.

The lowest water level needed to reach a cell popped from the heap is final. When the target cell is popped, its level is the answer. Otherwise, every unvisited neighbor is pushed onto the heap with `max(level, grid[nr][nc])`.

Why is this correct? The heap always expands the lowest cell on the reachable frontier; the region reachable at water level `t` is exactly the set of cells popped from the heap with level `t` or lower.

```csharp solution
public class Solution
{
    public int SwimInWater(int[][] grid)
    {
        var n = grid.Length;
        var seen = new bool[n, n];
        var heap = new PriorityQueue<(int R, int C), int>();
        heap.Enqueue((0, 0), grid[0][0]);
        seen[0, 0] = true;
        var directions = new (int Dr, int Dc)[] { (1, 0), (-1, 0), (0, 1), (0, -1) };

        while (heap.TryDequeue(out var cell, out var level))
        {
            if (cell.R == n - 1 && cell.C == n - 1)
            {
                return level;
            }

            foreach (var (dr, dc) in directions)
            {
                var nr = cell.R + dr;
                var nc = cell.C + dc;
                if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr, nc])
                {
                    continue;
                }

                seen[nr, nc] = true;
                heap.Enqueue((nr, nc), Math.Max(level, grid[nr][nc]));
            }
        }

        return -1;
    }
}
```

```typescript solution
function swimInWater(grid: number[][]): number {
  const n = grid.length;
  const seen = grid.map((row) => row.map(() => false));
  // Array-based min-heap: [level, r, c].
  const heap: [number, number, number][] = [];

  const push = (item: [number, number, number]): void => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };

  const pop = (): [number, number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1;
        const r = l + 1;
        let s = i;
        if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
        if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
        if (s === i) break;
        [heap[s], heap[i]] = [heap[i], heap[s]];
        i = s;
      }
    }
    return top;
  };

  push([grid[0][0], 0, 0]);
  seen[0][0] = true;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (heap.length > 0) {
    const [level, r, c] = pop();
    if (r === n - 1 && c === n - 1) return level;

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;
      seen[nr][nc] = true;
      push([Math.max(level, grid[nr][nc]), nr, nc]);
    }
  }

  return -1;
}
```

### Complexity

- **Time:** O(n² log n). Each cell enters the heap once.
- **Space:** O(n²).
