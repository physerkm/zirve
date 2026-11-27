---
title: Network Delay Time
---
You are given a network of `n` nodes labeled from `1` to `n`. `times[i] = [u, v, w]` is a **directed** edge from `u` to `v`, and it takes the signal `w` time to travel along it.

A signal is sent from node `k`. Return the minimum time it takes for **all nodes** to receive the signal. If some nodes can never receive it, return `-1`.

### Example 1

```text
Input:  times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
Output:  2
```

### Example 2

```text
Input:  times = [[1,2,1]], n = 2, k = 1
Output:  1
```

### Example 3

```text
Input:  times = [[1,2,1]], n = 2, k = 2
Output:  -1
```

### Constraints

- `1 <= k <= n <= 100`
- `1 <= times.length <= 6000`
- `1 <= u, v <= n`, `u != v`, `0 <= w <= 100`
- No `(u, v)` pair appears more than once.

## Hints

- The time for the signal to reach a node is the length of the **shortest path** from `k` to that node. The answer is the largest of these lengths.
- Edge weights are non-negative, so you can use Dijkstra's algorithm.
- Keep `(distance, node)` pairs in a min-heap; each time, pop the nearest unprocessed node and relax its neighbors.

## Solution

### Dijkstra

1. Build an adjacency list: `u → (v, w)`.
2. Set `dist[k] = 0` and push `(0, k)` onto the min-heap.
3. Pop the node with the smallest distance from the heap. If it is already finalized (a stale entry), skip it. Otherwise its distance becomes final, and for each neighbor, if `dist[u] + w` is better, push it onto the heap.
4. If all nodes are finalized, the answer is the largest distance; if any node is not, return `-1`.

With non-negative weights, the first distance popped from the heap for a node is its shortest, because any path found later must pass through a larger distance that is still in the heap.

```csharp solution
public class Solution
{
    public int NetworkDelayTime(int[][] times, int n, int k)
    {
        var graph = new List<(int To, int W)>[n + 1];
        for (var i = 1; i <= n; i++)
        {
            graph[i] = new List<(int To, int W)>();
        }

        foreach (var t in times)
        {
            graph[t[0]].Add((t[1], t[2]));
        }

        var dist = new Dictionary<int, int>();
        var heap = new PriorityQueue<int, int>();
        heap.Enqueue(k, 0);
        var tentative = new int[n + 1];
        Array.Fill(tentative, int.MaxValue);
        tentative[k] = 0;

        while (heap.TryDequeue(out var node, out var d))
        {
            if (dist.ContainsKey(node))
            {
                continue;
            }

            dist[node] = d;
            foreach (var (to, w) in graph[node])
            {
                if (!dist.ContainsKey(to) && d + w < tentative[to])
                {
                    tentative[to] = d + w;
                    heap.Enqueue(to, d + w);
                }
            }
        }

        return dist.Count == n ? dist.Values.Max() : -1;
    }
}
```

```typescript solution
function networkDelayTime(times: number[][], n: number, k: number): number {
  const graph: [number, number][][] = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) graph[u].push([v, w]);

  const dist = new Array<number>(n + 1).fill(Infinity);
  const done = new Array<boolean>(n + 1).fill(false);
  dist[k] = 0;

  // n is at most 100: picking the nearest node with a linear scan (O(n²) Dijkstra) is enough.
  for (let round = 0; round < n; round++) {
    let node = -1;
    for (let i = 1; i <= n; i++) {
      if (!done[i] && dist[i] !== Infinity && (node === -1 || dist[i] < dist[node])) node = i;
    }

    if (node === -1) break;
    done[node] = true;

    for (const [to, w] of graph[node]) {
      if (dist[node] + w < dist[to]) dist[to] = dist[node] + w;
    }
  }

  let worst = 0;
  for (let i = 1; i <= n; i++) {
    if (dist[i] === Infinity) return -1;
    worst = Math.max(worst, dist[i]);
  }

  return worst;
}
```

### Complexity

- **Time:** Dijkstra with a heap is O(E log E). The array-based version in the TypeScript solution is O(n² + E), which is also fine when `n` is small.
- **Space:** O(n + E).
