---
title: Design Add and Search Words Data Structure
---
Design a data structure that can add words and tell whether a string matches any previously added word. In the search string, the **`.`** character can match any letter.

Implement the `WordDictionary` class:

- `WordDictionary()` creates an empty dictionary.
- `addWord(word)` adds the word to the dictionary.
- `search(word)` returns `true` if any added word matches `word`, otherwise `false`. The `.` characters in `word` match any letter.

### Example

```text
Operations: WordDictionary, addWord("bad"), addWord("dad"), addWord("mad"), search("pad"), search("bad"), search(".ad"), search("b..")
Output:     null,           null,           null,           null,           false,          true,           true,           true
```

### Constraints

- `1 <= word.length <= 25`
- For `addWord`, `word` consists of lowercase letters; for `search`, it consists of lowercase letters and the `.` character.
- The strings in `search` calls contain at most 2 `.` characters.
- At most `10^4` calls will be made in total.

## Hints

- Store the words in a trie. Without the wildcard, a search would just be walking a single path in the trie.
- At a `.` character, you can't know which child to go down into. You have to try them all.
- Write the search recursively as `Dfs(node, index)`: for a letter go down into the single child, for `.` go down into all children; if any of them returns `true`, return `true`.

## Solution

### DFS over a trie

`addWord` is a normal trie insertion. `search` is a recursive DFS:

- If `i == word.Length`, we have reached the end of the word; there is a match if the node is the end of a word (`isEnd`).
- If `word[i]` is a letter, we go down only into that letter's child; if the child doesn't exist, this branch fails.
- If `word[i] == '.'`, **all** existing children are tried; if one succeeds, the search returns `true`.

```csharp solution
public class WordDictionary
{
    private sealed class Node
    {
        public readonly Node[] Children = new Node[26];
        public bool IsEnd;
    }

    private readonly Node root = new();

    public void AddWord(string word)
    {
        var node = root;
        foreach (var ch in word)
        {
            var i = ch - 'a';
            node.Children[i] ??= new Node();
            node = node.Children[i];
        }

        node.IsEnd = true;
    }

    public bool Search(string word)
    {
        return Dfs(root, word, 0);
    }

    private static bool Dfs(Node node, string word, int i)
    {
        if (i == word.Length)
        {
            return node.IsEnd;
        }

        if (word[i] != '.')
        {
            var child = node.Children[word[i] - 'a'];
            return child != null && Dfs(child, word, i + 1);
        }

        foreach (var child in node.Children)
        {
            if (child != null && Dfs(child, word, i + 1))
            {
                return true;
            }
        }

        return false;
    }
}
```

```typescript solution
class WordNode {
  children = new Map<string, WordNode>();
  isEnd = false;
}

class WordDictionary {
  private root = new WordNode();

  addWord(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (next === undefined) {
        next = new WordNode();
        node.children.set(ch, next);
      }
      node = next;
    }

    node.isEnd = true;
  }

  search(word: string): boolean {
    const dfs = (node: WordNode, i: number): boolean => {
      if (i === word.length) {
        return node.isEnd;
      }

      if (word[i] !== '.') {
        const child = node.children.get(word[i]);
        return child !== undefined && dfs(child, i + 1);
      }

      for (const child of node.children.values()) {
        if (dfs(child, i + 1)) {
          return true;
        }
      }

      return false;
    };

    return dfs(this.root, 0);
  }
}
```

### Complexity

- **Time:** `addWord` O(L). `search` is O(L) without wildcards; with `d` dots, O(26^d × L) in the worst case.
- **Space:** O(total characters) for the trie and O(L) for the recursion stack.

The constraint that there are at most 2 `.` characters guarantees that the branching stays limited.
