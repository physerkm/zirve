---
title: Geçerli Sudoku
difficulty: medium
tags: [matris, hash-tablosu]
function: isValidSudoku
params:
  - { name: board, type: "char[][]" }
returns: "bool"
---
`9 x 9` boyutundaki bir Sudoku tahtasının (`board`) geçerli olup olmadığını belirleyin. Yalnızca **doldurulmuş hücrelerin** aşağıdaki kurallara göre doğrulanması gerekir:

1. Her **satır**, `1-9` arasındaki rakamları tekrarsız içermelidir.
2. Her **sütun**, `1-9` arasındaki rakamları tekrarsız içermelidir.
3. Dokuz adet `3 x 3` boyutundaki **alt kutunun** her biri, `1-9` arasındaki rakamları tekrarsız içermelidir.

**Not:**
- Doldurulmuş hücreler `'1'`-`'9'` karakterleriyle, boş hücreler ise `'.'` karakteriyle gösterilir.
- Kısmen doldurulmuş bir Sudoku tahtası geçerli olabilir ancak çözülebilir olması şart değildir. Yalnızca mevcut dolu hücrelerin kuralları ihlal etmediğini doğrulamanız yeterlidir.

### Örnek 1

```text
Girdi:
board =
[["5","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Çıktı:  true
Açıklama: Hiçbir satırda, sütunda veya 3x3 alt kutuda tekrar eden rakam yoktur.
```

### Örnek 2

```text
Girdi:
board =
[["8","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Çıktı:  false
Açıklama: Sol üst 3x3 alt kutuda iki adet '8' vardır (ayrıca ilk sütunda da iki adet '8' bulunmaktadır).
```

### Kısıtlar

- `board.length == 9`
- `board[i].length == 9`
- `board[i][j]` bir rakam (`'1'`-`'9'`) veya `'.'` karakteridir.

## İpuçları

- Tahtayı satırlar için bir kez, sütunlar için bir kez, alt kutular için bir kez taramak yerine tek geçişte üçünü birden kontrol edebilirsiniz.
- Her satır `r` (`0..8`), her sütun `c` (`0..8`) ve her `3 x 3` alt kutu `b` (`0..8`) için görülen rakamları birer kümede (`HashSet`) veya bit maskesinde tutun.
- `(r, c)` koordinatındaki hücrenin hangi `3 x 3` alt kutuya (`0..8`) düştüğünü nasıl hesaplarsınız?
- Tam sayı bölmesiyle `boxIndex = (r / 3) * 3 + (c / 3)` formülü her `(r, c)` çiftini `0` ile `8` arasındaki doğru alt kutuya eşler.

## Çözüm

Tahtadaki her `(r, c)` hücresini tek bir iç içe döngüyle gezeriz. Boş hücreleri (`'.'`) atlarız. Dolu bir hücre gördüğümüzde üç soruyu aynı anda yanıtlamamız gerekir:

1. Bu rakam `r`. satırda daha önce görüldü mü?
2. Bu rakam `c`. sütunda daha önce görüldü mü?
3. Bu rakam ait olduğu `3 x 3` alt kutuda daha önce görüldü mü?

Bunun için 9 satır, 9 sütun ve 9 alt kutuyu temsil eden `rows[9]`, `cols[9]` ve `boxes[9]` kümelerini (veya bit maskelerini) tutarız. `(r, c)` hücresinin alt kutu indeksi tam sayı bölmesiyle `(r / 3) * 3 + (c / 3)` olarak hesaplanır:
- Üst şeritteki kutular (`r = 0..2`) `0, 1, 2`,
- Orta şeritteki kutular (`r = 3..5`) `3, 4, 5`,
- Alt şeritteki kutular (`r = 6..8`) `6, 7, 8` indeksini alır.

Rakam bu üç kümeden herhangi birinde zaten varsa `false` döndürürüz; yoksa üç kümeye de ekleyip devam ederiz.

```csharp solution
public class Solution
{
    public bool IsValidSudoku(char[][] board)
    {
        HashSet<char>[] rows = new HashSet<char>[9];
        HashSet<char>[] cols = new HashSet<char>[9];
        HashSet<char>[] boxes = new HashSet<char>[9];

        for (int i = 0; i < 9; i++)
        {
            rows[i] = new HashSet<char>();
            cols[i] = new HashSet<char>();
            boxes[i] = new HashSet<char>();
        }

        for (int r = 0; r < 9; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                char val = board[r][c];
                if (val == '.')
                    continue;

                int boxIdx = (r / 3) * 3 + (c / 3);

                if (!rows[r].Add(val) || !cols[c].Add(val) || !boxes[boxIdx].Add(val))
                    return false;
            }
        }

        return true;
    }
}
```

```typescript solution
function isValidSudoku(board: string[][]): boolean {
  const rows = Array.from({ length: 9 }, () => new Set<string>());
  const cols = Array.from({ length: 9 }, () => new Set<string>());
  const boxes = Array.from({ length: 9 }, () => new Set<string>());

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === ".") continue;

      const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);

      if (rows[r].has(val) || cols[c].has(val) || boxes[boxIdx].has(val)) {
        return false;
      }

      rows[r].add(val);
      cols[c].add(val);
      boxes[boxIdx].add(val);
    }
  }

  return true;
}
```

### Karmaşıklık

- **Zaman:** O(1) (veya genel `N x N` tahta için O(N²)). Tahta boyutu her zaman `9 x 9 = 81` hücre olduğundan en fazla 81 adım çalışır.
- **Alan:** O(1) (genel durumda O(N²)). Kümelerde toplamda en fazla `3 x 81` eleman tutulur.

## Testler

```json
[
  {
    "args": [[
      ["5","3",".",".","7",".",".",".","."],
      ["6",".",".","1","9","5",".",".","."],
      [".","9","8",".",".",".",".","6","."],
      ["8",".",".",".","6",".",".",".","3"],
      ["4",".",".","8",".","3",".",".","1"],
      ["7",".",".",".","2",".",".",".","6"],
      [".","6",".",".",".",".","2","8","."],
      [".",".",".","4","1","9",".",".","5"],
      [".",".",".",".","8",".",".","7","9"]
    ]],
    "expected": true,
    "sample": true
  },
  {
    "args": [[
      ["8","3",".",".","7",".",".",".","."],
      ["6",".",".","1","9","5",".",".","."],
      [".","9","8",".",".",".",".","6","."],
      ["8",".",".",".","6",".",".",".","3"],
      ["4",".",".","8",".","3",".",".","1"],
      ["7",".",".",".","2",".",".",".","6"],
      [".","6",".",".",".",".","2","8","."],
      [".",".",".","4","1","9",".",".","5"],
      [".",".",".",".","8",".",".","7","9"]
    ]],
    "expected": false,
    "sample": true
  },
  {
    "args": [[
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."]
    ]],
    "expected": true
  },
  {
    "args": [[
      ["5","3",".",".","7",".",".",".","."],
      ["6",".",".","1","9","5",".",".","."],
      [".","9","8",".",".",".",".","6","."],
      ["8",".",".",".","6",".",".",".","3"],
      ["4","8",".","8",".","3",".",".","1"],
      ["7",".",".",".","2",".",".",".","6"],
      [".","6",".",".",".",".","2","8","."],
      [".",".",".","4","1","9",".",".","5"],
      [".",".",".",".","8",".",".","7","9"]
    ]],
    "expected": false
  },
  {
    "args": [[
      ["9",".",".",".",".",".",".",".","."],
      [".","9",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."],
      [".",".",".",".",".",".",".",".","."]
    ]],
    "expected": false
  },
  {
    "args": [[
      ["5","3","4","6","7","8","9","1","2"],
      ["6","7","2","1","9","5","3","4","8"],
      ["1","9","8","3","4","2","5","6","7"],
      ["8","5","9","7","6","1","4","2","3"],
      ["4","2","6","8","5","3","7","9","1"],
      ["7","1","3","9","2","4","8","5","6"],
      ["9","6","1","5","3","7","2","8","4"],
      ["2","8","7","4","1","9","6","3","5"],
      ["3","4","5","2","8","6","1","7","9"]
    ]],
    "expected": true
  }
]
```
