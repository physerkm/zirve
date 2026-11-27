---
title: Kth Smallest Element in a BST
---
You are given `root`, the root of a binary search tree (BST), and an integer `k`. Return the **`k`th smallest** value among the values in the tree (`k` is 1-indexed).

### Example 1

```text
Input:  root = [3, 1, 4, null, 2], k = 1
Output: 1
```

### Example 2

```text
Input:  root = [5, 3, 6, 2, 4, null, null, 1], k = 3
Output: 3
```

### Constraints

- The number of nodes is `n`, `1 <= k <= n <= 10^4`
- `0 <= Node.val <= 10^4`

**Follow-up:** If the BST is modified often and you need to find the kth smallest element frequently, how would you optimize it?

## Hints

- Traversing a BST **in-order** (left, root, right) yields the values from smallest to largest.
- You don't need to collect all the values into a list: keep a counter during the in-order traversal and stop at the `k`th node.
- For an iterative in-order traversal, use a stack: first go left as far as you can.

## Solution

### Iterative in-order traversal with a stack

`current` starts at the root. In each round:

1. Go left until `current` is `null`, pushing the visited nodes onto the stack.
2. Pop the top of the stack: this is the **smallest** value not yet processed. Increment the counter; if it reaches `k`, this node is the answer.
3. `current` becomes this node's right child; the values in the right subtree are the next smallest values.

Because we stop early, only `k` nodes (and their left chains) are processed.

```csharp solution
public class Solution
{
    public int KthSmallest(TreeNode root, int k)
    {
        var stack = new Stack<TreeNode>();
        var current = root;

        while (current != null || stack.Count > 0)
        {
            while (current != null)
            {
                stack.Push(current);
                current = current.left;
            }

            current = stack.Pop();
            k--;
            if (k == 0)
            {
                return current.val;
            }

            current = current.right;
        }

        return -1;
    }
}
```

```typescript solution
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let current = root;

  while (current !== null || stack.length > 0) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop()!;
    k--;
    if (k === 0) {
      return current.val;
    }

    current = current.right;
  }

  return -1;
}
```

### Complexity

- **Time:** O(h + k). First we go left as deep as the height, then `k` nodes are popped.
- **Space:** O(h). The stack holds at most as many nodes as one root-to-leaf path.

For the follow-up, store the **subtree size** at each node: if the left subtree has `k - 1` nodes, the answer is the root; if it has more, go left; if fewer, go right (decreasing k). Updates and queries become O(h).
