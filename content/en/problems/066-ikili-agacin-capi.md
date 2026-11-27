---
title: Diameter of Binary Tree
---
You are given `root`, the root of a binary tree. Return the **diameter** of the tree.

The diameter is the **number of edges on the longest path** between any two nodes in the tree. This path does not have to pass through the root.

### Example 1

```text
Input:  root = [1, 2, 3, 4, 5]
Output: 3
Explanation: The longest path is [4, 2, 1, 3] or [5, 2, 1, 3]; 3 edges.
```

### Example 2

```text
Input:  root = [1, 2]
Output: 1
```

### Constraints

- The number of nodes is in the range `[1, 10^4]`.
- `-100 <= Node.val <= 100`

## Hints

- Think about the "highest" node on the longest path. If the path goes down into both subtrees of this node, what is its length?
- The longest path through each node is `leftHeight + rightHeight`. The largest of these over all nodes is the answer.
- Let a single DFS both return the height and update the best diameter along the way.

## Solution

### A DFS that returns the height

The **height** of a node (the number of nodes on the longest downward path) is `1 + max(left, right)`; the height of an empty tree is `0`. The longest path that uses a node as its "peak" goes down to the deepest point of the left subtree and down to the deepest point of the right subtree: its edge count is `left + right`.

At each node, the DFS learns the heights of the two children, updates the diameter with `best = max(best, left + right)`, and returns its own height to the parent. This way every node is processed once.

```csharp solution
public class Solution
{
    private int best;

    public int DiameterOfBinaryTree(TreeNode root)
    {
        best = 0;
        Height(root);
        return best;
    }

    private int Height(TreeNode node)
    {
        if (node == null)
        {
            return 0;
        }

        var left = Height(node.left);
        var right = Height(node.right);
        best = Math.Max(best, left + right);
        return 1 + Math.Max(left, right);
    }
}
```

```typescript solution
function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;

  const height = (node: TreeNode | null): number => {
    if (node === null) {
      return 0;
    }

    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };

  height(root);
  return best;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(h) recursion stack.

Recomputing the height with a separate function at every node goes up to O(n²). The pattern "return a value up from the subtree, update a global best on the side" is used in exactly the same way in harder problems such as the maximum path sum.
