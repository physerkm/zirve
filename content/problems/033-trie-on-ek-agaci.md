---
title: Trie (Ön Ek Ağacı) Gerçekleştir
difficulty: medium
tags: [trie, tasarim, hash-tablosu, dizgi]
kind: class
class: Trie
constructor: []
methods:
  - { name: insert, params: [{ name: word, type: "string" }], returns: "void" }
  - { name: search, params: [{ name: word, type: "string" }], returns: "bool" }
  - { name: startsWith, params: [{ name: prefix, type: "string" }], returns: "bool" }
---
**Trie** (ön ek ağacı), dizgileri karakter karakter saklayan ve ön ek sorgularını hızlı yanıtlayan bir ağaç veri yapısıdır. Otomatik tamamlama ve yazım denetimi gibi uygulamalarda kullanılır.

`Trie` sınıfını gerçekleştirin:

- `Trie()` boş bir trie oluşturur.
- `insert(word)` kelimeyi trie'ye ekler.
- `search(word)` kelime daha önce **eklenmişse** `true`, değilse `false` döndürür.
- `startsWith(prefix)` daha önce eklenmiş kelimelerden biri `prefix` ile başlıyorsa `true`, değilse `false` döndürür.

### Örnek

```text
İşlemler:  Trie, insert("apple"), search("apple"), search("app"), startsWith("app"), insert("app"), search("app")
Çıktı:     null, null,            true,              false,         true,              null,          true
```

### Kısıtlar

- `1 <= word.length, prefix.length <= 2000`
- `word` ve `prefix` yalnızca küçük İngilizce harflerden oluşur.
- Toplamda en fazla `3 * 10^4` çağrı yapılır.

## İpuçları

- Her düğüm bir karakteri temsil etsin ve çocuklarını harfe göre tutsun (26 elemanlı dizi ya da hash tablosu).
- `search` ile `startsWith` aynı yolu yürür. Aralarındaki tek fark nedir?
- Bir kelimenin bittiği düğümü işaretleyin (`isEnd`). "app" yolu "apple" eklenince oluşur, ama "app" ancak işaretlenince kelime sayılır.

## Çözüm

### Harf başına çocuk dizisi

Her düğüm 26 elemanlı bir çocuk dizisi ve kelimenin burada bitip bitmediğini gösteren `isEnd` bayrağı tutar. Kök boş bir düğümdür.

- **insert:** Kökten başlayıp kelimenin her harfi için ilgili çocuğa ineriz; çocuk yoksa oluştururuz. Son düğümde `isEnd = true`.
- **search / startsWith:** Aynı yürüyüş yapılır; bir harfin çocuğu yoksa `false`. Yol tamamlanırsa `startsWith` için bu yeterlidir; `search` ayrıca son düğümün `isEnd` olmasını ister.

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

### Karmaşıklık

- **Zaman:** Her işlem O(L); `L` kelimenin ya da ön ekin uzunluğudur. Trie'deki kelime sayısından bağımsızdır.
- **Alan:** O(toplam eklenen karakter × alfabe). Ortak ön ekler bir kez saklanır.

Hash kümesi `search`'ü de O(L)'de yapar ama `startsWith` için bütün kelimeleri gezmek gerekir; trie'nin asıl kazancı ön ek sorgularıdır.

## Testler

```json
[
  {
    "ops": ["Trie", "insert", "search", "search", "startsWith", "insert", "search"],
    "args": [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]],
    "expected": [null, null, true, false, true, null, true],
    "sample": true
  },
  {
    "ops": ["Trie", "search", "startsWith", "insert", "startsWith", "search", "search"],
    "args": [[], ["a"], ["a"], ["a"], ["a"], ["a"], ["ab"]],
    "expected": [null, false, false, null, true, true, false]
  },
  {
    "ops": ["Trie", "insert", "insert", "search", "search", "startsWith", "startsWith", "search"],
    "args": [[], ["car"], ["card"], ["car"], ["ca"], ["card"], ["cart"], ["card"]],
    "expected": [null, null, null, true, false, true, false, true]
  }
]
```
