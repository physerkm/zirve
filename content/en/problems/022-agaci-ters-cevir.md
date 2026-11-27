---
title: Invert Binary Tree
---
You are given the root `root` of a binary tree. Turn the tree into its **mirror image** (swap the left and right children of every node) and return the root.

### Example 1

```text
Input:  root = [4, 2, 7, 1, 3, 6, 9]
Output:  [4, 7, 2, 9, 6, 3, 1]
```

### Example 2

```text
Input:  root = [2, 1, 3]
Output:  [2, 3, 1]
```

### Example 3

```text
Input:  root = []
Output:  []
```

### Constraints

- The number of nodes is in the range `[0, 100]`.
- `-100 <= Node.val <= 100`

## Hints

- The mirror image means swapping the left and right children at **every** node.
- What happens if you swap the children at the root and then apply the same operation to both subtrees?
- Instead of recursion, you can also visit every node with a queue (BFS) or a stack.

## Solution

### Recursive swap

An empty tree is already its own mirror. Otherwise, swap the root's left and right children, then apply the same operation to both subtrees. It doesn't matter whether the swap happens before or after the subtrees; what matters is that every node is swapped exactly once.

```csharp solution
public class Solution
{
    public TreeNode InvertTree(TreeNode root)
    {
        if (root == null)
        {
            return null;
        }

        (root.left, root.right) = (root.right, root.left);
        InvertTree(root.left);
        InvertTree(root.right);
        return root;
    }
}
```

```typescript solution
function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) {
    return null;
  }

  [root.left, root.right] = [root.right, root.left];
  invertTree(root.left);
  invertTree(root.right);
  return root;
}
```

### Complexity

- **Time:** O(n). Each node is visited once.
- **Space:** O(h). The recursion stack grows as deep as the height of the tree; in an unbalanced tree it can be O(n).
