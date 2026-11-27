---
title: Subtree of Another Tree
---
You are given `root` and `subRoot`, the roots of two binary trees. Return whether the tree `root` contains a subtree with **the same structure and the same node values** as `subRoot`.

The **subtree** of a tree starting at node `node` consists of `node` and **all** of its descendants. So there must be no extra leaves or branches below the matching part inside `root`; a tree also counts as a subtree of itself.

### Example 1

```text
Input:  root = [3, 4, 5, 1, 2], subRoot = [4, 1, 2]
Output: true
Explanation: Node 4 in root together with all its descendants, [4, 1, 2], is identical to subRoot.
```

### Example 2

```text
Input:  root = [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot = [4, 1, 2]
Output: false
Explanation: In the subtree of node 4 in root, 2 has 0 as its left child; in subRoot, 2 is a leaf.
```

### Example 3

```text
Input:  root = [1, 1], subRoot = [1]
Output: true
Explanation: The root node 1 has a left child, but node 1 at the left leaf matches subRoot exactly.
```

### Constraints

- The number of nodes in the `root` tree is in the range `[1, 2000]`.
- The number of nodes in the `subRoot` tree is in the range `[1, 1000]`.
- `-10^4 <= root.val <= 10^4`
- `-10^4 <= subRoot.val <= 10^4`

## Hints

- First solve a simpler question: how would you recursively check whether two trees are **exactly the same** (`IsSameTree`)?
- For two trees to be the same, their root values must be equal, their left subtrees must be the same, and their right subtrees must be the same.
- Now think of every node in the `root` tree as a potential starting point: either the subtree starting at the current node is the same as `subRoot`, or the subtree we're looking for is hidden in the left or right branch.
- Don't stop at value equality alone; when searching for `[1]` in `[1, 1]`, the `1` at the root doesn't match, but the `1` at its left child does.

## Solution

We split the problem into two clear parts:

1. **`IsSameTree(a, b)`:** Checks whether the trees starting at the two given root nodes are exactly the same in structure and values. It returns `true` if both are `null`, and `false` if only one is `null` or the values differ; otherwise it compares the left children with each other and the right children with each other.
2. **`IsSubtree(root, subRoot)`:** Traverses the main tree. At each node, it first calls `IsSameTree(root, subRoot)` to ask "does the subtree we're looking for start right here?" If there is a match it returns `true`; otherwise it continues the search in the `root.left` and `root.right` subtrees.

Even when there are several nodes with the same value (for example `root = [1, 1]`, `subRoot = [1]`), this approach keeps checking the child branches after a failed attempt, so it never misses a possible match.

```csharp solution
public class Solution
{
    public bool IsSubtree(TreeNode root, TreeNode subRoot)
    {
        if (subRoot == null) return true;
        if (root == null) return false;

        // Is the subtree starting at the current node exactly the same as subRoot?
        if (IsSameTree(root, subRoot))
            return true;

        // If not, keep searching in the left or right subtree.
        return IsSubtree(root.left, subRoot) || IsSubtree(root.right, subRoot);
    }

    private bool IsSameTree(TreeNode a, TreeNode b)
    {
        if (a == null && b == null) return true;
        if (a == null || b == null || a.val != b.val) return false;

        return IsSameTree(a.left, b.left) && IsSameTree(a.right, b.right);
    }
}
```

```typescript solution
function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
  if (subRoot === null) return true;
  if (root === null) return false;

  if (isSameTree(root, subRoot)) return true;

  return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}

function isSameTree(a: TreeNode | null, b: TreeNode | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null || a.val !== b.val) return false;

  return isSameTree(a.left, b.left) && isSameTree(a.right, b.right);
}
```

### Complexity

- **Time:** O(n · m), where `n` is the number of nodes in the main tree and `m` is the number of nodes in the `subRoot` tree. In the worst case, an `IsSameTree` check taking `O(m)` is performed at every node.
- **Space:** O(h_n + h_m). The depth of the recursion call stack is the sum of the main tree's height and the subtree's height; O(n + m) in the worst case.
