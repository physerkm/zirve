---
title: Binary Tree Vertical Order Traversal
---
You are given the `root` of a binary tree. Return the node values in **vertical order**: column by column, from left to right, and within each column from top to bottom.

The root is in column `0`; a left child's column is one less than its parent's, and a right child's is one more. Two nodes in the same row and column are listed **from left to right**.

### Example 1

```text
Input:  root = [3, 9, 20, null, null, 15, 7]
Output:  [[9], [3, 15], [20], [7]]
```

### Example 2

```text
Input:  root = [3, 9, 8, 4, 0, 1, 7]
Output:  [[4], [9], [3, 0, 1], [8], [7]]
Explanation: 0 and 1 are in the same row and column; 0 comes first because it is on the left.
```

### Example 3

```text
Input:  root = [3, 9, 8, 4, 0, 1, 7, null, null, null, 2, 5]
Output:  [[4], [9, 5], [3, 0, 1], [8, 2], [7]]
```

### Constraints

- The number of nodes is in the range `[0, 100]`.
- `-100 <= Node.val <= 100`

## Hints

- You can compute each node's column from its parent's.
- The order "top to bottom, left to right within the same row" is exactly the order in which **BFS** visits the nodes.
- Keep a column → list of values map and track the smallest and largest columns; at the end, append the columns to the output in order.

## Solution

### BFS with column information

We put `(node, column)` pairs into the queue. BFS visits the nodes level by level, and left to right within each level; each node's value is appended to its column's list. The left child enters the queue with `column - 1`, the right child with `column + 1`.

Because we track the smallest and largest columns, there is no need to sort the dictionary at the end: the lists are appended in order from `minColumn` to `maxColumn`.

With DFS, the row order of nodes in the same column could get mixed up; BFS gives you this ordering for free.

```csharp solution
public class Solution
{
    public IList<IList<int>> VerticalOrder(TreeNode root)
    {
        var result = new List<IList<int>>();
        if (root == null)
        {
            return result;
        }

        var columns = new Dictionary<int, List<int>>();
        var queue = new Queue<(TreeNode Node, int Column)>();
        queue.Enqueue((root, 0));
        var minColumn = 0;
        var maxColumn = 0;

        while (queue.Count > 0)
        {
            var (node, column) = queue.Dequeue();
            if (!columns.TryGetValue(column, out var list))
            {
                list = new List<int>();
                columns[column] = list;
            }

            list.Add(node.val);
            minColumn = Math.Min(minColumn, column);
            maxColumn = Math.Max(maxColumn, column);

            if (node.left != null) queue.Enqueue((node.left, column - 1));
            if (node.right != null) queue.Enqueue((node.right, column + 1));
        }

        for (var c = minColumn; c <= maxColumn; c++)
        {
            result.Add(columns[c]);
        }

        return result;
    }
}
```

```typescript solution
function verticalOrder(root: TreeNode | null): number[][] {
  if (root === null) return [];

  const columns = new Map<number, number[]>();
  const queue: [TreeNode, number][] = [[root, 0]];
  let minColumn = 0;
  let maxColumn = 0;

  for (let head = 0; head < queue.length; head++) {
    const [node, column] = queue[head];
    if (!columns.has(column)) columns.set(column, []);
    columns.get(column)!.push(node.val);
    minColumn = Math.min(minColumn, column);
    maxColumn = Math.max(maxColumn, column);

    if (node.left !== null) queue.push([node.left, column - 1]);
    if (node.right !== null) queue.push([node.right, column + 1]);
  }

  const result: number[][] = [];
  for (let c = minColumn; c <= maxColumn; c++) {
    result.push(columns.get(c)!);
  }

  return result;
}
```

### Complexity

- **Time:** O(n).
- **Space:** O(n).
