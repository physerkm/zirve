---
title: Trees and Graphs
summary: Traversal with DFS and BFS, the binary search tree, the heap, and the common skeleton of graph problems. Which traversal to choose for which question.
---

Tree and graph questions look like a crowded field, but nearly all of them are variations of two traversal styles: **depth-first** (DFS) and **breadth-first** (BFS). Making these two a reflex covers most of the topic.

## Binary tree

```csharp
public class TreeNode
{
    public int val;
    public TreeNode left;
    public TreeNode right;
}
```

### DFS: thinking recursively

A tree is a recursive structure: every subtree is also a tree. Most tree questions fit this pattern: **"If I know the answer for the left subtree and the answer for the right subtree, what's the answer for this node?"**

```typescript
function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0;                             // base case
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

Each node is visited once: O(n) time. Space equals the height of the tree: O(log n) for a balanced tree, O(n) for a tree that has degenerated into a single branch.

There are three orders, depending on when the node is processed:

| Order | Sequence | Typical use |
| --- | --- | --- |
| Preorder | root, left, right | Copying a tree, serialization |
| Inorder | left, root, right | Traversing a binary search tree **in sorted order** |
| Postorder | left, right, root | Computations that depend on the subtrees' results (height, deletion) |

### BFS: layer by layer

It uses a queue. When you see phrases like "level by level," "shortest path," or "closest to the root," think BFS.

```csharp
IList<IList<int>> LevelOrder(TreeNode root)
{
    var levels = new List<IList<int>>();
    if (root == null) return levels;

    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);

    while (queue.Count > 0)
    {
        var size = queue.Count;            // number of nodes in this layer
        var level = new List<int>(size);

        for (var i = 0; i < size; i++)
        {
            var node = queue.Dequeue();
            level.Add(node.val);
            if (node.left != null) queue.Enqueue(node.left);
            if (node.right != null) queue.Enqueue(node.right);
        }

        levels.Add(level);
    }

    return levels;
}
```

Saving the queue size at the start of each layer is the standard way to separate the layers from one another.

## Binary search tree (BST)

For every node: **all** values in the left subtree are smaller than the node, and **all** values in the right subtree are larger. As a result, search, insertion, and deletion take time proportional to the tree's height: O(log n) if it's balanced.

Keep two consequences in mind:

- **Inorder traversal produces sorted output.** Questions like "the kth smallest element in a BST" rely on this.
- **Validity can't be checked by looking only at the children.** A value deep in a node's right subtree must also be larger than that node. The correct approach is to carry an allowed **range** down to each node:

```typescript
function isValidBst(node: TreeNode | null, low = -Infinity, high = Infinity): boolean {
  if (node === null) return true;
  if (node.val <= low || node.val >= high) return false;
  return isValidBst(node.left, low, node.val) && isValidBst(node.right, node.val, high);
}
```

## Heap (priority queue)

A heap is a tree that provides O(1) access to the **smallest (or largest) element** and O(log n) insertion and removal. It doesn't keep things sorted; it only guarantees the top.

Think of a heap for questions like "the `k` largest elements," "the kth largest," "the median of a data stream," and "merge `k` sorted lists." To find the `k` largest elements, keep **a min-heap of size k**: when the heap exceeds `k`, discard the smallest. The result is O(n log k), which beats sorting the whole array (O(n log n)).

```csharp
int KthLargest(int[] nums, int k)
{
    var heap = new PriorityQueue<int, int>();     // min-heap: priority = value

    foreach (var n in nums)
    {
        heap.Enqueue(n, n);
        if (heap.Count > k) heap.Dequeue();       // discard the smallest
    }

    return heap.Peek();
}
```

JavaScript's standard library has no heap; in an interview you may need to point this out and either write a simple heap or assume one exists.

## Graphs

A graph consists of nodes and the edges between them. A tree is a connected graph with no cycles. A graph question doesn't always arrive labeled "graph": a grid, a dependency list, friendships, word transformations… Whenever you see "things and the relationships between them," think graph.

The most useful representation is the **adjacency list**:

```typescript
function buildGraph(n: number, edges: number[][]): number[][] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [from, to] of edges) {
    graph[from].push(to);
    graph[to].push(from);      // for an undirected graph
  }
  return graph;
}
```

The one important difference from trees: graphs can have **cycles**. If you don't mark visited nodes, you'll end up in an infinite loop.

### DFS on a grid: counting islands

Grid questions are implicit graphs: each cell is a node, and adjacent cells are connected by edges.

```csharp
int CountIslands(char[][] grid)
{
    var count = 0;

    for (var r = 0; r < grid.Length; r++)
    {
        for (var c = 0; c < grid[r].Length; c++)
        {
            if (grid[r][c] != '1') continue;
            count++;
            Sink(grid, r, c);              // mark the entire island as visited
        }
    }

    return count;
}

void Sink(char[][] grid, int r, int c)
{
    if (r < 0 || c < 0 || r >= grid.Length || c >= grid[r].Length || grid[r][c] != '1') return;

    grid[r][c] = '0';
    Sink(grid, r + 1, c);
    Sink(grid, r - 1, c);
    Sink(grid, r, c + 1);
    Sink(grid, r, c - 1);
}
```

Each cell is visited a constant number of times: O(rows × columns).

### BFS: unweighted shortest path

If the edges have no weights (or all weights are equal), when BFS **first reaches** a node it has reached it by the shortest path. Weighted graphs require Dijkstra's algorithm (with a heap).

### Topological sort

In a directed acyclic graph (dependencies, course prerequisites), it orders the nodes so that "everything comes after the things it depends on." Kahn's algorithm: put the nodes with no incoming edges in a queue; as you process each node, decrement the incoming edge count of its neighbors; add those that drop to zero to the queue. If any nodes remain unprocessed at the end, the graph has a **cycle**.

## DFS or BFS?

| Question | Choice |
| --- | --- |
| Shortest path, fewest steps, layers | BFS |
| Exploring all paths or possibilities | DFS (backtracking) |
| Counting connected components, checking whether something is reachable | Either works; DFS is shorter to write |
| A computation that depends on the subtrees' results | DFS (postorder) |
| A very deep, narrow structure | BFS, or DFS with your own stack (so the call stack doesn't overflow) |

The complexity of both is O(V + E): every node and every edge is processed once.

## Summary

- For tree questions, think "build this node's answer from the subtrees' answers."
- BFS is for layers and shortest paths; DFS is for exploration and subtree computations.
- In a BST, inorder is sorted; check validity by carrying a range.
- When you see "the largest/smallest k" or "repeatedly extract the smallest," think heap.
- Don't forget to mark visited nodes in graphs; grids are implicit graphs.
