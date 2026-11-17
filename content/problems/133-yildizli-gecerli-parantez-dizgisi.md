---
title: Yıldızlı Geçerli Parantez Dizgisi
difficulty: medium
tags: [acgozlu, dizgi, yigin, dinamik-programlama]
function: checkValidString
params:
  - { name: s, type: "string" }
returns: "bool"
---
Yalnızca `'('`, `')'` ve `'*'` karakterlerinden oluşan bir dizgi `s` veriliyor. `s` geçerliyse `true` döndürün.

Kurallar:

- Her `'('` için ona karşılık gelen ve **sonra** gelen bir `')'` olmalıdır.
- Her `')'` için ona karşılık gelen ve **önce** gelen bir `'('` olmalıdır.
- `'*'`, tek bir `'('`, tek bir `')'` ya da boş dizgi olarak yorumlanabilir.

### Örnek 1

```text
Girdi:  s = "()"
Çıktı:  true
```

### Örnek 2

```text
Girdi:  s = "(*)"
Çıktı:  true
```

### Örnek 3

```text
Girdi:  s = "(*))"
Çıktı:  true
Açıklama: '*' bir '(' olarak yorumlanır.
```

### Kısıtlar

- `1 <= s.length <= 100`
- `s[i]`, `'('`, `')'` ya da `'*'`'dır.

## İpuçları

- Yıldız olmasaydı açık parantez sayacı yeterdi: hiç negatife düşmemeli ve sonda sıfır olmalı.
- Her yıldızın üç yorumu var; hepsini denemek üstel. Bunun yerine açık parantez sayısının alabileceği **aralığı** takip edin.
- `lo`: en az kaç açık parantez olabilir, `hi`: en fazla kaç. `'*'` için `lo--`, `hi++`. `hi < 0` olursa geçersiz; `lo` negatife düşerse `0` yapın. Sonda `lo == 0` olmalı.

## Çözüm

### Açık parantez sayısının aralığı

Dizgiyi soldan sağa okurken, yıldızların bütün yorumları için "henüz kapanmamış açık parantez sayısı" bir aralık oluşturur: `[lo, hi]`.

- `'('`: iki uç da bir artar.
- `')'`: iki uç da bir azalır.
- `'*'`: `lo` bir azalır (yıldız `')'` olabilir), `hi` bir artar (yıldız `'('` olabilir).

`hi < 0` ise yıldızların hepsi `'('` olsa bile fazla `')'` var demektir: `false`. `lo` negatife düşerse `0`'a çekilir; negatif açık parantez sayısı geçerli bir durum değildir, o yorumlar elenir. Sonda `lo == 0` ise açık parantezlerin hepsinin kapandığı bir yorum vardır.

```csharp solution
public class Solution
{
    public bool CheckValidString(string s)
    {
        var lo = 0;
        var hi = 0;

        foreach (var ch in s)
        {
            if (ch == '(')
            {
                lo++;
                hi++;
            }
            else if (ch == ')')
            {
                lo--;
                hi--;
            }
            else
            {
                lo--;
                hi++;
            }

            if (hi < 0)
            {
                return false;
            }

            lo = Math.Max(lo, 0);
        }

        return lo == 0;
    }
}
```

```typescript solution
function checkValidString(s: string): boolean {
  let lo = 0;
  let hi = 0;

  for (const ch of s) {
    if (ch === '(') {
      lo++;
      hi++;
    } else if (ch === ')') {
      lo--;
      hi--;
    } else {
      lo--;
      hi++;
    }

    if (hi < 0) return false;
    lo = Math.max(lo, 0);
  }

  return lo === 0;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1).

Alternatif olarak iki yığın (açık parantez indeksleri ve yıldız indeksleri) tutulabilir; sonda kalan açık parantezler, kendilerinden **sonra** gelen yıldızlarla eşleştirilir. O da O(n) sürer ama O(n) alan kullanır.

## Testler

```json
[
  { "args": ["()"], "expected": true, "sample": true },
  { "args": ["(*)"], "expected": true, "sample": true },
  { "args": ["(*))"], "expected": true, "sample": true },
  { "args": ["("], "expected": false },
  { "args": [")("], "expected": false },
  { "args": ["*"], "expected": true },
  { "args": ["(((**))"], "expected": true },
  { "args": ["((*"], "expected": false },
  { "args": ["**(("], "expected": false },
  { "args": ["(*()"], "expected": true }
]
```
