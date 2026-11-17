---
title: Geçerli Parantez İçin Minimum Silme
difficulty: medium
tags: [yigin, dizgi]
function: minRemoveToMakeValid
params:
  - { name: s, type: "string" }
returns: "string"
---
`'('`, `')'` ve küçük İngilizce harflerden oluşan bir `s` dizgisi veriliyor.

Dizginin **geçerli bir parantez dizgisi** haline gelmesi için **en az sayıda** `'('` veya `')'` karakterini silin ve elde edilen geçerli dizgiyi döndürün.

Biçimsel olarak bir parantez dizgisi şu koşullarda geçerlidir:
- Boş dizgiyse veya yalnızca küçük harfler içeriyorsa,
- Geçerli iki `A` ve `B` dizgisinin birleşimi (`AB`) şeklinde yazılabiliyorsa,
- Geçerli bir `A` dizgisi için `(A)` şeklinde yazılabiliyorsa.

### Örnek 1

```text
Girdi:  s = "a)b(c)d"
Çıktı:  "ab(c)d"
Açıklama: İlk ')' karakterinin solunda eşleşebileceği bir '(' yoktur; yalnız bu karakter silinerek geçerli "ab(c)d" dizgisi elde edilir.
```

### Örnek 2

```text
Girdi:  s = "))(("
Çıktı:  ""
Açıklama: Baştaki ')' karakterlerinin solunda '(', sondaki '(' karakterlerinin sağında ')' olmadığı için tüm parantezler silinmek zorundadır.
```

### Örnek 3

```text
Girdi:  s = ")k(o)d(l(a"
Çıktı:  "k(o)dla"
Açıklama: En baştaki ')' ile sondaki iki '(' eşleşemez; bunlar silindiğinde "k(o)dla" kalır.
```

### Kısıtlar

- `1 <= s.length <= 10^5`
- `s[i]` karakteri `'('`, `')'` veya küçük İngilizce harftir (`'a'..'z'`).

## İpuçları

- Harfler parantez dengesini etkilemez; onlar hiçbir zaman silinmez.
- Soldan sağa ilerlerken bir `')'` gördüğünüzde, daha önce açılmış ve henüz kapanmamış bir `'('` yoksa bu `')'` karakteri kesinlikle geçersizdir ve silinmelidir.
- Açılan `'('` karakterlerinin hangi indekslerde bulunduğunu bir yığında (`Stack<int>`) tutun; her geçerli `')'` gördüğünüzde yığından bir indeks çıkarın.
- Tarama bittiğinde yığında hala kalan indeksler, sağında hiç kapanışı olmayan fazla `'('` karakterleridir; onları da silinecekler listesine ekleyin.

## Çözüm

Bir parantezin geçersiz olması iki şekilde gerçekleşir:
1. Henüz açık bir `'('` yokken gelen `')'` karakteri (solunda eşi yoktur).
2. Dizgi sonuna kadar hiçbir `')'` ile kapanmayan `'('` karakteri (sağında eşi yoktur).

Hangi indekslerdeki parantezlerin silineceğini bir `bool[] remove` dizisinde işaretleriz ve açık `'('` karakterlerinin indekslerini bir yığında (`stack`) tutarız:

1. Dizgiyi soldan sağa tararız:
   - `s[i] == '('` ise indeks `i`'yi yığına ekleriz.
   - `s[i] == ')'` ise yığına bakarız: yığın doluysa en son açılan `'('` ile eşleştirip `stack.Pop()` yaparız; yığın boşsa bu `')'` eşleşemez, `remove[i] = true` olarak işaretleriz.
2. Tarama bittiğinde yığında kalan tüm indeksler kapanmamış `'('` karakterlerine aittir. Yığını boşaltarak hepsini `remove[idx] = true` yaparız.
3. Son geçişte `remove[i] == false` olan karakterleri `StringBuilder` ile birleştirip döndürürüz.

```csharp solution
public class Solution
{
    public string MinRemoveToMakeValid(string s)
    {
        var stack = new Stack<int>();
        var remove = new bool[s.Length];

        for (int i = 0; i < s.Length; i++)
        {
            if (s[i] == '(')
            {
                stack.Push(i);
            }
            else if (s[i] == ')')
            {
                if (stack.Count > 0)
                    stack.Pop();
                else
                    remove[i] = true; // Eşleşecek '(' yok, bu ')' silinmeli.
            }
        }

        // Yığında kalan '(' indekslerinin sağında kapanış yoktur; hepsi silinmeli.
        while (stack.Count > 0)
        {
            remove[stack.Pop()] = true;
        }

        var sb = new System.Text.StringBuilder(s.Length);
        for (int i = 0; i < s.Length; i++)
        {
            if (!remove[i])
                sb.Append(s[i]);
        }

        return sb.ToString();
    }
}
```

```typescript solution
function minRemoveToMakeValid(s: string): string {
  const stack: number[] = [];
  const remove = new Array<boolean>(s.length).fill(false);

  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") {
      stack.push(i);
    } else if (s[i] === ")") {
      if (stack.length > 0) {
        stack.pop();
      } else {
        remove[i] = true;
      }
    }
  }

  while (stack.length > 0) {
    remove[stack.pop()!] = true;
  }

  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    if (!remove[i]) {
      out.push(s[i]);
    }
  }

  return out.join("");
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizgi sabit sayıda geçişle taranır; her indeks yığına en fazla bir kez girer ve bir kez çıkar.
- **Alan:** O(n). Yığın, `remove` dizisi ve sonuç dizgisi en fazla `n` eleman tutar.

## Testler

```json
[
  { "args": ["a)b(c)d"], "expected": "ab(c)d", "sample": true },
  { "args": ["))(("], "expected": "", "sample": true },
  { "args": [")k(o)d(l(a"], "expected": "k(o)dla", "sample": true },
  { "args": ["(a(b)c)"], "expected": "(a(b)c)" },
  { "args": ["z)i)r(v)e(m"], "expected": "zir(v)em" },
  { "args": ["(((abc"], "expected": "abc" },
  { "args": ["a(b)c(d)e"], "expected": "a(b)c(d)e" },
  { "args": [")a(b)c(d("], "expected": "a(b)cd" }
]
```
