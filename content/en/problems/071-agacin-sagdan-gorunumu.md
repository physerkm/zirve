---
title: Binary Tree Right Side View
---
You are given `root`, the root of a binary tree. Imagine **standing on the right side** of the tree. Return the values of the nodes you can see, ordered from top to bottom.

### Example 1

```text
Input:  root = [1, 2, 3, null, 5, null, 4]
Output: [1, 3, 4]
```

### Example 2

```text
Input:  root = [1, 2, 3, 4]
Output: [1, 3, 4]
Explanation: Level 3 contains only 4; even though it is on the left side, it is visible from the right.
```

### Example 3

```text
Input:  root = []
Output: []
```

### Constraints

- The number of nodes is in the range `[0, 100]`.
- `-100 <= Node.val <= 100`

## Hints

- The node visible from the right is the **rightmost** node of each level; it is not always on the rightmost branch.
- Traverse the tree level by level (BFS). The last node of each level goes into the answer.
- DFS works too: go to the right child first; the node you see the first time you reach a depth is the rightmost node of that level.

## Solution

### Level-order traversal

We put the root in a queue. In each round, we remove as many nodes as the **current size** of the queue; these make up exactly one level. The last node removed in the level is the one visible from the right. The children of every removed node (left first, then right) are added to the queue for the next level.

```csharp solution
public class Solution
{
    public IList<int> RightSideView(TreeNode root)
    {
        var view = new List<int>();
        if (root == null)
        {
            return view;
        }

        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);

        while (queue.Count > 0)
        {
            var levelSize = queue.Count;
            for (var i = 0; i < levelSize; i++)
            {
                var node = queue.Dequeue();
                if (i == levelSize - 1)
                {
                    view.Add(node.val);
                }

                if (node.left != null) queue.Enqueue(node.left);
                if (node.right != null) queue.Enqueue(node.right);
            }
        }

        return view;
    }
}
```

```typescript solution
function rightSideView(root: TreeNode | null): number[] {
  const view: number[] = [];
  if (root === null) {
    return view;
  }

  let level: TreeNode[] = [root];
  while (level.length > 0) {
    view.push(level[level.length - 1].val);

    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left !== null) next.push(node.left);
      if (node.right !== null) next.push(node.right);
    }

    level = next;
  }

  return view;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(w), where `w` is the number of nodes on the widest level of the tree.
