---
title: Redundant Connection
---
One **extra edge** has been added to a **tree** with `n` nodes numbered from `1` to `n`. The added edge connects two different nodes and is not an edge that already existed. The graph is given as a list of `n` edges in the form `edges[i] = [a, b]`.

Return an edge that can be removed so that the remaining graph is a tree of `n` nodes. If there are multiple answers, return the one that occurs **last** in the input.

### Example 1

```text
Input:  edges = [[1,2],[1,3],[2,3]]
Output: [2,3]
```

### Example 2

```text
Input:  edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Output: [1,4]
```

### Constraints

- `n == edges.length`, `3 <= n <= 1000`
- `edges[i].length == 2`, `1 <= a < b <= n` or `1 <= b < a <= n`
- There are no repeated edges, and the graph is connected.

## Hints

- A tree has no cycles. The redundant edge is the one that creates a cycle.
- Add the edges one by one. If both endpoints of an edge are **already** in the same component, that edge closes a cycle.
- The structure that answers "are these two nodes in the same component?" in near-constant time: Union-Find (DSU).

## Solution

### Union-Find

Each node starts out as the representative of its own set (`parent[x] = x`). We process the edges in order:

- If `Find(a)` and `Find(b)` give the same representative, `a` and `b` are already connected; this edge creates a cycle and is the answer. Since the edges are processed in order, the first cycle-closing edge is also the **last** edge of the cycle in the input.
- Otherwise, the two sets are merged.

**Path compression** during `Find` and **union by size** during merging keep the trees shallow.

```csharp solution
public class Solution
{
    public int[] FindRedundantConnection(int[][] edges)
    {
        var n = edges.Length;
        var parent = new int[n + 1];
        var size = new int[n + 1];
        for (var i = 0; i <= n; i++)
        {
            parent[i] = i;
            size[i] = 1;
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
                return edge;
            }

            if (size[a] < size[b])
            {
                (a, b) = (b, a);
            }

            parent[b] = a;
            size[a] += size[b];
        }

        return Array.Empty<int>();
    }
}
```

```typescript solution
function findRedundantConnection(edges: number[][]): number[] {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const size = new Array<number>(n + 1).fill(1);

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  for (const edge of edges) {
    let a = find(edge[0]);
    let b = find(edge[1]);
    if (a === b) return edge;
    if (size[a] < size[b]) [a, b] = [b, a];
    parent[b] = a;
    size[a] += size[b];
  }

  return [];
}
```

### Complexity

- **Time:** O(n · α(n)). `α` is the inverse Ackermann function, which in practice never exceeds 4.
- **Space:** O(n).
