---
title: Min Cost to Connect All Points
---

You are given an array `points` representing integer coordinates of points on a 2D plane, where `points[i] = [x_i, y_i]`.

The cost of connecting two points `[x_i, y_i]` and `[x_j, y_j]` is the **Manhattan distance** between them: `|x_i - x_j| + |y_i - y_j|`.

Return the **minimum total cost** to connect all the points. All points are connected if there is exactly one simple path between any two points, directly or indirectly.

### Example 1

```text
Input:  points = [[0,0],[2,2],[3,10],[5,2],[7,0]]
Output:  20
Explanation: Connecting the points with the edges (0,0)-(2,2) [4], (2,2)-(5,2) [3], (5,2)-(7,0) [4] and (2,2)-(3,10) [9] gives a total cost of 4 + 3 + 4 + 9 = 20.
```

### Example 2

```text
Input:  points = [[3,12],[-2,5],[-4,1]]
Output:  18
Explanation: The cost from (-4,1) to (-2,5) is 6 and from (-2,5) to (3,12) is 12, for a total of 18.
```

### Constraints

- `1 <= points.length <= 1000`
- `-10^6 <= x_i, y_i <= 10^6`
- All points `(x_i, y_i)` are distinct.

## Hints

- The structure that connects `N` points at the lowest cost without forming a cycle is a **Minimum Spanning Tree (MST)**.
- Since there is a possible edge between every pair of points, the graph is a **complete (dense) graph** with `N · (N - 1) / 2` edges.
- Pushing all edges into a min-heap takes O(N² log N) time and O(N²) memory. Instead, you can solve it in O(N²) time and O(N) memory with **Prim's algorithm**, keeping each node's shortest distance to the current tree in a `minDist` array.
- At each step, pick the node with the smallest `minDist` among the nodes not yet in the tree, add it to the tree, and update the `minDist` values of the remaining nodes.

## Solution

The problem asks for the **Minimum Spanning Tree (MST)** of a complete graph whose nodes are the `N` points in the plane and whose edge weights are the Manhattan distances between them.

Because the graph is dense (`E ≈ N²/2`), the array-based version of **Prim's algorithm** is the most efficient choice:
- `inMst[i]`: whether point `i` has been added to the spanning tree.
- `minDist[i]`: the **smallest** edge weight connecting point `i` to any point already in the tree. Initially `minDist[0] = 0`, and every other point gets `∞` (`int.MaxValue`).

Over `N` steps in total, each time:
1. Among the points not yet in the tree (`!inMst[u]`), pick the point `u` with the smallest `minDist[u]`.
2. Add `u` to the tree (`inMst[u] = true`) and add `minDist[u]` to `totalCost`.
3. For every point `v` not yet in the tree, compute the Manhattan distance between `u` and `v`; if it is smaller than `minDist[v]`, update `minDist[v]`.

```csharp solution
public class Solution
{
    public int MinCostConnectPoints(int[][] points)
    {
        int n = points.Length;
        bool[] inMst = new bool[n];
        int[] minDist = new int[n];
        Array.Fill(minDist, int.MaxValue);
        minDist[0] = 0;

        int totalCost = 0;

        for (int step = 0; step < n; step++)
        {
            int u = -1;
            for (int i = 0; i < n; i++)
            {
                if (!inMst[i] && (u == -1 || minDist[i] < minDist[u]))
                    u = i;
            }

            inMst[u] = true;
            totalCost += minDist[u];

            for (int v = 0; v < n; v++)
            {
                if (!inMst[v])
                {
                    int dist = Math.Abs(points[u][0] - points[v][0]) +
                               Math.Abs(points[u][1] - points[v][1]);
                    if (dist < minDist[v])
                        minDist[v] = dist;
                }
            }
        }

        return totalCost;
    }
}
```

```typescript solution
function minCostConnectPoints(points: number[][]): number {
  const n = points.length;
  const inMst = new Array<boolean>(n).fill(false);
  const minDist = new Array<number>(n).fill(Infinity);
  minDist[0] = 0;

  let totalCost = 0;

  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inMst[i] && (u === -1 || minDist[i] < minDist[u])) {
        u = i;
      }
    }

    inMst[u] = true;
    totalCost += minDist[u];

    for (let v = 0; v < n; v++) {
      if (!inMst[v]) {
        const dist =
          Math.abs(points[u][0] - points[v][0]) +
          Math.abs(points[u][1] - points[v][1]);
        if (dist < minDist[v]) {
          minDist[v] = dist;
        }
      }
    }
  }

  return totalCost;
}
```

### Complexity

- **Time:** O(N²). The outer loop runs `N` times; at each step, finding the nearest node and updating the distances of the remaining nodes takes O(N).
- **Space:** O(N). Only the `inMst` and `minDist` arrays of `N` elements are used.
