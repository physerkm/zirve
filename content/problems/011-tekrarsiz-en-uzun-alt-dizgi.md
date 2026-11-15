---
title: Tekrarsız En Uzun Alt Dizgi
difficulty: medium
tags: [dizgi, kayan-pencere, hash-tablosu]
function: lengthOfLongestSubstring
params:
  - { name: s, type: "string" }
returns: "int"
---
Bir dizgi `s` veriliyor. **Tekrar eden karakter içermeyen** en uzun alt dizginin uzunluğunu döndürün.

Alt dizgi, dizginin **ardışık** karakterlerinden oluşan bir parçasıdır.

### Örnek 1

```text
Girdi:  s = "abcabcbb"
Çıktı:  3
Açıklama: "abc" tekrarsız en uzun alt dizgidir.
```

### Örnek 2

```text
Girdi:  s = "bbbbb"
Çıktı:  1
```

### Örnek 3

```text
Girdi:  s = "pwwkew"
Çıktı:  3
Açıklama: Yanıt "wke"dir. "pwke" bir alt dizgi değildir, çünkü karakterleri ardışık değildir.
```

### Kısıtlar

- `0 <= s.length <= 5 * 10^4`
- `s` harf, rakam, simge ve boşluk içerebilir.

## İpuçları

- "En uzun **ardışık**…" ifadesi kayan pencere kalıbını işaret eder.
- Pencereyi sağdan genişletin; pencereye giren karakter zaten içerideyse soldan daraltın.
- Her karakterin **son görüldüğü indeksi** tutarsanız, sol sınırı tek hamlede doğru yere taşıyabilirsiniz.

## Çözüm

`[left, right]` penceresi her zaman tekrarsız bir alt dizgidir. `right` her adımda bir ilerler. Pencereye giren karakter daha önce **pencerenin içinde** görüldüyse, sol sınır o karakterin önceki konumunun bir sağına taşınır.

Her karakterin son görüldüğü indeksi bir hash tablosunda tutarız. Dikkat edilecek nokta: karakter pencerenin **solunda** (yani artık pencere dışında) kalmış bir konumda görülmüşse sol sınır geri gitmemelidir. `lastSeen >= left` denetimi bunu sağlar.

```csharp solution
public class Solution
{
    public int LengthOfLongestSubstring(string s)
    {
        var lastSeen = new Dictionary<char, int>();
        var left = 0;
        var best = 0;

        for (var right = 0; right < s.Length; right++)
        {
            if (lastSeen.TryGetValue(s[right], out var previous) && previous >= left)
            {
                left = previous + 1;
            }

            lastSeen[s[right]] = right;
            best = Math.Max(best, right - left + 1);
        }

        return best;
    }
}
```

```typescript solution
function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const previous = lastSeen.get(s[right]);
    if (previous !== undefined && previous >= left) {
      left = previous + 1;
    }

    lastSeen.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her karakter bir kez işlenir.
- **Alan:** O(min(n, alfabe boyutu)).

Klasik hata örneği `"abba"`dır: son `a` işlenirken önceki `a` (indeks 0) pencerenin solunda kalmıştır; `previous >= left` denetimi olmadan sol sınır geriye, 1'e çekilir ve `"bba"` gibi geçersiz bir pencere sayılır.

## Testler

```json
[
  { "args": ["abcabcbb"], "expected": 3, "sample": true },
  { "args": ["bbbbb"], "expected": 1, "sample": true },
  { "args": ["pwwkew"], "expected": 3, "sample": true },
  { "args": [""], "expected": 0 },
  { "args": [" "], "expected": 1 },
  { "args": ["abba"], "expected": 2 },
  { "args": ["dvdf"], "expected": 3 },
  { "args": ["abcdefg"], "expected": 7 },
  { "args": ["tmmzuxt"], "expected": 5 },
  { "args": ["aab"], "expected": 2 }
]
```
