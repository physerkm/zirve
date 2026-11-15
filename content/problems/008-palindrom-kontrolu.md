---
title: Palindrom Kontrolü
difficulty: easy
tags: [dizgi, iki-isaretci]
function: isPalindrome
params:
  - { name: s, type: "string" }
returns: "bool"
---
Bir dizgi, büyük harfleri küçük harfe çevrilip harf ve rakam dışındaki bütün karakterleri atıldıktan sonra baştan ve sondan aynı okunuyorsa **palindromdur**.

`s` dizgisi palindromsa `true`, değilse `false` döndürün.

### Örnek 1

```text
Girdi:  s = "A man, a plan, a canal: Panama"
Çıktı:  true
Açıklama: "amanaplanacanalpanama" bir palindromdur.
```

### Örnek 2

```text
Girdi:  s = "race a car"
Çıktı:  false
```

### Kısıtlar

- `1 <= s.length <= 2 * 10^5`
- `s` yalnızca yazdırılabilir ASCII karakterlerden oluşur.

**Devam sorusu:** Temizlenmiş yeni bir dizgi oluşturmadan, O(1) ek alanla çözebilir misiniz?

## İpuçları

- Dizgiyi temizleyip tersiyle karşılaştırmak çalışır ama ek bellek kullanır.
- Biri baştan, biri sondan başlayan iki işaretçi kullanın; harf ya da rakam olmayan karakterleri atlayın.

## Çözüm

İki işaretçiyi dizginin iki ucuna koyarız. Her adımda önce harf ya da rakam olmayan karakterleri atlar, sonra iki uçtaki karakterleri (küçük harfe çevirerek) karşılaştırırız. Farklıysa palindrom değildir; aynıysa işaretçileri içeri doğru ilerletiriz.

```csharp solution
public class Solution
{
    public bool IsPalindrome(string s)
    {
        var left = 0;
        var right = s.Length - 1;

        while (left < right)
        {
            if (!char.IsAsciiLetterOrDigit(s[left]))
            {
                left++;
            }
            else if (!char.IsAsciiLetterOrDigit(s[right]))
            {
                right--;
            }
            else
            {
                if (char.ToLowerInvariant(s[left]) != char.ToLowerInvariant(s[right])) return false;
                left++;
                right--;
            }
        }

        return true;
    }
}
```

```typescript solution
function isPalindrome(s: string): boolean {
  const isAlphanumeric = (ch: string): boolean => /[a-z0-9]/i.test(ch);

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (!isAlphanumeric(s[left])) {
      left++;
    } else if (!isAlphanumeric(s[right])) {
      right--;
    } else {
      if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
      left++;
      right--;
    }
  }

  return true;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her karakter en fazla bir kez ziyaret edilir.
- **Alan:** O(1).

Boş dizgi ya da hiç harf/rakam içermeyen dizgi (ör. `" "`) palindrom sayılır; döngü hiç karşılaştırma yapmadan biter.

## Testler

```json
[
  { "args": ["A man, a plan, a canal: Panama"], "expected": true, "sample": true },
  { "args": ["race a car"], "expected": false, "sample": true },
  { "args": [" "], "expected": true, "sample": true },
  { "args": ["0P"], "expected": false },
  { "args": ["a."], "expected": true },
  { "args": ["ab_a"], "expected": true },
  { "args": ["Was it a car or a cat I saw?"], "expected": true },
  { "args": [".,"], "expected": true },
  { "args": ["1b1"], "expected": true },
  { "args": ["ab"], "expected": false }
]
```
