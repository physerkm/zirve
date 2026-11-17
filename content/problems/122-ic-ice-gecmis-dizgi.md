---
title: İç İçe Geçmiş Dizgi
difficulty: medium
tags: [dinamik-programlama, dizgi]
function: isInterleave
params:
  - { name: s1, type: "string" }
  - { name: s2, type: "string" }
  - { name: s3, type: "string" }
returns: "bool"
---
Üç dizgi `s1`, `s2` ve `s3` veriliyor. `s3`'ün, `s1` ile `s2`'nin **iç içe geçirilmesiyle** (interleaving) oluşturulup oluşturulamayacağını belirleyin.

İç içe geçirmede `s1` ve `s2`'nin karakterleri, her birinin **kendi sırası korunarak** tek bir dizgide birleştirilir. Örneğin `s1 = "ab"` ve `s2 = "cd"` için `"acbd"` geçerlidir, `"bacd"` değildir.

### Örnek 1

```text
Girdi:  s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
Çıktı:  true
```

### Örnek 2

```text
Girdi:  s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
Çıktı:  false
```

### Örnek 3

```text
Girdi:  s1 = "", s2 = "", s3 = ""
Çıktı:  true
```

### Kısıtlar

- `0 <= s1.length, s2.length <= 100`
- `0 <= s3.length <= 200`
- Dizgiler küçük İngilizce harflerden oluşur.

**Devam sorusu:** Yalnızca O(s2.length) ek bellekle çözebilir misiniz?

## İpuçları

- Uzunluklar tutmuyorsa (`|s1| + |s2| != |s3|`) cevap `false`'tur.
- Açgözlü seçim işe yaramaz: `s3`'ün sıradaki karakteri iki dizginin de başındaki karaktere eşit olabilir.
- `dp[i][j]`: `s1`'in ilk `i`, `s2`'nin ilk `j` karakteri `s3`'ün ilk `i + j` karakterini oluşturabiliyor mu? Son karakter ya `s1`'den ya `s2`'den gelmiştir.

## Çözüm

### İki boyutlu DP, tek satıra sıkıştırılmış

`dp[i][j]` doğruysa, `s3[0..i+j)` dizgisi `s1[0..i)` ve `s2[0..j)` ile örülebilir. Son karakter `s3[i+j-1]`:

- `s1[i-1]`'den geldiyse: `dp[i-1][j] && s1[i-1] == s3[i+j-1]`.
- `s2[j-1]`'den geldiyse: `dp[i][j-1] && s2[j-1] == s3[i+j-1]`.

`dp[0][0] = true`. Her satır yalnızca bir öncekine ve kendi solundaki hücreye bağlı olduğu için tek boyutlu bir dizi yeter: `dp[j]` güncellenmeden önce "üstteki" değeri, `dp[j-1]` ise "soldaki" değeri tutar.

```csharp solution
public class Solution
{
    public bool IsInterleave(string s1, string s2, string s3)
    {
        if (s1.Length + s2.Length != s3.Length)
        {
            return false;
        }

        var dp = new bool[s2.Length + 1];
        for (var i = 0; i <= s1.Length; i++)
        {
            for (var j = 0; j <= s2.Length; j++)
            {
                if (i == 0 && j == 0)
                {
                    dp[j] = true;
                    continue;
                }

                var fromS1 = i > 0 && dp[j] && s1[i - 1] == s3[i + j - 1];
                var fromS2 = j > 0 && dp[j - 1] && s2[j - 1] == s3[i + j - 1];
                dp[j] = fromS1 || fromS2;
            }
        }

        return dp[s2.Length];
    }
}
```

```typescript solution
function isInterleave(s1: string, s2: string, s3: string): boolean {
  if (s1.length + s2.length !== s3.length) return false;

  const dp = new Array<boolean>(s2.length + 1).fill(false);
  for (let i = 0; i <= s1.length; i++) {
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0 && j === 0) {
        dp[j] = true;
        continue;
      }

      const fromS1 = i > 0 && dp[j] && s1[i - 1] === s3[i + j - 1];
      const fromS2 = j > 0 && dp[j - 1] && s2[j - 1] === s3[i + j - 1];
      dp[j] = fromS1 || fromS2;
    }
  }

  return dp[s2.length];
}
```

### Karmaşıklık

- **Zaman:** O(m × n).
- **Alan:** O(n). `n = s2.length`.

## Testler

```json
[
  { "args": ["aabcc", "dbbca", "aadbbcbcac"], "expected": true, "sample": true },
  { "args": ["aabcc", "dbbca", "aadbbbaccc"], "expected": false, "sample": true },
  { "args": ["", "", ""], "expected": true, "sample": true },
  { "args": ["a", "", "a"], "expected": true },
  { "args": ["", "b", "a"], "expected": false },
  { "args": ["ab", "cd", "acbd"], "expected": true },
  { "args": ["abc", "def", "abdcef"], "expected": true },
  { "args": ["a", "b", "abc"], "expected": false }
]
```
