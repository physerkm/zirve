---
title: En Küçük Kapsayan Pencere
difficulty: hard
tags: [dizgi, kayan-pencere, hash-tablosu]
function: minWindow
params:
  - { name: s, type: "string" }
  - { name: t, type: "string" }
returns: "string"
---
İki dizgi `s` ve `t` veriliyor. `s` içinde, `t`'nin tüm karakterlerini (tekrar sayılarıyla birlikte) barındıran **en kısa alt dizgiyi (minimum window substring)** döndürün. Eğer `s` içinde böyle bir alt dizgi yoksa boş dizgi `""` döndürün.

Test girdilerinde doğru cevabın her zaman tek (benzersiz) olduğu garanti edilmektedir.

### Örnek 1

```text
Girdi:  s = "ADOBECODEBANC", t = "ABC"
Çıktı:  "BANC"
Açıklama: 'A', 'B' ve 'C' karakterlerinin tamamını içeren en küçük alt dizgi "BANC"tır.
```

### Örnek 2

```text
Girdi:  s = "a", t = "a"
Çıktı:  "a"
Açıklama: Dizginin tamamı aranan penceredir.
```

### Örnek 3

```text
Girdi:  s = "a", t = "aa"
Çıktı:  ""
Açıklama: t'deki iki 'a' karakterinin ikisi de pencerede bulunmalıdır; s'te yalnızca bir 'a' olduğundan geçerli pencere yoktur.
```

### Kısıtlar

- `1 <= s.length, t.length <= 10^5`
- `s` ve `t` büyük ve küçük İngilizce harflerden oluşur.

## İpuçları

- Önce `t` içindeki her karakterden kaç tane gerektiğini bir hash tablosuna (`target`) kaydedin.
- İki işaretçi (`left` ve `right`) ile bir kayan pencere yönetin: geçerli bir pencere elde edene kadar `right` ile genişletin, geçerli oldukça `left` ile daraltarak en kısasını arayın.
- Pencerenin geçerli olup olmadığını her seferinde tüm tabloyu tarayarak kontrol etmek yerine, kaç farklı karakterin hedef sayıya ulaştığını tutan `have` ve `need` sayaçları kullanın.
- `have == need` olduğu sürece pencere geçerlidir; pencere boyutu şimdiye kadarki en küçükten kısaysa başlangıç indeksini ve uzunluğunu kaydedip `left`'i ilerletin.

## Çözüm

Önce `t` dizgisindeki her karakterin frekansını `target` tablosuna yazarız. `need = target.Count`, yani kaç **farklı** karakterin istenen adede ulaşması gerektiğini gösterir.

Ardından `s` üzerinde `[left..right]` kayan penceresini yürütürüz:
1. **Genişletme (`right++`):** `s[right]` karakterini `window` tablosuna ekleriz. Eğer bu karakter `target`'ta varsa ve `window[c] == target[c]` eşitliği tam bu adımda sağlandıysa, bir karakterin daha ihtiyacını eksiksiz karşılamış oluruz: `have++`.
2. **Daraltma (`left++`):** `have == need` olduğu sürece mevcut pencere `t`'deki tüm karakterleri kapsıyordur. Pencere uzunluğu (`right - left + 1`) şimdiye kadarki `bestLen`'den küçükse yeni en iyi pencere olarak kaydederiz. Daha da kısa bir pencere bulabilmek için `s[left]` karakterini pencereden çıkarır ve `left`'i bir sağa kaydırırız. Çıkarılan karakter yüzünden `window[drop] < target[drop]` durumuna düşülürse `have--` yaparız ve döngüden çıkarız.

Hem `right` hem de `left` en fazla `s.Length` kez ilerlediği için algoritma doğrusal zamanda çalışır.

```csharp solution
public class Solution
{
    public string MinWindow(string s, string t)
    {
        if (string.IsNullOrEmpty(s) || string.IsNullOrEmpty(t) || t.Length > s.Length)
            return "";

        Dictionary<char, int> target = new Dictionary<char, int>();
        foreach (char c in t)
            target[c] = target.GetValueOrDefault(c, 0) + 1;

        Dictionary<char, int> window = new Dictionary<char, int>();
        int have = 0;
        int need = target.Count;
        int bestStart = 0;
        int bestLen = int.MaxValue;
        int left = 0;

        for (int right = 0; right < s.Length; right++)
        {
            char c = s[right];
            window[c] = window.GetValueOrDefault(c, 0) + 1;

            if (target.ContainsKey(c) && window[c] == target[c])
                have++;

            // Tüm karakter ihtiyaçları karşılandığı sürece pencereyi soldan daralt.
            while (have == need)
            {
                int curLen = right - left + 1;
                if (curLen < bestLen)
                {
                    bestLen = curLen;
                    bestStart = left;
                }

                char drop = s[left];
                window[drop]--;
                if (target.ContainsKey(drop) && window[drop] < target[drop])
                    have--;

                left++;
            }
        }

        return bestLen == int.MaxValue ? "" : s.Substring(bestStart, bestLen);
    }
}
```

```typescript solution
function minWindow(s: string, t: string): string {
  if (!s || !t || t.length > s.length) return "";

  const target = new Map<string, number>();
  for (const c of t) {
    target.set(c, (target.get(c) ?? 0) + 1);
  }

  const window = new Map<string, number>();
  let have = 0;
  const need = target.size;
  let bestStart = 0;
  let bestLen = Infinity;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) ?? 0) + 1);

    if (target.has(c) && window.get(c) === target.get(c)) {
      have++;
    }

    while (have === need) {
      const curLen = right - left + 1;
      if (curLen < bestLen) {
        bestLen = curLen;
        bestStart = left;
      }

      const drop = s[left];
      window.set(drop, (window.get(drop) ?? 0) - 1);
      if (target.has(drop) && (window.get(drop) ?? 0) < (target.get(drop) ?? 0)) {
        have--;
      }

      left++;
    }
  }

  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}
```

### Karmaşıklık

- **Zaman:** O(|s| + |t|). `t` bir kez taranarak hedef tablosu kurulur; ardından `right` ve `left` işaretçileri `s` üzerinde en fazla birer kez ilerler.
- **Alan:** O(|s| + |t|) (veya alfabenin boyutu sabit kabul edilirse O(1)), `target` ve `window` hash tabloları için.

## Testler

```json
[
  { "args": ["ADOBECODEBANC", "ABC"], "expected": "BANC", "sample": true },
  { "args": ["a", "a"], "expected": "a", "sample": true },
  { "args": ["a", "aa"], "expected": "", "sample": true },
  { "args": ["ab", "b"], "expected": "b" },
  { "args": ["aaflslflsldkalskaaa", "aaa"], "expected": "aaa" },
  { "args": ["cabwefgewcwaefgcf", "cae"], "expected": "cwae" },
  { "args": ["abcdef", "xyz"], "expected": "" }
]
```
