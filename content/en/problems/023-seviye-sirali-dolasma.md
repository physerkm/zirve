---
title: Binary Tree Level Order Traversal
---
You are given the root `root` of a binary tree. Return the values of its nodes **level by level**, from left to right within each level. Each level must be a separate list.

### Example 1

```text
Input:  root = [3, 9, 20, null, null, 15, 7]
Output:  [[3], [9, 20], [15, 7]]
```

### Example 2

```text
Input:  root = []
Output:  []
```

### Constraints

- The number of nodes is in the range `[0, 2000]`.

## Hints

- The phrase "level by level" points to breadth-first search (BFS); use a queue.
- How do you know where a level ends? Save the queue's **size** before you start processing the level.

## Solution

Put the root in a queue. In each round, save the number of nodes in the queue (`size`): that's the number of nodes on the current level. Dequeue exactly that many nodes, add their values to the level's list, and enqueue their children at the back. When the round ends, only the nodes of the next level remain in the queue.

```csharp solution
public class Solution
{
    public IList<IList<int>> LevelOrder(TreeNode root)
    {
        var levels = new List<IList<int>>();
        if (root == null) return levels;

        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);

        while (queue.Count > 0)
        {
            var size = queue.Count;
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
}
```

```typescript solution
function levelOrder(root: TreeNode | null): number[][] {
  const levels: number[][] = [];
  if (root === null) return levels;

  let current: TreeNode[] = [root];

  while (current.length > 0) {
    const next: TreeNode[] = [];
    const level: number[] = [];

    for (const node of current) {
      level.push(node.val);
      if (node.left !== null) next.push(node.left);
      if (node.right !== null) next.push(node.right);
    }

    levels.push(level);
    current = next;
  }

  return levels;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(n); the widest level is held in the queue (about n/2 nodes in a full tree).

The TypeScript solution uses "current level" and "next level" arrays instead of a queue. Since `array.shift()` is O(n) in JavaScript, this form is both faster and more readable.

The same skeleton solves many questions: the right side view of a tree (the last element of each level), zigzag traversal (reversing every other level), level averages.
