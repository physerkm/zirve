---
title: Düzenleme Mesafesi
difficulty: medium
tags: [dinamik-programlama, dizgi]
function: minDistance
params:
  - { name: word1, type: "string" }
  - { name: word2, type: "string" }
returns: "int"
---
İki dizgi `word1` ve `word2` veriliyor. `word1` dizgisini `word2` dizgisine dönüştürmek için gereken **en az işlem sayısını** döndürün.

Bir dizgi üzerinde aşağıdaki üç işlemden her birini yapma hakkınız vardır:
- Bir karakter eklemek (**Ekleme**)
- Bir karakter silmek (**Silme**)
- Bir karakteri başka bir karakterle değiştirmek (**Değiştirme**)

### Örnek 1

```text
Girdi:  word1 = "horse", word2 = "ros"
Çıktı:  3
Açıklama:
horse -> rorse ('h' harfi 'r' ile değiştirilir)
rorse -> rose ('r' harfi silinir)
rose -> ros ('e' harfi silinir)
```

### Örnek 2

```text
Girdi:  word1 = "intention", word2 = "execution"
Çıktı:  5
Açıklama:
intention -> inention ('t' silinir)
inention -> enention ('i' yerine 'e' yazılır)
enention -> exention ('n' yerine 'x' yazılır)
exention -> exection ('n' yerine 'c' yazılır)
exection -> execution ('u' eklenir)
```

### Kısıtlar

- `0 <= word1.length, word2.length <= 500`
- `word1` ve `word2` yalnızca küçük İngilizce harflerden oluşur.

## İpuçları

- İki dizginin öneklerini karşılaştırın: `word1`'in ilk `i` karakterini `word2`'nin ilk `j` karakterine dönüştürmenin en az maliyetini `dp[i, j]` olarak tanımlayın.
- Eğer `word1[i - 1] == word2[j - 1]` ise son karakterler zaten aynıdır; ek işlem yapmadan `dp[i - 1, j - 1]` değerini alabilirsiniz.
- Karakterler farklıysa üç olası son işlemi (silme, ekleme, değiştirme) deneyip en küçüğüne `1` ekleyin.
- Tablonun ilk satırı ve ilk sütunu, boş dizgiye/dizgiden dönüşüm maliyetlerini (`0, 1, 2, ...`) temsil eder.

## Çözüm

**Levenshtein Mesafesi** olarak da bilinen bu problemde, `(m + 1) x (n + 1)` boyutunda bir dinamik programlama tablosu kurarız. `dp[i, j]` değeri, `word1`'in ilk `i` karakterinden oluşan önekini (`word1[0..i]`), `word2`'nin ilk `j` karakterinden oluşan önekine (`word2[0..j]`) dönüştürmek için gereken en az işlem sayısıdır.

Temel durumlar:
- `dp[i, 0] = i`: `i` uzunluğundaki bir dizgiyi boş dizgiye dönüştürmek için `i` silme işlemi gerekir.
- `dp[0, j] = j`: Boş dizgiyi `j` uzunluğundaki bir dizgiye dönüştürmek için `j` ekleme işlemi gerekir.

Her `(i, j)` hücresi için son karakterlere (`word1[i - 1]` ve `word2[j - 1]`) bakarız:
1. **Karakterler aynıysa (`word1[i - 1] == word2[j - 1]`):** Son harfler için işlem gerekmez; `dp[i, j] = dp[i - 1, j - 1]`.
2. **Karakterler farklıysa:** Üç işlemden en az maliyetli olanı seçip `1` ekleriz:
   - **Değiştirme:** `word1[i - 1]`'i `word2[j - 1]` yap (`dp[i - 1, j - 1] + 1`)
   - **Silme:** `word1[i - 1]`'i sil (`dp[i - 1, j] + 1`)
   - **Ekleme:** `word2[j - 1]`'i sona ekle (`dp[i, j - 1] + 1`)

Tablonun sağ alt köşesindeki `dp[m, n]` değeri aradığımız en az düzenleme mesafesini verir.

```csharp solution
public class Solution
{
    public int MinDistance(string word1, string word2)
    {
        int m = word1.Length;
        int n = word2.Length;
        int[,] dp = new int[m + 1, n + 1];

        for (int i = 0; i <= m; i++)
            dp[i, 0] = i;

        for (int j = 0; j <= n; j++)
            dp[0, j] = j;

        for (int i = 1; i <= m; i++)
        {
            for (int j = 1; j <= n; j++)
            {
                if (word1[i - 1] == word2[j - 1])
                {
                    dp[i, j] = dp[i - 1, j - 1];
                }
                else
                {
                    int replace = dp[i - 1, j - 1];
                    int delete = dp[i - 1, j];
                    int insert = dp[i, j - 1];
                    dp[i, j] = 1 + Math.Min(replace, Math.Min(delete, insert));
                }
            }
        }

        return dp[m, n];
    }
}
```

```typescript solution
function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

### Karmaşıklık

- **Zaman:** O(m · n). `(m + 1) x (n + 1)` boyutundaki tablonun her hücresi O(1) zamanda hesaplanır.
- **Alan:** O(m · n). Dinamik programlama tablosu için (yalnızca önceki satır tutularak O(min(m, n))'e de indirilebilir).

## Testler

```json
[
  { "args": ["horse", "ros"], "expected": 3, "sample": true },
  { "args": ["intention", "execution"], "expected": 5, "sample": true },
  { "args": ["", ""], "expected": 0 },
  { "args": ["a", ""], "expected": 1 },
  { "args": ["", "abc"], "expected": 3 },
  { "args": ["abc", "abc"], "expected": 0 },
  { "args": ["kitten", "sitting"], "expected": 3 },
  { "args": ["ab", "ba"], "expected": 2 }
]
```
