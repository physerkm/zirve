---
title: Validate Binary Search Tree
---
You are given the root `root` of a binary tree. Return whether the tree is a **valid binary search tree** (BST).

In a valid BST, for every node:

- **All** values in the left subtree are **less than** the node's value.
- **All** values in the right subtree are **greater than** the node's value.
- The left and right subtrees are themselves valid BSTs.

### Example 1

```text
Input:  root = [2, 1, 3]
Output:  true
```

### Example 2

```text
Input:  root = [5, 1, 4, null, null, 3, 6]
Output:  false
Explanation: The root's right child is 4; since it's less than 5, the rule is broken.
```

### Constraints

- The number of nodes is in the range `[1, 10^4]`.
- `-2^31 <= Node.val <= 2^31 - 1`

## Hints

- Comparing each node only with its own children is **not enough**. Consider the tree `[5, 4, 6, null, null, 3, 7]`: 3 satisfies the local rule as the left child of 6, but it's invalid because it's in the right subtree of the root (5).
- Every node has a **lower and upper bound** it must satisfy. Narrow these bounds as you go down.
- Alternative: an inorder traversal of a valid BST yields a strictly increasing sequence.

## Solution

Carry an allowed value range `(low, high)` down to each node. For the root, the range is unbounded. When you go left, the upper bound becomes the node's value (everything in the left subtree must be smaller than it); when you go right, the lower bound becomes the node's value.

Since node values can equal the `int` limits, keep the bounds as `long`; otherwise a valid node with value `int.MinValue` would be wrongly rejected for being equal to the initial bound.

```csharp solution
public class Solution
{
    public bool IsValidBST(TreeNode root)
    {
        return IsValid(root, long.MinValue, long.MaxValue);
    }

    private bool IsValid(TreeNode node, long low, long high)
    {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;

        return IsValid(node.left, low, node.val) && IsValid(node.right, node.val, high);
    }
}
```

```typescript solution
function isValidBST(root: TreeNode | null): boolean {
  const isValid = (node: TreeNode | null, low: number, high: number): boolean => {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;

    return isValid(node.left, low, node.val) && isValid(node.right, node.val, high);
  };

  return isValid(root, -Infinity, Infinity);
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(h), where `h` is the height of the tree.

Watch out for equal values: the definition requires **strictly** less and greater, so the comparisons use `<=` and `>=`. `[1, 1]` is not a valid BST.
