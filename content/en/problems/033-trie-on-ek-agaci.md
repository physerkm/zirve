---
title: Implement Trie (Prefix Tree)
---
A **trie** (prefix tree) is a tree data structure that stores strings character by character and answers prefix queries quickly. It is used in applications such as autocomplete and spell checking.

Implement the `Trie` class:

- `Trie()` creates an empty trie.
- `insert(word)` inserts the word into the trie.
- `search(word)` returns `true` if the word was **inserted** before, and `false` otherwise.
- `startsWith(prefix)` returns `true` if any previously inserted word starts with `prefix`, and `false` otherwise.

### Example

```text
Operations: Trie, insert("apple"), search("apple"), search("app"), startsWith("app"), insert("app"), search("app")
Output:     null, null,            true,              false,         true,              null,          true
```

### Constraints

- `1 <= word.length, prefix.length <= 2000`
- `word` and `prefix` consist only of lowercase English letters.
- At most `3 * 10^4` calls are made in total.

## Hints

- Let each node represent one character and keep its children by letter (a 26-element array or a hash table).
- `search` and `startsWith` walk the same path. What is the only difference between them?
- Mark the node where a word ends (`isEnd`). The path for "app" is created when "apple" is inserted, but "app" only counts as a word once it is marked.

## Solution

### A child array per letter

Each node holds a 26-element child array and an `isEnd` flag that shows whether a word ends here. The root is an empty node.

- **insert:** Starting from the root, for each letter of the word we move down to the matching child, creating it if it doesn't exist. At the last node we set `isEnd = true`.
- **search / startsWith:** We do the same walk; if a letter has no child, we return `false`. If the path completes, that is enough for `startsWith`; `search` also requires the last node to have `isEnd` set.

```csharp solution
public class Trie
{
    private sealed class Node
    {
        public readonly Node[] Children = new Node[26];
        public bool IsEnd;
    }

    private readonly Node root = new();

    public void Insert(string word)
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
        var node = Walk(word);
        return node != null && node.IsEnd;
    }

    public bool StartsWith(string prefix)
    {
        return Walk(prefix) != null;
    }

    private Node Walk(string text)
    {
        var node = root;
        foreach (var ch in text)
        {
            node = node.Children[ch - 'a'];
            if (node == null)
            {
                return null;
            }
        }

        return node;
    }
}
```

```typescript solution
class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }

    node.isEnd = true;
  }

  search(word: string): boolean {
    const node = this.walk(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix: string): boolean {
    return this.walk(prefix) !== null;
  }

  private walk(text: string): TrieNode | null {
    let node = this.root;
    for (const ch of text) {
      const next = node.children.get(ch);
      if (next === undefined) {
        return null;
      }
      node = next;
    }

    return node;
  }
}
```

### Complexity

- **Time:** O(L) per operation, where `L` is the length of the word or prefix. It doesn't depend on the number of words in the trie.
- **Space:** O(total inserted characters × alphabet size). Shared prefixes are stored only once.

A hash set also does `search` in O(L), but `startsWith` would require scanning every word; the real win of a trie is prefix queries.
