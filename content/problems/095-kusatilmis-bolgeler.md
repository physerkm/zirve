---
title: Kuşatılmış Bölgeler
difficulty: medium
tags: [graf, dfs, bfs, matris]
function: solve
params:
  - { name: board, type: "char[][]" }
returns: "char[][]"
---
`'X'` ve `'O'` karakterlerinden oluşan `m x n` boyutunda bir tahta `board` veriliyor. Dört yönde birbirine bağlı `'O'` hücreleri bir **bölge** oluşturur. Bir bölge, kenara değmiyor ve bütünüyle `'X'` hücreleriyle çevriliyse **kuşatılmıştır**.

Kuşatılmış bütün bölgelerdeki `'O'` hücrelerini `'X'`'e çevirin. Tahta yerinde değiştirilmeli ve testlerin sonucu görebilmesi için döndürülmelidir.

### Örnek 1

```text
Girdi:  board = [["X","X","X","X"],
                 ["X","O","O","X"],
                 ["X","X","O","X"],
                 ["X","O","X","X"]]
Çıktı:  [["X","X","X","X"],
         ["X","X","X","X"],
         ["X","X","X","X"],
         ["X","O","X","X"]]
Açıklama: Alt satırdaki O kenarda olduğu için kuşatılmamıştır.
```

### Örnek 2

```text
Girdi:  board = [["X"]]
Çıktı:  [["X"]]
```

### Kısıtlar

- `1 <= m, n <= 200`
- `board[i][j]`, `'X'` ya da `'O'`'dur.

## İpuçları

- Hangi `'O'` hücreleri **kurtulur**? Kenara bağlı olanlar.
- Kenardaki her `'O'`'dan bir DFS başlatıp bağlı bütün `'O'`'ları geçici olarak işaretleyin (ör. `'S'`).
- Sonra tahtayı gezin: işaretsiz `'O'`'lar kuşatılmıştır ve `'X'` olur; işaretliler `'O'`'ya geri döner.

## Çözüm

### Kenardan kurtarma

Bir `'O'` bölgesi ancak kenara değiyorsa kurtulur. Bu yüzden kuşatılmış bölgeleri aramak yerine **kurtulanları** buluruz:

1. Kenardaki her `'O'`'dan bir DFS başlatılır; ulaşılan bütün `'O'` hücreleri `'S'` (safe) olarak işaretlenir.
2. Tahta gezilir: kalan `'O'`'lar kenara ulaşamamıştır, `'X'` yapılır. `'S'`'ler tekrar `'O'` olur.

```csharp solution
public class Solution
{
    public char[][] Solve(char[][] board)
    {
        var rows = board.Length;
        var cols = board[0].Length;

        void Mark(int r, int c)
        {
            if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] != 'O')
            {
                return;
            }

            board[r][c] = 'S';
            Mark(r + 1, c);
            Mark(r - 1, c);
            Mark(r, c + 1);
            Mark(r, c - 1);
        }

        for (var r = 0; r < rows; r++)
        {
            Mark(r, 0);
            Mark(r, cols - 1);
        }

        for (var c = 0; c < cols; c++)
        {
            Mark(0, c);
            Mark(rows - 1, c);
        }

        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                board[r][c] = board[r][c] == 'S' ? 'O' : 'X';
            }
        }

        return board;
    }
}
```

```typescript solution
function solve(board: string[][]): string[][] {
  const rows = board.length;
  const cols = board[0].length;

  const mark = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== 'O') return;
    board[r][c] = 'S';
    mark(r + 1, c);
    mark(r - 1, c);
    mark(r, c + 1);
    mark(r, c - 1);
  };

  for (let r = 0; r < rows; r++) {
    mark(r, 0);
    mark(r, cols - 1);
  }

  for (let c = 0; c < cols; c++) {
    mark(0, c);
    mark(rows - 1, c);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board[r][c] = board[r][c] === 'S' ? 'O' : 'X';
    }
  }

  return board;
}
```

### Karmaşıklık

- **Zaman:** O(m × n). Her hücre DFS'te en fazla bir kez işaretlenir ve son geçişte bir kez okunur.
- **Alan:** O(m × n) en kötü durumda özyineleme derinliği. Çok büyük tahtalarda yığın taşmasından kaçınmak için BFS kullanılabilir.

## Testler

```json
[
  {
    "args": [[["X", "X", "X", "X"], ["X", "O", "O", "X"], ["X", "X", "O", "X"], ["X", "O", "X", "X"]]],
    "expected": [["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "O", "X", "X"]],
    "sample": true
  },
  { "args": [[["X"]]], "expected": [["X"]], "sample": true },
  { "args": [[["O", "O"], ["O", "O"]]], "expected": [["O", "O"], ["O", "O"]] },
  { "args": [[["X", "O", "X"], ["O", "X", "O"], ["X", "O", "X"]]], "expected": [["X", "O", "X"], ["O", "X", "O"], ["X", "O", "X"]] },
  { "args": [[["X", "X", "X"], ["X", "O", "X"], ["X", "X", "X"]]], "expected": [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]] },
  {
    "args": [[["O", "X", "X", "O", "X"], ["X", "O", "O", "X", "O"], ["X", "O", "X", "O", "X"], ["O", "X", "O", "O", "O"], ["X", "X", "O", "X", "O"]]],
    "expected": [["O", "X", "X", "O", "X"], ["X", "X", "X", "X", "O"], ["X", "X", "X", "O", "X"], ["O", "X", "O", "O", "O"], ["X", "X", "O", "X", "O"]]
  }
]
```
