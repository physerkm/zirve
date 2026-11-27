---
title: Count Good Nodes in Binary Tree
---
You are given `root`, the root of a binary tree. A node `X` is a **good node** if the path from the root to `X` contains **no node with a value greater than `X`**.

Return the number of good nodes in the tree.

### Example 1

```text
Input:  root = [3, 1, 4, 3, null, 1, 5]
Output: 4
Explanation: The root (3) is always good. 4 (path 3→4), 5 (path 3→4→5) and the 3 at the bottom left (path 3→1→3) are good.
The 1 on the right (path 3→4→1) is not good.
```

### Example 2

```text
Input:  root = [3, 3, null, 4, 2]
Output: 3
Explanation: 2 is not good because the 3 on its path is greater than it.
```

### Constraints

- The number of nodes is in the range `[1, 10^5]`.
- `-10^4 <= Node.val <= 10^4`

## Hints

- To tell whether a node is good, you don't need the whole path, only the **largest** value on it.
- As you go down with DFS, carry the maximum so far as a parameter.

## Solution

### A DFS that carries the maximum

`Dfs(node, maxSoFar)` knows the largest value seen on the way from the root to `node`:

- If `node.val >= maxSoFar`, the node is good (equality counts too: there is no **greater** value on the path).
- When going down to the children, the maximum is updated to `max(maxSoFar, node.val)`.

The initial maximum for the root is the root's own value; this way the root always counts as good.

```csharp solution
public class Solution
{
    public int GoodNodes(TreeNode root)
    {
        return Dfs(root, root.val);
    }

    private static int Dfs(TreeNode node, int maxSoFar)
    {
        if (node == null)
        {
            return 0;
        }

        var good = node.val >= maxSoFar ? 1 : 0;
        var next = Math.Max(maxSoFar, node.val);
        return good + Dfs(node.left, next) + Dfs(node.right, next);
    }
}
```

```typescript solution
function goodNodes(root: TreeNode | null): number {
  const dfs = (node: TreeNode | null, maxSoFar: number): number => {
    if (node === null) {
      return 0;
    }

    const good = node.val >= maxSoFar ? 1 : 0;
    const next = Math.max(maxSoFar, node.val);
    return good + dfs(node.left, next) + dfs(node.right, next);
  };

  return root === null ? 0 : dfs(root, root.val);
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(h) recursion stack.

"Carrying information from the root down through a parameter" is the same pattern as the bounds passing used to validate a binary search tree.
