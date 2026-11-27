---
title: Number of Connected Components in an Undirected Graph
---
You are given an undirected graph with `n` nodes numbered from `0` to `n - 1` and edges `edges[i] = [a, b]`. Return the number of **connected components** in the graph.

### Example 1

```text
Input:  n = 5, edges = [[0,1],[1,2],[3,4]]
Output: 2
Explanation: {0, 1, 2} and {3, 4}.
```

### Example 2

```text
Input:  n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]
Output: 1
```

### Constraints

- `1 <= n <= 2000`
- `0 <= edges.length <= 5000`
- `0 <= a, b < n`, `a != b`; there are no repeated edges.

## Hints

- If you start a DFS from every unvisited node, the number of DFS runs you start is the number of components.
- With Union-Find: start with `n` components; every edge that merges two **different** sets reduces the component count by one.

## Solution

### Counting with Union-Find

At the start, each node is its own component: `count = n`. For each edge, find the representatives of its two endpoints. If the representatives differ, merge the sets and decrement `count`; if they are the same, the edge connects two nodes that are already connected, and the count does not change.

```csharp solution
public class Solution
{
    public int CountComponents(int n, int[][] edges)
    {
        var parent = new int[n];
        for (var i = 0; i < n; i++)
        {
            parent[i] = i;
        }

        int Find(int x)
        {
            while (parent[x] != x)
            {
                parent[x] = parent[parent[x]];
                x = parent[x];
            }

            return x;
        }

        var count = n;
        foreach (var edge in edges)
        {
            var a = Find(edge[0]);
            var b = Find(edge[1]);
            if (a != b)
            {
                parent[b] = a;
                count--;
            }
        }

        return count;
    }
}
```

```typescript solution
function countComponents(n: number, edges: number[][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  let count = n;
  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a !== b) {
      parent[b] = a;
      count--;
    }
  }

  return count;
}
```

### Complexity

- **Time:** O(n + e · α(n)).
- **Space:** O(n).

The DFS/BFS solution also runs in O(n + e), but it requires building an adjacency list first. Union-Find also works when the edges arrive as a stream.
