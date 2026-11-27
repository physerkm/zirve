---
title: Construct Binary Tree from Preorder and Inorder Traversal
---
You are given `preorder` and `inorder`, the **preorder** (root, left, right) and **inorder** (left, root, right) traversal arrays of a binary tree. Build the tree and return its root.

All values in the tree are distinct.

### Example 1

```text
Input:  preorder = [3, 9, 20, 15, 7], inorder = [9, 3, 15, 20, 7]
Output: [3, 9, 20, null, null, 15, 7]
```

### Example 2

```text
Input:  preorder = [-1], inorder = [-1]
Output: [-1]
```

### Constraints

- `1 <= preorder.length <= 3000`
- `inorder.length == preorder.length`
- `-3000 <= preorder[i], inorder[i] <= 3000`
- The values are distinct, and both arrays belong to the same tree.

## Hints

- The first element of the preorder array is always the root.
- The root's position in the inorder array tells you that the elements to its left form the left subtree and those to its right form the right subtree.
- Instead of searching for the root's inorder position every time, use a `value → index` hash table; and consume preorder with a single increasing index.

## Solution

### Recursive splitting

In preorder, the roots come in order: first the root of the tree, then the entire preorder of the left subtree, then that of the right subtree. That's why we consume preorder from left to right with a single `preIndex`.

`Build(lo, hi)` builds a subtree from the values in the range `[lo, hi]` of the inorder array:

1. If the range is empty (`lo > hi`), it returns `null`.
2. `preorder[preIndex++]` is the root of this subtree. The root's inorder position `mid` is found in O(1) from the hash table.
3. First the **left** subtree is built with `[lo, mid - 1]`, then the right subtree with `[mid + 1, hi]`. The order matters: preorder gives the roots of the left subtree first.

```csharp solution
public class Solution
{
    private int[] preorder;
    private Dictionary<int, int> inorderIndex;
    private int preIndex;

    public TreeNode BuildTree(int[] preorder, int[] inorder)
    {
        this.preorder = preorder;
        preIndex = 0;
        inorderIndex = new Dictionary<int, int>();
        for (var i = 0; i < inorder.Length; i++)
        {
            inorderIndex[inorder[i]] = i;
        }

        return Build(0, inorder.Length - 1);
    }

    private TreeNode Build(int lo, int hi)
    {
        if (lo > hi)
        {
            return null;
        }

        var root = new TreeNode(preorder[preIndex++]);
        var mid = inorderIndex[root.val];
        root.left = Build(lo, mid - 1);
        root.right = Build(mid + 1, hi);
        return root;
    }
}
```

```typescript solution
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  const inorderIndex = new Map<number, number>();
  inorder.forEach((value, i) => inorderIndex.set(value, i));
  let preIndex = 0;

  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) {
      return null;
    }

    const root = new TreeNode(preorder[preIndex++]);
    const mid = inorderIndex.get(root.val)!;
    root.left = build(lo, mid - 1);
    root.right = build(mid + 1, hi);
    return root;
  };

  return build(0, inorder.length - 1);
}
```

### Complexity

- **Time:** O(n). Each node is created once; the root position is found in constant time from the hash table.
- **Space:** O(n). The hash table, plus recursion up to O(n) deep in the worst case.
