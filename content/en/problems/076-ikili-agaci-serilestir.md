---
title: Serialize and Deserialize Binary Tree
---
Serialization is the process of converting a data structure or object into a string format that can be stored in memory or sent over a network, and later rebuilt into exactly the same structure.

Design a `TreeCodec` class that serializes and deserializes a binary tree. For your solution to work with the tests, use the following **preorder (root-left-right), comma-separated `"N"` format**:

- `TreeCodec()` creates the codec object.
- `serialize(root)` traverses the tree in **preorder DFS** order; it writes the node values separated by commas (`,`) and records every `null` (empty) link as `"N"`. For example, the tree `[1, 2, 3]` is serialized as `"1,2,N,N,3,N,N"`, and the empty tree (`[]`) as `"N"`.
- `deserialize(data)` reads a string in the same preorder, comma-separated `"N"` format, rebuilds the original binary tree, and returns its root node.

### Example 1

```text
Input:
  Operations: ["TreeCodec", "serialize", "deserialize"]
  Arguments: [[], [[1, 2, 3, null, null, 4, 5]], ["1,2,N,N,3,4,N,N,5,N,N"]]
Output:
  [null, "1,2,N,N,3,4,N,N,5,N,N", [1, 2, 3, null, null, 4, 5]]
Explanation:
  The preorder traversal starting from root 1 produces, in order, 1, the left subtree (2, N, N) and the right subtree (3, 4, N, N, 5, N, N).
```

### Example 2

```text
Input:
  Operations: ["TreeCodec", "serialize", "deserialize"]
  Arguments: [[], [[]], ["N"]]
Output:
  [null, "N", []]
Explanation:
  The empty tree is serialized as a single "N" token and, when read back, returns null (the empty tree).
```

### Constraints

- The number of nodes in the tree is in the range `[0, 10^4]`.
- `-1000 <= Node.val <= 1000`

## Hints

- A plain preorder output alone is not enough to determine the tree uniquely; but if you explicitly write the empty children (`null`) with a special token such as `"N"`, the tree structure is encoded without any ambiguity.
- In `serialize`, use a `List<string>`: at each node, add the value (or `"N"` if it is `null`) to the list and go down to the left and right children; at the end, return `string.Join(",", list)`.
- In `deserialize`, split the string with `Split(',')` and follow the same preorder sequence with a single `index` variable that tracks the read position.
- If the token you read is `"N"`, return `null`; if it is a number, create a new `TreeNode` and call the same recursive function first for `node.left`, then for `node.right`.

## Solution

Normally a single tree traversal (for example, preorder alone) isn't enough to rebuild the tree, because we can't tell where each node ends. But once we include every empty (`null`) branch in the string as an `"N"` token, the boundaries of leaves and single-child nodes become unambiguous, and **a single preorder DFS** is enough for both writing and reading.

1. **Serialization (`serialize`):** Starting from the root, we proceed in preorder (root → left → right). If the node is `null`, we add `"N"` to the list and return. Otherwise we add the node's value, then serialize the left subtree first and the right subtree after it.
2. **Deserialization (`deserialize`):** We keep an `index` cursor that consumes the comma-separated pieces (`tokens`) in order. If the next piece is `"N"`, we advance the cursor by one and return `null`. Otherwise we read the number and create the root node; since in preorder the whole left subtree comes right after the root, and the whole right subtree right after that, the calls `node.left = Build()` and `node.right = Build()` rebuild the tree completely.

```csharp solution
public class TreeCodec
{
    public TreeCodec()
    {
    }

    public string Serialize(TreeNode root)
    {
        var tokens = new List<string>();
        SerializeDfs(root, tokens);
        return string.Join(",", tokens);
    }

    private void SerializeDfs(TreeNode node, List<string> tokens)
    {
        if (node == null)
        {
            tokens.Add("N");
            return;
        }

        tokens.Add(node.val.ToString());
        SerializeDfs(node.left, tokens);
        SerializeDfs(node.right, tokens);
    }

    public TreeNode Deserialize(string data)
    {
        string[] tokens = data.Split(',');
        int index = 0;
        return DeserializeDfs(tokens, ref index);
    }

    private TreeNode DeserializeDfs(string[] tokens, ref int index)
    {
        string token = tokens[index++];
        if (token == "N")
            return null;

        var node = new TreeNode(int.Parse(token));
        node.left = DeserializeDfs(tokens, ref index);
        node.right = DeserializeDfs(tokens, ref index);
        return node;
    }
}
```

```typescript solution
class TreeCodec {
  constructor() {}

  serialize(root: TreeNode | null): string {
    const tokens: string[] = [];

    function dfs(node: TreeNode | null): void {
      if (node === null) {
        tokens.push("N");
        return;
      }
      tokens.push(String(node.val));
      dfs(node.left);
      dfs(node.right);
    }

    dfs(root);
    return tokens.join(",");
  }

  deserialize(data: string): TreeNode | null {
    const tokens = data.split(",");
    let index = 0;

    function dfs(): TreeNode | null {
      const token = tokens[index++];
      if (token === "N") return null;

      const node = new TreeNode(Number(token));
      node.left = dfs();
      node.right = dfs();
      return node;
    }

    return dfs();
  }
}
```

### Complexity

- **Time:** O(n). In both `serialize` and `deserialize`, each node and each empty link (`N` token) is processed a constant number of times (`2n + 1` pieces in total).
- **Space:** O(n). The token array and the recursion call stack use O(n) memory.
