---
title: Binary Tree Maximum Path Sum
---
In a binary tree, a **path** is a sequence of nodes where each pair of adjacent nodes is connected by an edge and no node appears more than once. The path **does not need to pass through the root** and must contain at least one node.

The **path sum** of a path is the sum of the values of all nodes on it. Given `root`, the root of a non-empty binary tree, return the **maximum path sum** of any non-empty path in the tree.

### Example 1

```text
Input:  root = [1, 2, 3]
Output: 6
Explanation: The path with the highest sum is 2 -> 1 -> 3, with a sum of 2 + 1 + 3 = 6.
```

### Example 2

```text
Input:  root = [-10, 9, 20, null, null, 15, 7]
Output: 42
Explanation: The path with the highest sum is 15 -> 20 -> 7, with a sum of 15 + 20 + 7 = 42.
```

### Constraints

- The number of nodes in the tree is in the range `[1, 3 * 10^4]`.
- `-1000 <= Node.val <= 1000`

## Hints

- Think of any path in terms of its **topmost node** (the turning point): the path comes up from this node's left subtree, passes through the node, and goes down into its right subtree.
- If the largest contribution from a subtree is negative, including that branch in the path only lowers the sum. In that case it's better not to take that branch at all (count it as `0`).
- A node can make its own "arch" path (`node.val + left + right`) a candidate for the global maximum; but when returning to its **parent**, it can't hand up both the left and the right branch at once (otherwise the path would fork).
- Write a depth-first search (DFS) that returns only a single branch (`node.val + Math.Max(left, right)`) to the parent.

## Solution

Every valid path in the tree has **a single peak node at the highest level**. The path turns at this peak: a straight arm coming from the left subtree and a straight arm coming from the right subtree join at this node.

With this observation, we can solve the problem in a single bottom-up (postorder) DFS pass. For each `node`, we compute the best single-branch gains that can come from its subtrees:

1. We recursively get the maximum branch sums from the left and right children. If a branch's contribution is negative, it is more profitable not to include it in the path at all, so we clamp its contribution to zero with `Math.Max(0, Dfs(child))`.
2. The sum of the best path that has `node` as its peak is `node.val + left + right`. We update our global answer, the `_maxSum` variable, with this value.
3. The value the function returns to `node`'s **parent**, however, **cannot** be `node.val + left + right`, because a path can't fork. A path that continues through the parent can pick only one of `node`'s child branches. That's why we return `node.val + Math.Max(left, right)` upward.

Since all nodes may be negative, `_maxSum` must be initialized to `int.MinValue` (`-Infinity`), not `0`.

```csharp solution
public class Solution
{
    private int _maxSum;

    public int MaxPathSum(TreeNode root)
    {
        _maxSum = int.MinValue;
        Dfs(root);
        return _maxSum;
    }

    private int Dfs(TreeNode node)
    {
        if (node == null)
            return 0;

        // Cut off child branches with a negative contribution by clamping them to 0.
        int left = Math.Max(0, Dfs(node.left));
        int right = Math.Max(0, Dfs(node.right));

        // Update the global maximum with the sum of the path that turns (peaks) at this node.
        _maxSum = Math.Max(_maxSum, node.val + left + right);

        // Return a single, non-forking branch to the parent above.
        return node.val + Math.Max(left, right);
    }
}
```

```typescript solution
function maxPathSum(root: TreeNode | null): number {
  let maxSum = -Infinity;

  function dfs(node: TreeNode | null): number {
    if (node === null) return 0;

    const left = Math.max(0, dfs(node.left));
    const right = Math.max(0, dfs(node.right));

    maxSum = Math.max(maxSum, node.val + left + right);

    return node.val + Math.max(left, right);
  }

  dfs(root);
  return maxSum;
}
```

### Complexity

- **Time:** O(n). Every node in the tree is visited exactly once, with O(1) work per node.
- **Space:** O(h). The recursion call stack takes space proportional to the tree's height `h`; O(log n) in a balanced tree, O(n) in a tree that degenerates into a single branch.
