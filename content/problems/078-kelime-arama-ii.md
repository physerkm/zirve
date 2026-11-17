---
title: Kelime Arama II
difficulty: hard
tags: [trie, geri-izleme, matris, dfs]
function: findWords
params:
  - { name: board, type: "char[][]" }
  - { name: words, type: "string[]" }
returns: "List<string>"
compare: unordered
---
`m x n` boyutunda harflerden oluşan bir ızgara `board` ve bir kelime listesi `words` veriliyor. Izgarada bulunabilen **bütün kelimeleri** döndürün.

Bir kelime, yatay ya da dikey olarak **komşu** hücrelerdeki harfler sırayla izlenerek oluşturulur. Aynı hücre bir kelimede birden fazla kez kullanılamaz. Sonuç herhangi bir sırada olabilir.

### Örnek 1

```text
Girdi:  board = [["o","a","a","n"],
                 ["e","t","a","e"],
                 ["i","h","k","r"],
                 ["i","f","l","v"]],
        words = ["oath","pea","eat","rain"]
Çıktı:  ["eat","oath"]
```

### Örnek 2

```text
Girdi:  board = [["a","b"],["c","d"]], words = ["abcb"]
Çıktı:  []
```

### Kısıtlar

- `1 <= m, n <= 12`
- `board[i][j]` küçük bir İngilizce harftir.
- `1 <= words.length <= 3 * 10^4`
- `1 <= words[i].length <= 10`
- `words` içindeki kelimeler birbirinden farklıdır.

## İpuçları

- Her kelime için ayrı ayrı "Kelime Arama" çalıştırmak, kelime sayısı büyük olduğunda çok yavaştır.
- Bütün kelimeleri bir trie'ye koyun. Izgarada DFS yaparken trie'de de aynı anda ilerleyin: mevcut yol hiçbir kelimenin ön eki değilse hemen geri dönün.
- Bulunan kelimeyi trie düğümünde tutup bulunduktan sonra silerseniz aynı kelime iki kez eklenmez.

## Çözüm

### Trie ile budanan geri izleme

1. Bütün kelimeler bir trie'ye eklenir; kelimenin bittiği düğümde kelimenin kendisi saklanır.
2. Her hücreden bir DFS başlatılır. DFS, ızgarada bir hücreye girdiğinde trie'de de o harfin çocuğuna iner. Çocuk yoksa mevcut yol hiçbir kelimenin ön eki değildir ve dal **budanır**.
3. Ulaşılan düğümde bir kelime varsa sonuca eklenir ve düğümdeki kelime silinir (aynı kelime tekrar eklenmesin diye).
4. Hücre ziyaret süresince `'#'` ile işaretlenir ve dönüşte eski harfine geri döndürülür.

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

### Karmaşıklık

- **Zaman:** En kötü durumda O(m × n × 4 × 3^(L-1)); `L` en uzun kelimenin uzunluğu. Trie budaması pratikte aramayı büyük ölçüde kısaltır ve kelime sayısından neredeyse bağımsız kılar.
- **Alan:** O(toplam kelime uzunluğu) trie ve O(L) özyineleme yığını.

Ek bir iyileştirme olarak, kelimesi bulunmuş ve çocuğu kalmamış trie düğümleri silinebilir; böylece aynı ön eke tekrar tekrar girilmez.

## Testler

```json
[
  {
    "args": [[["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], ["oath", "pea", "eat", "rain"]],
    "expected": ["eat", "oath"],
    "sample": true
  },
  { "args": [[["a", "b"], ["c", "d"]], ["abcb"]], "expected": [], "sample": true },
  { "args": [[["a"]], ["a"]], "expected": ["a"] },
  {
    "args": [[["a", "b"], ["c", "d"]], ["ab", "cb", "ad", "bd", "ac", "ca", "da", "bc", "db", "adcb", "dabc", "abb", "acb"]],
    "expected": ["ab", "bd", "ac", "ca", "db"]
  },
  { "args": [[["a", "a"]], ["aaa"]], "expected": [] },
  { "args": [[["a", "b", "c"], ["a", "e", "d"], ["a", "f", "g"]], ["abcdefg", "gfedcbaaa", "eaabcdgfa", "befa", "dgc", "ade"]], "expected": ["abcdefg", "befa", "eaabcdgfa", "gfedcbaaa"] }
]
```
