---
title: Balanced Binary Tree
---
You are given `root`, the root of a binary tree. Determine whether the tree is **height-balanced**.

In a height-balanced tree, the heights of the left and right subtrees of **every node** differ by at most `1`.

### Example 1

```text
Input:  root = [3, 9, 20, null, null, 15, 7]
Output: true
```

### Example 2

```text
Input:  root = [1, 2, 2, 3, 3, null, null, 4, 4]
Output: false
Explanation: The root's left subtree has height 3, and its right subtree has height 1.
```

### Example 3

```text
Input:  root = []
Output: true
```

### Constraints

- The number of nodes is in the range `[0, 5000]`.
- `-10^4 <= Node.val <= 10^4`

## Hints

- Checking only the root is not enough: the condition must hold at every node.
- Computing the height separately at each node takes O(n²). Can you compute the heights bottom-up in a single pass?
- Let the DFS return the height; if a subtree is unbalanced, return a special value such as `-1` instead of a height and pass it straight up.

## Solution

### A single bottom-up pass

The function `Check(node)` returns the subtree's height if it is balanced, and `-1` otherwise:

- The height of an empty node is `0`.
- If the left or right child returns `-1`, an imbalance has already been found; `-1` is passed straight up.
- If the two heights differ by more than `1`, this node is unbalanced: `-1`.
- Otherwise the height is `1 + max(left, right)`.

If the root doesn't return `-1`, the tree is balanced.

```csharp solution
public class Solution
{
    public bool IsBalanced(TreeNode root)
    {
        return Check(root) != -1;
    }

    private static int Check(TreeNode node)
    {
        if (node == null)
        {
            return 0;
        }

        var left = Check(node.left);
        if (left == -1)
        {
            return -1;
        }

        var right = Check(node.right);
        if (right == -1 || Math.Abs(left - right) > 1)
        {
            return -1;
        }

        return 1 + Math.Max(left, right);
    }
}
```

```typescript solution
function isBalanced(root: TreeNode | null): boolean {
  const check = (node: TreeNode | null): number => {
    if (node === null) {
      return 0;
    }

    const left = check(node.left);
    if (left === -1) {
      return -1;
    }

    const right = check(node.right);
    if (right === -1 || Math.abs(left - right) > 1) {
      return -1;
    }

    return 1 + Math.max(left, right);
  };

  return check(root) !== -1;
}
```

### Complexity

- **Time:** O(n). Each node is visited once.
- **Space:** O(h) recursion stack.
