---
title: En Uzun Palindrom Alt Dizgi
difficulty: medium
tags: [dizgi, iki-isaretci, dinamik-programlama]
function: longestPalindrome
params:
  - { name: s, type: "string" }
returns: "string"
---
Bir dizgi `s` veriliyor. `s` içindeki **en uzun palindrom alt dizgiyi** (ardışık karakterlerden oluşan) döndürün.

Aynı uzunlukta birden fazla cevap varsa **en solda başlayanı** döndürün.

### Örnek 1

```text
Girdi:  s = "babad"
Çıktı:  "bab"
Açıklama: "aba" da 3 uzunluğunda bir palindromdur, ama "bab" daha solda başlar.
```

### Örnek 2

```text
Girdi:  s = "cbbd"
Çıktı:  "bb"
```

### Kısıtlar

- `1 <= s.length <= 1000`
- `s` yalnızca rakamlardan ve İngilizce harflerden oluşur.

## İpuçları

- Bütün alt dizgileri tek tek kontrol etmek O(n³) sürer.
- Bir palindrom, merkezinden iki yana doğru simetriktir. Her olası merkezden dışarı doğru genişleyin.
- Merkez bir karakter (tek uzunluk) ya da iki karakter arası (çift uzunluk) olabilir: toplam `2n - 1` merkez.

## Çözüm

### Merkezden genişletme

Her `i` için iki genişletme yaparız: `(i, i)` merkezli (tek uzunluk) ve `(i, i + 1)` merkezli (çift uzunluk). Genişletme, `s[left] == s[right]` olduğu sürece iki ucu dışarı kaydırır ve bulunan palindromun uzunluğunu döndürür.

Daha uzun bir palindrom bulunursa başlangıç konumu ve uzunluğu güncellenir. Merkezler soldan sağa gezildiği ve yalnızca **kesin daha uzun** olanlar kabul edildiği için, eşit uzunluktakiler arasında en solda başlayan korunur.

```csharp solution
public class Solution
{
    public string LongestPalindrome(string s)
    {
        var start = 0;
        var bestLength = 1;

        for (var i = 0; i < s.Length; i++)
        {
            var odd = Expand(s, i, i);
            var even = Expand(s, i, i + 1);
            var length = Math.Max(odd, even);
            if (length > bestLength)
            {
                bestLength = length;
                start = i - (length - 1) / 2;
            }
        }

        return s.Substring(start, bestLength);
    }

    private static int Expand(string s, int left, int right)
    {
        while (left >= 0 && right < s.Length && s[left] == s[right])
        {
            left--;
            right++;
        }

        return right - left - 1;
    }
}
```

```typescript solution
function longestPalindrome(s: string): string {
  const expand = (left: number, right: number): number => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return right - left - 1;
  };

  let start = 0;
  let bestLength = 1;
  for (let i = 0; i < s.length; i++) {
    const length = Math.max(expand(i, i), expand(i, i + 1));
    if (length > bestLength) {
      bestLength = length;
      start = i - Math.floor((length - 1) / 2);
    }
  }

  return s.slice(start, start + bestLength);
}
```

### Karmaşıklık

- **Zaman:** O(n²). `2n - 1` merkezin her biri en fazla O(n) genişler.
- **Alan:** O(1).

`dp[i][j] = s[i] == s[j] && dp[i+1][j-1]` tablosuyla da O(n²) zamanda çözülür ama O(n²) alan ister. Manacher algoritması O(n)'dir; mülakatta adını bilmek genellikle yeterlidir.

## Testler

```json
[
  { "args": ["babad"], "expected": "bab", "sample": true },
  { "args": ["cbbd"], "expected": "bb", "sample": true },
  { "args": ["a"], "expected": "a" },
  { "args": ["ac"], "expected": "a" },
  { "args": ["forgeeksskeegfor"], "expected": "geeksskeeg" },
  { "args": ["aaaa"], "expected": "aaaa" },
  { "args": ["abacdfgdcaba"], "expected": "aba" }
]
```
