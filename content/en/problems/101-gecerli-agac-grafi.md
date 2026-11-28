---
title: Graph Valid Tree
---
You are given `n` nodes numbered from `0` to `n - 1` and a list of undirected edges `edges`. Determine whether these edges form a **valid tree**.

A graph is a tree if it is **connected** and **contains no cycles**.

### Example 1

```text
Input:  n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true
```

### Example 2

```text
Input:  n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false
Explanation: 1 - 2 - 3 - 1 forms a cycle.
```

### Constraints

- `1 <= n <= 2000`
- `0 <= edges.length <= 5000`
- `0 <= a, b < n`, `a != b`; there are no repeated edges.

## Hints

- Exactly how many edges does a tree with `n` nodes have?
- If the number of edges is `n - 1`, being connected and being acyclic are equivalent. Checking just one of them is enough.
- Add the edges with Union-Find: if both endpoints are already in the same set, there is a cycle.

## Solution

### Edge count and Union-Find

1. A tree has exactly `n - 1` edges. If the edge count is different, the answer is immediately `false`.
2. Add the edges with Union-Find. If both endpoints of an edge are already in the same set, there is a cycle: `false`.

An acyclic graph with `n - 1` edges is always connected (each edge merges two components; `n` components shrink to a single one after `n - 1` merges). So there is no need for a separate connectivity check.

```csharp solution
public class Solution
{
    public bool ValidTree(int n, int[][] edges)
    {
        if (edges.Length != n - 1)
        {
            return false;
        }

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

        foreach (var edge in edges)
        {
            var a = Find(edge[0]);
            var b = Find(edge[1]);
            if (a == b)
            {
                return false;
            }

            parent[b] = a;
        }

        return true;
    }
}
```

```typescript solution
function validTree(n: number, edges: number[][]): boolean {
  if (edges.length !== n - 1) return false;

  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return false;
    parent[b] = a;
  }

  return true;
}
```

### Complexity

- **Time:** O(n log n). After the edge count check, at most `n - 1` edges are processed. The solution uses only path compression (path halving); adding union by size or rank as well brings it to O(n · α(n)).
- **Space:** O(n).
