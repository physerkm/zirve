---
title: N-Vezir
difficulty: hard
tags: [geri-izleme, matris]
function: solveNQueens
params:
  - { name: n, type: "int" }
returns: "List<List<string>>"
compare: unordered
---
**n-vezir** bulmacası, `n` adet veziri `n x n` boyutundaki bir satranç tahtasına hiçbir vezirin birbirini tehdit etmeyeceği şekilde yerleştirme problemidir. Satrançta bir vezir; aynı satırda, aynı sütunda veya aynı köşegende bulunan diğer taşları tehdit eder.

Bir tam sayı `n` verildiğinde, **n-vezir bulmacasının tüm farklı çözümlerini** döndürün. Cevabı istediğiniz sırada döndürebilirsiniz.

Her çözüm, vezirlerin yerini `'Q'` ve boş karelerin yerini `'.'` ile gösteren `n x n` boyutundaki satranç tahtasının satır dizilimleridir.

### Örnek 1

```text
Girdi:  n = 4
Çıktı:  [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]
Açıklama: 4-vezir bulmacası için yukarıda gösterilen 2 farklı geçerli dizilim vardır.
```

### Örnek 2

```text
Girdi:  n = 1
Çıktı:  [["Q"]]
Açıklama: 1x1 tahtada tek kareye vezir yerleştirilir.
```

### Kısıtlar

- `1 <= n <= 9`

## İpuçları

- Aynı satırda iki vezir olamayacağı için tahtaya vezirleri satır satır (`0`'dan `n - 1`'e kadar her satıra tam bir vezir) yerleştirmeyi deneyin.
- Bir `(r, c)` karesine vezir koymadan önce o sütunda veya iki köşegende daha önce yerleştirilmiş bir vezir olup olmadığını kontrol etmeniz gerekir.
- Sağ üstten sol alta uzanan pozitif köşegen üzerindeki tüm karelerde `r + c` toplamı sabittir; sol üstten sağ alta uzanan negatif köşegen üzerindeki tüm karelerde ise `r - c` farkı sabittir.
- Dolu sütunları (`c`), pozitif köşegenleri (`r + c`) ve negatif köşegenleri (`r - c`) birer kümede (`HashSet`) tutarak çakışma kontrolünü O(1) zamanda yapabilirsiniz.

## Çözüm

Her satırda tam olarak bir vezir bulunmak zorundadır. Bu gözlem sayesinde aramayı satır satır (`r = 0, 1, …, n - 1`) yürüten bir **geri izleme (backtracking)** algoritması kurabiliriz.

`r`. satırdayken `0`'dan `n - 1`'e kadar tüm `c` sütunlarını deneriz. Bir `(r, c)` karesinin güvenli olup olmadığını anlamak için tahtayı tekrar taramamıza gerek yoktur:
- Aynı sütundaki kareler aynı `c` değerini paylaşır.
- Sağ üstten sol alta inen köşegen üzerindeki kareler aynı `r + c` toplamını paylaşır.
- Sol üstten sağ alta inen köşegen üzerindeki kareler aynı `r - c` farkını paylaşır.

Üç ayrı küme (`cols`, `posDiag`, `negDiag`) kullanarak `(r, c)` karesinin tehdit altında olup olmadığını **O(1)** zamanda kontrol ederiz. Kare güvenliyse veziri yerleştirir, ilgili `c`, `r + c` ve `r - c` değerlerini kümelere ekler ve `r + 1`. satıra geçeriz. Alt çağrıdan döndüğümüzde ise veziri kaldırıp değerleri kümelerden çıkararak (geri izleme) sıradaki sütunu deneriz. `r == n` olduğunda tüm vezirler başarıyla yerleştirilmiştir; o anki tahtayı sonuca ekleriz.

```csharp solution
public class Solution
{
    public IList<IList<string>> SolveNQueens(int n)
    {
        var result = new List<IList<string>>();
        var cols = new HashSet<int>();
        var posDiag = new HashSet<int>(); // r + c
        var negDiag = new HashSet<int>(); // r - c

        var board = new char[n][];
        for (int i = 0; i < n; i++)
        {
            board[i] = new char[n];
            Array.Fill(board[i], '.');
        }

        void Backtrack(int r)
        {
            if (r == n)
            {
                var copy = new List<string>(n);
                for (int i = 0; i < n; i++)
                    copy.Add(new string(board[i]));
                result.Add(copy);
                return;
            }

            for (int c = 0; c < n; c++)
            {
                if (cols.Contains(c) || posDiag.Contains(r + c) || negDiag.Contains(r - c))
                    continue;

                cols.Add(c);
                posDiag.Add(r + c);
                negDiag.Add(r - c);
                board[r][c] = 'Q';

                Backtrack(r + 1);

                cols.Remove(c);
                posDiag.Remove(r + c);
                negDiag.Remove(r - c);
                board[r][c] = '.';
            }
        }

        Backtrack(0);
        return result;
    }
}
```

```typescript solution
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const cols = new Set<number>();
  const posDiag = new Set<number>(); // r + c
  const negDiag = new Set<number>(); // r - c

  const board: string[][] = Array.from({ length: n }, () => Array(n).fill("."));

  function backtrack(r: number): void {
    if (r === n) {
      result.push(board.map((row) => row.join("")));
      return;
    }

    for (let c = 0; c < n; c++) {
      if (cols.has(c) || posDiag.has(r + c) || negDiag.has(r - c)) {
        continue;
      }

      cols.add(c);
      posDiag.add(r + c);
      negDiag.add(r - c);
      board[r][c] = "Q";

      backtrack(r + 1);

      cols.delete(c);
      posDiag.delete(r + c);
      negDiag.delete(r - c);
      board[r][c] = ".";
    }
  }

  backtrack(0);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n!). İlk satırda en fazla `n`, ikinci satırda en fazla `n - 1`, üçüncüde en fazla `n - 2` geçerli sütun seçeneği vardır; köşegen kısıtları arama ağacını pratikte çok daha erken budar. Her kare için çakışma kontrolü O(1) sürer.
- **Alan:** O(n²). Tahta durumu için `n x n` matris, özyineleme yığını ve kümeler için O(n) bellek kullanılır.

## Testler

```json
[
  {
    "args": [4],
    "expected": [
      [".Q..", "...Q", "Q...", "..Q."],
      ["..Q.", "Q...", "...Q", ".Q.."]
    ],
    "sample": true
  },
  {
    "args": [1],
    "expected": [["Q"]],
    "sample": true
  },
  {
    "args": [2],
    "expected": []
  },
  {
    "args": [3],
    "expected": []
  },
  {
    "args": [5],
    "expected": [
      ["Q....", "..Q..", "....Q", ".Q...", "...Q."],
      ["Q....", "...Q.", ".Q...", "....Q", "..Q.."],
      [".Q...", "...Q.", "Q....", "..Q..", "....Q"],
      [".Q...", "....Q", "..Q..", "Q....", "...Q."],
      ["..Q..", "Q....", "...Q.", ".Q...", "....Q"],
      ["..Q..", "....Q", ".Q...", "...Q.", "Q...."],
      ["...Q.", "Q....", "..Q..", "....Q", ".Q..."],
      ["...Q.", ".Q...", "....Q", "..Q..", "Q...."],
      ["....Q", ".Q...", "...Q.", "Q....", "..Q.."],
      ["....Q", "..Q..", "Q....", "...Q.", ".Q..."]
    ]
  },
  {
    "args": [6],
    "expected": [
      [".Q....", "...Q..", ".....Q", "Q.....", "..Q...", "....Q."],
      ["..Q...", ".....Q", ".Q....", "....Q.", "Q.....", "...Q.."],
      ["...Q..", "Q.....", "....Q.", ".Q....", ".....Q", "..Q..."],
      ["....Q.", "..Q...", "Q.....", ".....Q", "...Q..", ".Q...."]
    ]
  }
]
```
