---
title: Same Tree
---
You are given `p` and `q`, the roots of two binary trees. Determine whether the two trees are **the same**.

Two trees are the same if they are structurally identical and the corresponding nodes have equal values.

### Example 1

```text
Input:  p = [1, 2, 3], q = [1, 2, 3]
Output: true
```

### Example 2

```text
Input:  p = [1, 2], q = [1, null, 2]
Output: false
```

### Example 3

```text
Input:  p = [1, 2, 1], q = [1, 1, 2]
Output: false
```

### Constraints

- The number of nodes in both trees is in the range `[0, 100]`.
- `-10^4 <= Node.val <= 10^4`

## Hints

- Two empty trees are the same. If one is empty and the other is not, they are not the same.
- If the values of the two roots are equal, the left subtrees and the right subtrees must also be the same.

## Solution

### Simultaneous DFS

We traverse both trees at the same time:

- If both are `null`, this branch matches.
- If only one is `null`, or the values differ, the trees are different.
- Otherwise the left children and the right children are compared with the same function; both pairs must be the same.

Because the `&&` operator short-circuits, the comparison stops at the first difference.

```csharp solution
public class Solution
{
    public bool IsSameTree(TreeNode p, TreeNode q)
    {
        if (p == null && q == null)
        {
            return true;
        }

        if (p == null || q == null || p.val != q.val)
        {
            return false;
        }

        return IsSameTree(p.left, q.left) && IsSameTree(p.right, q.right);
    }
}
```

```typescript solution
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (p === null && q === null) {
    return true;
  }

  if (p === null || q === null || p.val !== q.val) {
    return false;
  }

  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

### Complexity

- **Time:** O(min(n, m)). It stops at the first difference; in the worst case, every node of the smaller tree is visited.
- **Space:** O(h) recursion stack.

This comparison is the building block of the "Subtree of Another Tree" problem.
