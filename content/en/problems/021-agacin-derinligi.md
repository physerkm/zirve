---
title: Maximum Depth of Binary Tree
---
You are given the root `root` of a binary tree. Return the tree's **maximum depth**.

The maximum depth is the **number of nodes** along the path from the root to the farthest leaf. The depth of an empty tree is `0`.

Trees are given as arrays in level order; `null` denotes a missing child.

### Example 1

```text
Input:  root = [3, 9, 20, null, null, 15, 7]
Output:  3

        3
       / \
      9  20
         / \
        15  7
```

### Example 2

```text
Input:  root = [1, null, 2]
Output:  2
```

### Constraints

- The number of nodes is in the range `[0, 10^4]`.

## Hints

- Can a tree's depth be written in terms of the depths of its subtrees?
- What is the answer for an empty tree? That's the base case of the recursion.

## Solution

A tree's depth is the root itself (1) plus the depth of the **deeper** subtree. This definition translates directly into recursion; the depth of an empty subtree is `0`.

```csharp solution
public class Solution
{
    public int MaxDepth(TreeNode root)
    {
        if (root == null) return 0;

        return 1 + Math.Max(MaxDepth(root.left), MaxDepth(root.right));
    }
}
```

```typescript solution
function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0;

  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### Complexity

- **Time:** O(n). Each node is visited once.
- **Space:** O(h), where `h` is the height of the tree (the call stack). O(log n) in a balanced tree, O(n) in a tree that has degenerated into a single branch.

**Alternative:** You can count the levels with breadth-first search (BFS). Its space is the size of the widest level, and it carries no risk of call stack overflow on very deep trees.
