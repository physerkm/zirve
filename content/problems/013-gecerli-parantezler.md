---
title: Geçerli Parantezler
difficulty: easy
tags: [yigin, dizgi]
function: isValid
params:
  - { name: s, type: "string" }
returns: "bool"
---
Yalnızca `(`, `)`, `{`, `}`, `[` ve `]` karakterlerinden oluşan bir dizgi `s` veriliyor. Dizginin **geçerli** olup olmadığını döndürün.

Dizgi şu koşullarda geçerlidir:

1. Açılan her parantez, aynı türden bir parantezle kapatılır.
2. Parantezler doğru sırada kapatılır.
3. Her kapanan parantezin, kendisiyle aynı türden açılmış bir karşılığı vardır.

### Örnek 1

```text
Girdi:  s = "()[]{}"
Çıktı:  true
```

### Örnek 2

```text
Girdi:  s = "(]"
Çıktı:  false
```

### Örnek 3

```text
Girdi:  s = "([{}])"
Çıktı:  true
```

### Kısıtlar

- `1 <= s.length <= 10^4`

## İpuçları

- En son açılan parantez, ilk kapatılması gereken parantezdir. Bu "son giren ilk çıkar" davranışı hangi veri yapısını hatırlatıyor?
- Açılan parantezleri yığına koyun. Kapanan bir parantez gördüğünüzde yığının tepesindekiyle eşleşmelidir.
- Dizgi bittiğinde yığın boş değilse kapatılmamış parantez kalmıştır.

## Çözüm

Açılan her parantezi yığına ekleriz. Kapanan bir parantezle karşılaştığımızda yığının tepesindeki eleman onun karşılığı olmalıdır; değilse (ya da yığın boşsa) dizgi geçersizdir. Dizginin sonunda yığının boş olması gerekir.

Üç hata durumu vardır ve üçü de ele alınmalıdır: yanlış türde kapanış `"(]"`, karşılığı olmayan kapanış `")"` ve kapatılmamış açılış `"(("`.

```csharp solution
public class Solution
{
    public bool IsValid(string s)
    {
        var pairs = new Dictionary<char, char> { [')'] = '(', [']'] = '[', ['}'] = '{' };
        var stack = new Stack<char>();

        foreach (var ch in s)
        {
            if (pairs.TryGetValue(ch, out var opening))
            {
                if (stack.Count == 0 || stack.Pop() != opening) return false;
            }
            else
            {
                stack.Push(ch);
            }
        }

        return stack.Count == 0;
    }
}
```

```typescript solution
function isValid(s: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];

  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }

  return stack.length === 0;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(n); en kötü durumda bütün karakterler açılış parantezidir.

Küçük bir iyileştirme: uzunluğu tek olan bir dizgi asla geçerli olamaz; en başta denetleyip hemen `false` dönebilirsiniz.

## Testler

```json
[
  { "args": ["()"], "expected": true, "sample": true },
  { "args": ["()[]{}"], "expected": true, "sample": true },
  { "args": ["(]"], "expected": false, "sample": true },
  { "args": ["([{}])"], "expected": true },
  { "args": ["([)]"], "expected": false },
  { "args": ["("], "expected": false },
  { "args": [")"], "expected": false },
  { "args": ["(("], "expected": false },
  { "args": ["){"], "expected": false },
  { "args": ["{[]}()"], "expected": true },
  { "args": ["(()"], "expected": false }
]
```
