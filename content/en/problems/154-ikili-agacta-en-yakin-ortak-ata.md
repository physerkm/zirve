---
title: Lowest Common Ancestor of a Binary Tree
---
You are given the root `root` of a binary tree and the values `p` and `q` of two distinct nodes that are guaranteed to exist in the tree. All node values in the tree are distinct. Return the value of the **lowest common ancestor** (LCA) of these two nodes.

The lowest common ancestor of two nodes `p` and `q` in a binary tree is defined as the **deepest** node that has both `p` and `q` in its subtree. In this definition, **a node can be considered an ancestor (or descendant) of itself**; that is, if node `q` is in the subtree of `p`, the common ancestor is `p` itself.

### Example 1

```text
Input:  root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 5, q = 1
Output:  3
Explanation: The lowest common ancestor of nodes 5 and 1 is the root node, 3.
```

### Example 2

```text
Input:  root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 5, q = 4
Output:  5
Explanation: Node 4 is in the subtree of node 5. Since a node can be its own ancestor, the lowest common ancestor is 5.
```

### Example 3

```text
Input:  root = [1, 2], p = 1, q = 2
Output:  1
Explanation: Node 2 is the left child of 1; the common ancestor is 1.
```

### Constraints

- The number of nodes in the tree is in the range `[2, 10^5]`.
- `-10^9 <= Node.val <= 10^9`
- All `Node.val` values are **unique**.
- `p != q`
- The nodes with values `p` and `q` definitely exist in the tree.

## Hints

- This tree is **not** a binary search tree (BST); you cannot choose a direction by comparing node values.
- Think of a bottom-up (postorder) DFS in which each node tells its parent "was `p` or `q` found in my subtree?"
- If a node's value equals `p` or `q`, do you need to go any deeper? Even if the other target node is below this one, the answer will be this node anyway.
- If both the left and the right subtree of a node return a non-`null` result, the two targets meet for the first time at this node.

## Solution

Since the tree is not a binary search tree, we start at the root and scan both the left and right subtrees with depth-first search (DFS). The helper function `FindLca(node, p, q)` answers this question at each node: *"Does this subtree contain `p`, `q`, or their common ancestor?"*

1. **Base case:** If `node == null`, we return `null`. If `node.val == p` or `node.val == q`, we have reached one of the nodes we are looking for; we return `node` directly without going any lower (because even if the other node is below it, the common ancestor will still be this `node`).
2. **Recursion:** We search the left (`left`) and right (`right`) subtrees recursively.
3. **Combine (postorder):**
   - If both `left` and `right` are non-`null`, one target was found on the left and the other on the right. The first place they meet is the current `node`, so we return `node`.
   - If only one of them is non-`null`, we return `left ?? right` to pass the found node (or a common ancestor found further down) up the tree.

```csharp solution
public class Solution
{
    public int LowestCommonAncestor(TreeNode root, int p, int q)
    {
        return FindLca(root, p, q).val;
    }

    private TreeNode FindLca(TreeNode node, int p, int q)
    {
        // If the node is empty or we have reached one of the targets, return it directly.
        if (node == null || node.val == p || node.val == q)
            return node;

        TreeNode left = FindLca(node.left, p, q);
        TreeNode right = FindLca(node.right, p, q);

        // If both the left and right subtrees returned a target, this node is the common ancestor.
        if (left != null && right != null)
            return node;

        // If a result came from only one side, carry it upward.
        return left ?? right;
    }
}
```

```typescript solution
function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number {
  function findLca(node: TreeNode | null): TreeNode | null {
    if (node === null || node.val === p || node.val === q) {
      return node;
    }

    const left = findLca(node.left);
    const right = findLca(node.right);

    if (left !== null && right !== null) {
      return node;
    }

    return left ?? right;
  }

  return findLca(root)!.val;
}
```

### Complexity

- **Time:** O(n). In the worst case, each node in the tree is visited at most once.
- **Space:** O(h), where `h` is the height of the tree. The recursion call stack takes O(log n) space in a balanced tree and at most O(n) in an unbalanced tree shaped like a single line.
