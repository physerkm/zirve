---
title: Düzenli İfade Eşleştirme
difficulty: hard
tags: [dinamik-programlama, dizgi, ozyineleme]
function: isMatch
params:
  - { name: s, type: "string" }
  - { name: p, type: "string" }
returns: "bool"
---
Bir girdi dizgisi `s` ve bir kalıp (pattern) `p` veriliyor. `'.'` ve `'*'` karakterlerini destekleyen düzenli ifade (regex) eşleştirmesini gerçekleştirin:

- `'.'` herhangi bir tek karakterle eşleşir.
- `'*'` kendisinden hemen önce gelen elemanın **sıfır veya daha fazla** tekrarıyla eşleşir.

Eşleştirme `s` dizgisinin bir kısmını değil, **tamamını** kapsamalıdır.

### Örnek 1

```text
Girdi:  s = "aa", p = "a"
Çıktı:  false
Açıklama: "a" kalıbı "aa" dizgisinin tamamıyla eşleşmez.
```

### Örnek 2

```text
Girdi:  s = "aa", p = "a*"
Çıktı:  true
Açıklama: '*' kendinden önceki 'a' karakterinin sıfır veya daha fazla kez tekrarlanabileceği anlamına gelir. 'a' iki kez tekrarlanarak "aa" olur.
```

### Örnek 3

```text
Girdi:  s = "ab", p = ".*"
Çıktı:  true
Açıklama: ".*" sıfır veya daha fazla '.' (herhangi bir karakter) demektir.
```

### Kısıtlar

- `1 <= s.length <= 20`
- `1 <= p.length <= 20`
- `s` yalnızca küçük İngilizce harflerden oluşur.
- `p` yalnızca küçük İngilizce harflerden, `'.'` ve `'*'` karakterlerinden oluşur.
- Her `'*'` karakterinden önce geçerli bir karakter (`'*'` olmayan) bulunduğu garanti edilir.

## İpuçları

- `s[i]` ile `p[j]` karakterlerinin ilk karakter bazında eşleşip eşleşmediğini `firstMatch = (i < s.Length) && (p[j] == s[i] || p[j] == '.')` ile kontrol edin.
- Kalıpta bir sonraki karakter `'*'` ise (`j + 1 < p.Length && p[j + 1] == '*'`), `p[j]*` ikilisini bir bütün olarak değerlendirin.
- `p[j]*` için iki seçenek vardır: hiç kullanmamak (`(i, j + 2)` durumuna geçmek) veya `firstMatch` doğruysa en az bir kez kullanıp aynı kalıpta kalmak (`(i + 1, j)` durumuna geçmek).
- `s` bittiğinde (`i == s.Length`) bile `p` içinde `"a*b*"` gibi sıfır kez kullanılabilen kalıplar kalabileceğinden `i` indeksini `s.Length`'ten başlatarak tablonuzu doldurun.

## Çözüm

Problemi sondan başa 2 boyutlu dinamik programlama ile çözeriz. `dp[i, j]`, `s[i..]` sonekinin `p[j..]` kalıp sonekiyle tam olarak eşleşip eşleşmediğini (`true` / `false`) gösterir.

Başlangıçta hem `s` hem de `p` tükendiğinde eşleşme başarılıdır: `dp[m, n] = true`.

`i` indeksini `m`'den `0`'a (`i = m` boş `s` sonekini temsil eder; `"a*"` gibi kalıplar boş dizgiyle eşleşebilir), `j` indeksini ise `n - 1`'den `0`'a doğru döneriz:
1. Önce mevcut karakterlerin eşleşip eşleşmediğine bakarız: `firstMatch = i < m && (p[j] == s[i] || p[j] == '.')`.
2. **Bir sonraki kalıp karakteri `'*'` ise (`j + 1 < n && p[j + 1] == '*'`):**
   - **0 kez kullan:** `p[j]*` ikilisini tamamen atlarız (`dp[i, j + 2]`).
   - **1 veya daha fazla kez kullan:** `firstMatch` doğruysa `s[i]` karakterini tüketip `p[j]*` kalıbını koruruz (`firstMatch && dp[i + 1, j]`).
3. **Bir sonraki karakter `'*'` değilse:**
   - Hem `firstMatch` doğru olmalı hem de kalan kısımlar eşleşmelidir (`firstMatch && dp[i + 1, j + 1]`).

Sonuç `dp[0, 0]` hücresindedir.

```csharp solution
public class Solution
{
    public bool IsMatch(string s, string p)
    {
        int m = s.Length;
        int n = p.Length;
        bool[,] dp = new bool[m + 1, n + 1];
        dp[m, n] = true;

        for (int i = m; i >= 0; i--)
        {
            for (int j = n - 1; j >= 0; j--)
            {
                bool firstMatch = i < m && (p[j] == s[i] || p[j] == '.');

                if (j + 1 < n && p[j + 1] == '*')
                {
                    dp[i, j] = dp[i, j + 2] || (firstMatch && dp[i + 1, j]);
                }
                else
                {
                    dp[i, j] = firstMatch && dp[i + 1, j + 1];
                }
            }
        }

        return dp[0, 0];
    }
}
```

```typescript solution
function isMatch(s: string, p: string): boolean {
  const m = s.length;
  const n = p.length;
  const dp: boolean[][] = Array.from({ length: m + 1 }, () =>
    new Array<boolean>(n + 1).fill(false)
  );
  dp[m][n] = true;

  for (let i = m; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const firstMatch = i < m && (p[j] === s[i] || p[j] === ".");

      if (j + 1 < n && p[j + 1] === "*") {
        dp[i][j] = dp[i][j + 2] || (firstMatch && dp[i + 1][j]);
      } else {
        dp[i][j] = firstMatch && dp[i + 1][j + 1];
      }
    }
  }

  return dp[0][0];
}
```

### Karmaşıklık

- **Zaman:** O(m · n). `(m + 1) x (n + 1)` boyutundaki tablonun her hücresi sabit zamanda hesaplanır.
- **Alan:** O(m · n). `dp` tablosu için ayrılan bellek.

## Testler

```json
[
  { "args": ["aa", "a"], "expected": false, "sample": true },
  { "args": ["aa", "a*"], "expected": true, "sample": true },
  { "args": ["ab", ".*"], "expected": true, "sample": true },
  { "args": ["aab", "c*a*b"], "expected": true },
  { "args": ["mississippi", "mis*is*p*."], "expected": false },
  { "args": ["mississippi", "mis*is*ip*."], "expected": true },
  { "args": ["a", "ab*"], "expected": true },
  { "args": ["ab", ".*c"], "expected": false }
]
```
