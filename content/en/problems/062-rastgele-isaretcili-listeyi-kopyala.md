---
title: Copy List with Random Pointer
---
You are given a linked list in which every node has, in addition to its `next` pointer, a `random` pointer that can point to any node in the list or to `null`. Create a **deep copy** of the list: the copy must consist entirely of new nodes, and its `next` and `random` pointers must point to nodes **in the copy**. No pointer in the copy may point into the original list.

The list is given as one `[val, randomIndex]` pair per node: `randomIndex` is the 0-indexed position of the node that `random` points to, or `-1` if `random` is `null`. Build the original nodes from this array, make the deep copy, and return **the copy in the same format**.

### Example 1

```text
Input:  nodes = [[7,-1],[13,0],[11,4],[10,2],[1,0]]
Output: [[7,-1],[13,0],[11,4],[10,2],[1,0]]
Explanation: The random pointer of 13 points to 7 (node 0), and that of 11 points to 1 (node 4).
```

### Example 2

```text
Input:  nodes = [[1,1],[2,1]]
Output: [[1,1],[2,1]]
```

### Example 3

```text
Input:  nodes = [[3,-1],[3,0],[3,-1]]
Output: [[3,-1],[3,0],[3,-1]]
```

### Constraints

- `0 <= n <= 1000`
- `-10^4 <= Node.val <= 10^4`
- `randomIndex` is `-1` or in the range `[0, n - 1]`.

## Hints

- Copying the `next` pointers is easy. The hard part is that `random` can point to a node that hasn't been created yet.
- Use a hash table that maps "original node → its copy". Create all the copies in the first pass, then connect the pointers in the second pass.
- For O(1) extra space: weave each copy right after its original node, set the `random` pointers using `original.random.next`, then separate the two lists.

## Solution

### Two passes and a hash table

First we build the original list from the given pairs. Then:

1. **First pass:** For each original node, we create a new node with the same value and record it in an `old → new` map.
2. **Second pass:** For each original node, we set `copy.next = map[old.next]` and `copy.random = map[old.random]`. Since every copy now exists, the counterpart is found no matter which node `random` points to.

Finally, we walk the copy from the start and produce the output, using a `node → index` map to find the position in the copy of each node's `random` target.

```csharp solution
public class Solution
{
    private class Node
    {
        public int val;
        public Node next;
        public Node random;
        public Node(int val) { this.val = val; }
    }

    public int[][] CopyRandomList(int[][] nodes)
    {
        // Build the original list from the given pairs.
        var original = new Node[nodes.Length];
        for (var i = 0; i < nodes.Length; i++)
        {
            original[i] = new Node(nodes[i][0]);
        }

        for (var i = 0; i < nodes.Length; i++)
        {
            if (i + 1 < nodes.Length) original[i].next = original[i + 1];
            if (nodes[i][1] >= 0) original[i].random = original[nodes[i][1]];
        }

        var head = nodes.Length > 0 ? original[0] : null;
        var copy = Copy(head);

        // Convert the copy to the [val, randomIndex] format.
        var indexOf = new Dictionary<Node, int>();
        var list = new List<Node>();
        for (var node = copy; node != null; node = node.next)
        {
            indexOf[node] = list.Count;
            list.Add(node);
        }

        return list.Select(node => new[] { node.val, node.random == null ? -1 : indexOf[node.random] }).ToArray();
    }

    private static Node Copy(Node head)
    {
        var map = new Dictionary<Node, Node>();
        for (var node = head; node != null; node = node.next)
        {
            map[node] = new Node(node.val);
        }

        for (var node = head; node != null; node = node.next)
        {
            map[node].next = node.next == null ? null : map[node.next];
            map[node].random = node.random == null ? null : map[node.random];
        }

        return head == null ? null : map[head];
    }
}
```

```typescript solution
class RandomNode {
  val: number;
  next: RandomNode | null = null;
  random: RandomNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function copy(head: RandomNode | null): RandomNode | null {
  const map = new Map<RandomNode, RandomNode>();
  for (let node = head; node !== null; node = node.next) {
    map.set(node, new RandomNode(node.val));
  }

  for (let node = head; node !== null; node = node.next) {
    const clone = map.get(node)!;
    clone.next = node.next === null ? null : map.get(node.next)!;
    clone.random = node.random === null ? null : map.get(node.random)!;
  }

  return head === null ? null : map.get(head)!;
}

function copyRandomList(nodes: number[][]): number[][] {
  const original = nodes.map(([val]) => new RandomNode(val));
  nodes.forEach(([, randomIndex], i) => {
    if (i + 1 < nodes.length) original[i].next = original[i + 1];
    if (randomIndex >= 0) original[i].random = original[randomIndex];
  });

  const clone = copy(original.length > 0 ? original[0] : null);

  const list: RandomNode[] = [];
  const indexOf = new Map<RandomNode, number>();
  for (let node = clone; node !== null; node = node.next) {
    indexOf.set(node, list.length);
    list.push(node);
  }

  return list.map((node) => [node.val, node.random === null ? -1 : indexOf.get(node.random)!]);
}
```

### Complexity

- **Time:** O(n). The list is processed in a constant number of passes.
- **Space:** O(n). The map holds one entry per node.

With the weaving method (`A → A' → B → B' → …`), the extra space drops to O(1): set `A'.random = A.random.next`, then separate the two lists. In an interview, explaining the hash table solution first and then this improvement is a good flow.
