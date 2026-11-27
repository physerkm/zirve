---
title: Lowest Common Ancestor of a Binary Search Tree
---
You are given `root`, the root of a **binary search tree** (BST) whose node values are all distinct, and two node values `p` and `q` that are guaranteed to exist in the tree. Return the value of the **lowest common ancestor** (LCA) of these two nodes.

For two nodes `p` and `q`, the **lowest common ancestor** is the **deepest** node that has both `p` and `q` as descendants. By definition, a node also counts as **an ancestor of itself**; so if node `p` is above `q`, the lowest common ancestor is `p` itself.

### Example 1

```text
Input:  root = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p = 2, q = 8
Output: 6
Explanation: 2 is in the left subtree and 8 is in the right subtree; the first node where the paths split is 6.
```

### Example 2

```text
Input:  root = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p = 2, q = 4
Output: 2
Explanation: Node 4 is in the right subtree of 2. Since a node counts as an ancestor of itself, the common ancestor is 2.
```

### Example 3

```text
Input:  root = [2, 1], p = 2, q = 1
Output: 2
```

### Constraints

- The number of nodes in the tree is in the range `[2, 10^5]`.
- `-10^9 <= Node.val <= 10^9`
- All `Node.val` values are **unique**.
- `p != q`
- Nodes with values `p` and `q` are guaranteed to exist in the tree.

## Hints

- In an ordinary binary tree you would have to search both branches; but in a **binary search tree (BST)**, looking at a node's value tells you right away which side `p` and `q` are on.
- Start from the root: if both `p` and `q` are **less** than the current node's value, the common ancestor you're looking for can only be in the **left** subtree.
- If both `p` and `q` are **greater** than the current node's value, the common ancestor can only be in the **right** subtree.
- And if one is smaller and the other larger (or one equals the current node)? The paths split exactly at this node!

## Solution

Thanks to the ordering property of a binary search tree, we don't need to traverse the whole tree. We start from the root (`curr = root`) and follow a single path downward:

1. **`p < curr.val && q < curr.val`:** Both target values are smaller than the current node. Since both are in the left subtree, their common ancestor is also in the left subtree (`curr = curr.left`).
2. **`p > curr.val && q > curr.val`:** Both values are greater than the current node. Since both are in the right subtree, we go right (`curr = curr.right`).
3. **Otherwise:** Either `p` and `q` fall on two different sides of the current node (`p < curr.val < q` or the reverse), or one of the target values is exactly `curr.val`. In both cases, `curr` is the **first** (and deepest) common ancestor where the two nodes' paths split; we return `curr.val`.

Since we use a simple `while` loop instead of recursion, no call stack is used and the extra memory cost is **O(1)**.

```csharp solution
public class Solution
{
    public int LowestCommonAncestor(TreeNode root, int p, int q)
    {
        TreeNode curr = root;

        while (curr != null)
        {
            // If both are smaller, the common ancestor is in the left subtree.
            if (p < curr.val && q < curr.val)
            {
                curr = curr.left;
            }
            // If both are greater, the common ancestor is in the right subtree.
            else if (p > curr.val && q > curr.val)
            {
                curr = curr.right;
            }
            // Found the first node where the paths split (or one of the nodes itself).
            else
            {
                return curr.val;
            }
        }

        return root.val;
    }
}
```

```typescript solution
function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number {
  let curr = root;

  while (curr !== null) {
    if (p < curr.val && q < curr.val) {
      curr = curr.left;
    } else if (p > curr.val && q > curr.val) {
      curr = curr.right;
    } else {
      return curr.val;
    }
  }

  return 0;
}
```

### Complexity

- **Time:** O(h), where `h` is the height of the tree; each step goes one level down. It takes O(log n) in a balanced BST and O(n) in the worst case, when the tree degenerates into a single branch.
- **Space:** O(1). The iterative solution keeps only a single `curr` pointer.
