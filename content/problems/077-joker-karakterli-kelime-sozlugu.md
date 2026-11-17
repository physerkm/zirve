---
title: Joker Karakterli Kelime Sözlüğü
difficulty: medium
tags: [trie, tasarim, dfs, dizgi]
kind: class
class: WordDictionary
constructor: []
methods:
  - { name: addWord, params: [{ name: word, type: "string" }], returns: "void" }
  - { name: search, params: [{ name: word, type: "string" }], returns: "bool" }
---
Kelime ekleyebilen ve bir dizginin daha önce eklenmiş herhangi bir kelimeyle eşleşip eşleşmediğini söyleyebilen bir veri yapısı tasarlayın. Aranan dizgide **`.`** karakteri herhangi bir harfle eşleşebilir.

`WordDictionary` sınıfını gerçekleştirin:

- `WordDictionary()` boş bir sözlük oluşturur.
- `addWord(word)` kelimeyi sözlüğe ekler.
- `search(word)` eklenmiş kelimelerden biri `word` ile eşleşiyorsa `true`, değilse `false` döndürür. `word` içindeki `.` karakterleri herhangi bir harfle eşleşir.

### Örnek

```text
İşlemler:  WordDictionary, addWord("bad"), addWord("dad"), addWord("mad"), search("pad"), search("bad"), search(".ad"), search("b..")
Çıktı:     null,           null,           null,           null,           false,          true,           true,           true
```

### Kısıtlar

- `1 <= word.length <= 25`
- `addWord` için `word` küçük harflerden; `search` için küçük harfler ve `.` karakterinden oluşur.
- `search` çağrılarındaki dizgilerde en fazla 2 tane `.` bulunur.
- Toplamda en fazla `10^4` çağrı yapılır.

## İpuçları

- Kelimeleri bir trie'de saklayın. Joker karakter olmasaydı arama, trie'de tek bir yol yürümekten ibaret olurdu.
- `.` karakterinde hangi çocuğa ineceğinizi bilemezsiniz. Hepsini denemeniz gerekir.
- Aramayı `Dfs(düğüm, indeks)` olarak özyinelemeli yazın: harfte tek çocuğa, `.`'da bütün çocuklara inin; herhangi biri `true` dönerse `true`.

## Çözüm

### Trie üzerinde DFS

`addWord` normal trie eklemesidir. `search` özyinelemeli bir DFS'tir:

- `i == word.Length` ise kelimenin sonuna gelmişizdir; düğüm bir kelimenin sonuysa (`isEnd`) eşleşme vardır.
- `word[i]` bir harfse yalnızca o harfin çocuğuna inilir; çocuk yoksa bu dal başarısızdır.
- `word[i] == '.'` ise var olan **bütün** çocuklar denenir; biri başarılı olursa arama `true` döner.

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

### Karmaşıklık

- **Zaman:** `addWord` O(L). `search` joker yoksa O(L); `.` sayısı `d` ise en kötü durumda O(26^d × L).
- **Alan:** O(toplam karakter) trie ve O(L) özyineleme yığını.

Kısıtta `.` sayısının en fazla 2 olması, dallanmanın sınırlı kaldığını garanti eder.

## Testler

```json
[
  {
    "ops": ["WordDictionary", "addWord", "addWord", "addWord", "search", "search", "search", "search"],
    "args": [[], ["bad"], ["dad"], ["mad"], ["pad"], ["bad"], [".ad"], ["b.."]],
    "expected": [null, null, null, null, false, true, true, true],
    "sample": true
  },
  {
    "ops": ["WordDictionary", "search", "addWord", "search", "search", "search", "search"],
    "args": [[], ["a"], ["a"], ["."], [".."], ["a"], ["b"]],
    "expected": [null, false, null, true, false, true, false]
  },
  {
    "ops": ["WordDictionary", "addWord", "addWord", "search", "search", "search", "search"],
    "args": [[], ["at"], ["and"], ["a."], ["an."], ["..."], ["...."]],
    "expected": [null, null, null, true, true, true, false]
  }
]
```
