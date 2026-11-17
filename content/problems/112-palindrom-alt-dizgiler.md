---
title: Palindrom Alt Dizgiler
difficulty: medium
tags: [dizgi, iki-isaretci, dinamik-programlama]
function: countSubstrings
params:
  - { name: s, type: "string" }
returns: "int"
---
Bir dizgi `s` veriliyor. `s` içindeki **palindrom alt dizgilerin sayısını** döndürün. Başlangıç ya da bitiş konumu farklı olan alt dizgiler, içerikleri aynı olsa bile ayrı sayılır.

### Örnek 1

```text
Girdi:  s = "abc"
Çıktı:  3
Açıklama: "a", "b", "c".
```

### Örnek 2

```text
Girdi:  s = "aaa"
Çıktı:  6
Açıklama: "a", "a", "a", "aa", "aa", "aaa".
```

### Kısıtlar

- `1 <= s.length <= 1000`
- `s` küçük İngilizce harflerden oluşur.

## İpuçları

- "En Uzun Palindrom Alt Dizgi"deki merkezden genişletme burada da işe yarar.
- Bir merkezden genişlerken bulunan **her** palindrom ayrı bir alt dizgidir. Genişleme her başarılı adımda sayacı bir artırsın.

## Çözüm

### Merkezden genişletip sayma

Her palindromun benzersiz bir merkezi vardır: tek uzunluktakiler için bir karakter, çift uzunluktakiler için iki karakter arası. `2n - 1` merkezin her birinden dışarı doğru genişleriz; iki uç eşleştiği her adımda yeni bir palindrom bulunmuş olur ve sayaç artar. Eşleşme bozulduğu anda o merkezden daha uzun palindrom çıkmaz.

```csharp solution
public class Solution
{
    public int CountSubstrings(string s)
    {
        var count = 0;
        for (var i = 0; i < s.Length; i++)
        {
            count += Expand(s, i, i);
            count += Expand(s, i, i + 1);
        }

        return count;
    }

    private static int Expand(string s, int left, int right)
    {
        var found = 0;
        while (left >= 0 && right < s.Length && s[left] == s[right])
        {
            found++;
            left--;
            right++;
        }

        return found;
    }
}
```

```typescript solution
function countSubstrings(s: string): number {
  const expand = (left: number, right: number): number => {
    let found = 0;
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      found++;
      left--;
      right++;
    }
    return found;
  };

  let count = 0;
  for (let i = 0; i < s.length; i++) {
    count += expand(i, i) + expand(i, i + 1);
  }

  return count;
}
```

### Karmaşıklık

- **Zaman:** O(n²).
- **Alan:** O(1).

## Testler

```json
[
  { "args": ["abc"], "expected": 3, "sample": true },
  { "args": ["aaa"], "expected": 6, "sample": true },
  { "args": ["a"], "expected": 1 },
  { "args": ["abba"], "expected": 6 },
  { "args": ["aba"], "expected": 4 },
  { "args": ["racecar"], "expected": 10 }
]
```
