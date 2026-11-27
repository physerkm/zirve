---
title: Word Search II
---
You are given an `m x n` grid of letters `board` and a list of words `words`. Return **all the words** that can be found in the grid.

A word is formed by following letters in horizontally or vertically **adjacent** cells in sequence. The same cell may not be used more than once in a word. The result can be in any order.

### Example 1

```text
Input:  board = [["o","a","a","n"],
                 ["e","t","a","e"],
                 ["i","h","k","r"],
                 ["i","f","l","v"]],
        words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]
```

### Example 2

```text
Input:  board = [["a","b"],["c","d"]], words = ["abcb"]
Output: []
```

### Constraints

- `1 <= m, n <= 12`
- `board[i][j]` is a lowercase English letter.
- `1 <= words.length <= 3 * 10^4`
- `1 <= words[i].length <= 10`
- The words in `words` are distinct.

## Hints

- Running "Word Search" separately for each word is far too slow when there are many words.
- Put all the words into a trie. While doing DFS on the grid, advance through the trie at the same time: if the current path is not a prefix of any word, backtrack immediately.
- If you store the found word in its trie node and delete it once found, the same word won't be added twice.

## Solution

### Backtracking pruned with a trie

1. All the words are inserted into a trie; the node where a word ends stores the word itself.
2. A DFS is started from every cell. When the DFS enters a cell in the grid, it also goes down to that letter's child in the trie. If there is no child, the current path is not a prefix of any word and the branch is **pruned**.
3. If the reached node holds a word, it is added to the result and the word in the node is deleted (so the same word isn't added again).
4. While being visited, the cell is marked with `'#'`, and on the way back it is restored to its original letter.

```csharp solution
public class Solution
{
    private sealed class Node
    {
        public readonly Node[] Children = new Node[26];
        public string Word;
    }

    public IList<string> FindWords(char[][] board, string[] words)
    {
        var root = new Node();
        foreach (var word in words)
        {
            var node = root;
            foreach (var ch in word)
            {
                node.Children[ch - 'a'] ??= new Node();
                node = node.Children[ch - 'a'];
            }

            node.Word = word;
        }

        var found = new List<string>();
        for (var r = 0; r < board.Length; r++)
        {
            for (var c = 0; c < board[0].Length; c++)
            {
                Dfs(board, r, c, root, found);
            }
        }

        return found;
    }

    private static void Dfs(char[][] board, int r, int c, Node parent, List<string> found)
    {
        if (r < 0 || c < 0 || r >= board.Length || c >= board[0].Length)
        {
            return;
        }

        var ch = board[r][c];
        if (ch == '#' || parent.Children[ch - 'a'] == null)
        {
            return;
        }

        var node = parent.Children[ch - 'a'];
        if (node.Word != null)
        {
            found.Add(node.Word);
            node.Word = null;
        }

        board[r][c] = '#';
        Dfs(board, r + 1, c, node, found);
        Dfs(board, r - 1, c, node, found);
        Dfs(board, r, c + 1, node, found);
        Dfs(board, r, c - 1, node, found);
        board[r][c] = ch;
    }
}
```

```typescript solution
class BoardTrieNode {
  children = new Map<string, BoardTrieNode>();
  word: string | null = null;
}

function findWords(board: string[][], words: string[]): string[] {
  const root = new BoardTrieNode();
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (next === undefined) {
        next = new BoardTrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.word = word;
  }

  const found: string[] = [];
  const rows = board.length;
  const cols = board[0].length;

  const dfs = (r: number, c: number, parent: BoardTrieNode): void => {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    const ch = board[r][c];
    const node = parent.children.get(ch);
    if (ch === '#' || node === undefined) return;

    if (node.word !== null) {
      found.push(node.word);
      node.word = null;
    }

    board[r][c] = '#';
    dfs(r + 1, c, node);
    dfs(r - 1, c, node);
    dfs(r, c + 1, node);
    dfs(r, c - 1, node);
    board[r][c] = ch;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, root);
    }
  }

  return found;
}
```

### Complexity

- **Time:** O(m × n × 4 × 3^(L-1)) in the worst case, where `L` is the length of the longest word. In practice, trie pruning shortens the search dramatically and makes it nearly independent of the number of words.
- **Space:** O(total word length) for the trie and O(L) for the recursion stack.

As a further optimization, trie nodes whose word has been found and that have no children left can be deleted; this way the same prefix isn't entered over and over.
