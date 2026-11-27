---
title: Clone Graph
---
You are given the adjacency list (`adjList`) of a connected, undirected graph. Create a **deep copy** of the graph and return the adjacency list of the cloned graph.

Each node in the graph holds an integer value (`val`) and a list of its neighboring nodes (`neighbors`). The adjacency list is 1-indexed: `adjList[i]` contains the neighbors of node number `i + 1`.

### Example 1

```text
Input:  adjList = [[2,4],[1,3],[2,4],[1,3]]
Output: [[2,4],[1,3],[2,4],[1,3]]
Explanation: The graph has 4 nodes:
The neighbors of node 1 (val = 1) are nodes 2 and 4.
The neighbors of node 2 (val = 2) are nodes 1 and 3.
The neighbors of node 3 (val = 3) are nodes 2 and 4.
The neighbors of node 4 (val = 4) are nodes 1 and 3.
A deep copy is built from new node objects with exactly the same connections.
```

### Example 2

```text
Input:  adjList = [[]]
Output: [[]]
Explanation: The graph consists of only node 1, which has no neighbors.
```

### Example 3

```text
Input:  adjList = []
Output: []
Explanation: The graph is empty; it contains no nodes.
```

### Constraints

- The number of nodes in the graph is in the range `[0, 100]`.
- `1 <= Node.val <= 100`
- `Node.val` is unique for each node.
- There are no repeated edges and no self-loops.
- The graph is connected, and every node can be reached from node 1.

## Hints

- In an undirected graph, the edge `1 — 2` lets you go both from `1` to `2` and from `2` to `1`; so if you don't track visited nodes, you will end up in an infinite loop.
- Knowing "was it visited?" is not enough: when you run into a neighbor you have already copied, you need **the reference to the copy you created earlier**.
- With a `Dictionary<Node, Node>` mapping (old node -> new copy), you can both prevent infinite loops and access existing copies in O(1).
- Remember to record the new node in the dictionary **before** recursively copying its neighbors.

## Solution

The most critical problem when deep-copying a graph is **cycles**. For example, if nodes `1` and `2` are neighbors, copying `1` leads us to copy its neighbor `2`, and `2` then tries to copy its own neighbor `1`.

To solve this, we use a **hash table (`Dictionary<Node, Node>`)** called `oldToNew`:
1. When `Dfs(node)` is called, we first check whether `node` is in `oldToNew`. If it is, we return its previously created copy directly.
2. Otherwise, we create the copy with `new Node(node.val)` and record it as `oldToNew[node] = copy` **right before visiting its neighbors**.
3. Then, for each `nei` in `node.neighbors`, we call `copy.neighbors.Add(Dfs(nei))` to build the connections.

Each node is created exactly once, and each edge is visited a constant number of times.

```csharp solution
public class Solution
{
    private class Node
    {
        public int val;
        public List<Node> neighbors = new List<Node>();
        public Node(int val) { this.val = val; }
    }

    public IList<IList<int>> CloneGraph(IList<IList<int>> adjList)
    {
        int n = adjList.Count;
        if (n == 0)
            return new List<IList<int>>();

        // 1. Build the original graph nodes from the adjacency list
        var nodes = new Node[n];
        for (int i = 0; i < n; i++)
            nodes[i] = new Node(i + 1);

        for (int i = 0; i < n; i++)
        {
            foreach (int neiVal in adjList[i])
                nodes[i].neighbors.Add(nodes[neiVal - 1]);
        }

        // 2. Make a deep copy with a hash table + DFS
        var oldToNew = new Dictionary<Node, Node>();

        Node Dfs(Node node)
        {
            if (oldToNew.TryGetValue(node, out var existing))
                return existing;

            var copy = new Node(node.val);
            oldToNew[node] = copy;

            foreach (var nei in node.neighbors)
                copy.neighbors.Add(Dfs(nei));

            return copy;
        }

        for (int i = 0; i < n; i++)
        {
            if (!oldToNew.ContainsKey(nodes[i]))
                Dfs(nodes[i]);
        }

        // 3. Convert the cloned graph back to an adjacency list
        var result = new List<IList<int>>(n);
        for (int i = 0; i < n; i++)
        {
            var clonedNode = oldToNew[nodes[i]];
            var neighborVals = new List<int>(clonedNode.neighbors.Count);
            foreach (var nei in clonedNode.neighbors)
                neighborVals.Add(nei.val);
            result.Add(neighborVals);
        }

        return result;
    }
}
```

```typescript solution
class GraphNode {
  val: number;
  neighbors: GraphNode[];
  constructor(val: number) {
    this.val = val;
    this.neighbors = [];
  }
}

function cloneGraph(adjList: number[][]): number[][] {
  const n = adjList.length;
  if (n === 0) return [];

  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => new GraphNode(i + 1));
  for (let i = 0; i < n; i++) {
    for (const neiVal of adjList[i]) {
      nodes[i].neighbors.push(nodes[neiVal - 1]);
    }
  }

  const oldToNew = new Map<GraphNode, GraphNode>();

  function dfs(node: GraphNode): GraphNode {
    const existing = oldToNew.get(node);
    if (existing !== undefined) return existing;

    const copy = new GraphNode(node.val);
    oldToNew.set(node, copy);

    for (const nei of node.neighbors) {
      copy.neighbors.push(dfs(nei));
    }

    return copy;
  }

  for (let i = 0; i < n; i++) {
    if (!oldToNew.has(nodes[i])) {
      dfs(nodes[i]);
    }
  }

  const result: number[][] = [];
  for (let i = 0; i < n; i++) {
    const clonedNode = oldToNew.get(nodes[i])!;
    result.push(clonedNode.neighbors.map((nei) => nei.val));
  }

  return result;
}
```

### Complexity

- **Time:** O(V + E), where `V` is the number of nodes and `E` is the number of edges. Each node is copied once, and each adjacency link is visited a constant number of times.
- **Space:** O(V). The `oldToNew` dictionary holds `V` node mappings, and the DFS recursion stack reaches a depth of at most O(V).
