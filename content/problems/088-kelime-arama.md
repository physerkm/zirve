---
title: Kelime Arama
difficulty: medium
tags: [geri-izleme, matris, dfs]
function: exist
params:
  - { name: board, type: "char[][]" }
  - { name: word, type: "string" }
returns: "bool"
---
`m x n` boyutlarında karakterlerden oluşan bir ızgara (`board`) ve bir dizgi (`word`) veriliyor. Eğer `word` ızgara içinde mevcutsa `true`, aksi halde `false` döndürün.

Kelime, yatay veya dikey olarak komşu (yukarı, aşağı, sol, sağ) hücrelerdeki harflerin ardışık olarak birleştirilmesiyle oluşturulmalıdır. **Aynı hücredeki harf tek bir kelime içinde birden fazla kez kullanılamaz.**

### Örnek 1

```text
Girdi:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Çıktı:  true
Açıklama: (0,0) -> (0,1) -> (0,2) -> (1,2) -> (2,2) -> (2,1) yolu "ABCCED" kelimesini oluşturur.
```

### Örnek 2

```text
Girdi:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Çıktı:  true
Açıklama: (1,3) -> (2,3) -> (2,2) yolu "SEE" kelimesini oluşturur.
```

### Örnek 3

```text
Girdi:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"
Çıktı:  false
Açıklama: (0,1) konumundaki 'B' harfi aynı yol üzerinde ikinci kez kullanılamaz.
```

### Kısıtlar

- `m == board.length`
- `n == board[i].length`
- `1 <= m, n <= 6`
- `1 <= word.length <= 15`
- `board` ve `word` yalnızca büyük ve küçük İngilizce harflerden oluşur.

## İpuçları

- Izgaradaki her `(r, c)` hücresini kelimenin ilk harfi (`word[0]`) için olası bir başlangıç noktası olarak deneyin.
- Bulunduğunuz hücreden 4 komşu yöne (yukarı, aşağı, sol, sağ) derinlik öncelikli arama (DFS) yaparak `word[k]` harfini eşleştirmeye çalışın.
- Aynı hücreye kendi yolunuz üzerinde tekrar basmamak için, hücreye girdiğinizde değerini geçici olarak özel bir karakterle (örneğin `'#'`) işaretleyin.
- Komşu dalların araması bittiğinde (geri dönerken) hücrenin orijinal harfini mutlaka geri koyun (geri izleme / backtrack).

## Çözüm

Izgaradaki her `(r, c)` hücresinden başlayarak `Dfs(r, c, k)` özyinelemeli fonksiyonunu çağırırız. Burada `k`, `word` içinde aradığımız sıradaki karakterin indeksidir.

1. **Başarı Durumu:** `k == word.Length` olduysa kelimenin tüm karakterleri sırasıyla eşleşmiştir; `true` döndürürüz.
2. **Sınır ve Eşleşme Kontrolü:** `(r, c)` koordinatı ızgara sınırları dışındaysa veya `board[r][c] != word[k]` ise bu yol geçersizdir; `false` döndürürüz (`board[r][c]` daha önce ziyaret edilip `'#'` yapıldıysa da bu kontrolde otomatik olarak elenir).
3. **Ziyaret İşaretleme ve Geri İzleme:** Ek bir `visited` matrisi ayırmak yerine, mevcut hücrenin karakterini `char saved = board[r][c]` ile saklayıp `board[r][c] = '#'` olarak işaretleriz. Ardından 4 komşu hücre için `Dfs(..., k + 1)` çağrısı yaparız. Dallardan herhangi biri `true` dönerse kelime bulunmuştur. Fonksiyondan çıkmadan önce `board[r][c] = saved` atamasıyla ızgarayı eski haline döndürürüz ki başka başlangıç noktaları veya farklı dallar bu hücreyi kullanabilsin.

```csharp solution
public class Solution
{
    public bool Exist(char[][] board, string word)
    {
        int rows = board.Length;
        int cols = board[0].Length;

        bool Dfs(int r, int c, int k)
        {
            if (k == word.Length)
                return true;

            if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] != word[k])
                return false;

            // Aynı hücreyi tekrar kullanmamak için geçici olarak işaretle.
            char saved = board[r][c];
            board[r][c] = '#';

            bool found = Dfs(r + 1, c, k + 1)
                      || Dfs(r - 1, c, k + 1)
                      || Dfs(r, c + 1, k + 1)
                      || Dfs(r, c - 1, k + 1);

            // Geri izleme: hücrenin eski harfini geri koy.
            board[r][c] = saved;
            return found;
        }

        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (Dfs(r, c, 0))
                    return true;
            }
        }

        return false;
    }
}
```

```typescript solution
function exist(board: string[][], word: string): boolean {
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r: number, c: number, k: number): boolean {
    if (k === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[k]) {
      return false;
    }

    const saved = board[r][c];
    board[r][c] = "#";

    const found =
      dfs(r + 1, c, k + 1) ||
      dfs(r - 1, c, k + 1) ||
      dfs(r, c + 1, k + 1) ||
      dfs(r, c - 1, k + 1);

    board[r][c] = saved;
    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }

  return false;
}
```

### Karmaşıklık

- **Zaman:** O(M * N * 4^L). Burada `M` ve `N` ızgaranın boyutları, `L` ise `word` kelimesinin uzunluğudur. Her hücreden başlayan DFS en fazla `L` derinliğe iner ve her adımda en fazla 4 (ilk adımdan sonra geldiği yön elendiği için 3) yöne dallanır.
- **Alan:** O(L). Izgara yerinde (`in-place`) işaretlendiği için ek matris kullanılmaz; yalnızca özyineleme çağrı yığını kelime uzunluğu `L` kadar yer kaplar.

## Testler

```json
[
  {
    "args": [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCCED"],
    "expected": true,
    "sample": true
  },
  {
    "args": [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "SEE"],
    "expected": true,
    "sample": true
  },
  {
    "args": [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCB"],
    "expected": false,
    "sample": true
  },
  {
    "args": [[["A"]], "A"],
    "expected": true
  },
  {
    "args": [[["A"]], "B"],
    "expected": false
  },
  {
    "args": [[["A", "B"], ["C", "D"]], "ACDB"],
    "expected": true
  },
  {
    "args": [[["A", "B"], ["C", "D"]], "ABCD"],
    "expected": false
  },
  {
    "args": [[["C", "A", "A"], ["A", "A", "A"], ["B", "C", "D"]], "AAB"],
    "expected": true
  }
]
```
