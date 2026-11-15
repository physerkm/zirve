---
title: Anagram Kontrolü
difficulty: easy
tags: [dizgi, hash-tablosu]
function: isAnagram
params:
  - { name: s, type: "string" }
  - { name: t, type: "string" }
returns: "bool"
---
İki dizgi `s` ve `t` veriliyor. `t`, `s`'nin bir **anagramıysa** `true`, değilse `false` döndürün.

Anagram, bir sözcüğün harflerinin tamamı tam olarak birer kez kullanılarak yeniden sıralanmasıyla elde edilen sözcüktür.

### Örnek 1

```text
Girdi:  s = "anagram", t = "nagaram"
Çıktı:  true
```

### Örnek 2

```text
Girdi:  s = "rat", t = "car"
Çıktı:  false
```

### Kısıtlar

- `1 <= s.length, t.length <= 5 * 10^4`
- `s` ve `t` yalnızca küçük İngilizce harflerden oluşur.

**Devam sorusu:** Girdi Unicode karakterler içerseydi çözümünüz nasıl değişirdi?

## İpuçları

- Uzunlukları farklı iki dizgi anagram olamaz.
- İki dizginin anagram olması, her harfin iki dizgide de **aynı sayıda** geçmesi demektir.
- Alfabe 26 harften oluştuğu için frekansları 26 elemanlı bir dizide tutabilirsiniz.

## Çözüm

Her harfin kaç kez geçtiğini sayarız: `s` için sayacı artırır, `t` için azaltırız. İki dizgi anagramsa bütün sayaçlar sıfırda biter.

```csharp solution
public class Solution
{
    public bool IsAnagram(string s, string t)
    {
        if (s.Length != t.Length) return false;

        var counts = new int[26];

        for (var i = 0; i < s.Length; i++)
        {
            counts[s[i] - 'a']++;
            counts[t[i] - 'a']--;
        }

        return counts.All(count => count == 0);
    }
}
```

```typescript solution
function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;

  const counts = new Map<string, number>();

  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  for (const ch of t) {
    const remaining = counts.get(ch);
    if (!remaining) return false;      // harf yok ya da sayısı tükendi
    counts.set(ch, remaining - 1);
  }

  return true;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1); sayaç boyutu alfabe ile sınırlıdır (26).

**Devam sorusunun yanıtı:** Unicode için sabit boyutlu dizi yetmez; TypeScript çözümündeki gibi hash tablosu kullanılır. Alan, farklı karakter sayısı kadar olur.

**Alternatif:** İki dizgiyi sıralayıp karşılaştırmak daha kısa yazılır ama O(n log n)'dir.

## Testler

```json
[
  { "args": ["anagram", "nagaram"], "expected": true, "sample": true },
  { "args": ["rat", "car"], "expected": false, "sample": true },
  { "args": ["a", "a"], "expected": true },
  { "args": ["ab", "a"], "expected": false },
  { "args": ["aacc", "ccac"], "expected": false },
  { "args": ["listen", "silent"], "expected": true },
  { "args": ["aabb", "abab"], "expected": true }
]
```
