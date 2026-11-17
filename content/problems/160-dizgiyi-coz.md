---
title: Kodlanmış Dizgiyi Çöz
difficulty: medium
tags: [yigin, dizgi]
function: decodeString
params:
  - { name: s, type: "string" }
returns: "string"
---
Kodlanmış bir dizgi `s` veriliyor; bu dizgiyi çözerek (decode ederek) açık halini döndürün.

Kodlama kuralı `k[encoded_string]` şeklindedir: köşeli parantez içindeki `encoded_string` dizgisi tam olarak `k` kez tekrarlanır (`k` pozitif bir tam sayıdır). Köşeli parantezler iç içe geçebilir (`3[a2[c]]` gibi).

Girdi dizgisinin her zaman geçerli olduğu garanti edilir; fazladan boşluk yoktur ve köşeli parantezler kurallara uygun biçimde eşleşmiştir. Ayrıca orijinal verinin rakam içermediği ve rakamların yalnızca tekrar sayılarını (`k`) belirttiği varsayılabilir. Örneğin `3a` veya `2[4]` gibi girdiler bulunmaz.

### Örnek 1

```text
Girdi:  s = "3[a]2[bc]"
Çıktı:  "aaabcbc"
Açıklama: "a" 3 kez, "bc" 2 kez tekrarlanıp birleştirilir.
```

### Örnek 2

```text
Girdi:  s = "3[a2[c]]"
Çıktı:  "accaccacc"
Açıklama: Önce içteki "2[c]" -> "cc" çözülür, ardından "a" + "cc" = "acc" 3 kez tekrarlanır.
```

### Örnek 3

```text
Girdi:  s = "2[abc]3[cd]ef"
Çıktı:  "abcabccdcdcdef"
```

### Kısıtlar

- `1 <= s.length <= 30`
- `s` küçük İngilizce harflerden, rakamlardan ve `'['`, `']'` köşeli parantezlerinden oluşur.
- `s` içindeki tüm tam sayılar `[1, 300]` aralığındadır.

## İpuçları

- İç içe geçmiş parantez yapılarında en içteki ifadeyi önce çözüp dıştaki ifadeyle birleştirmek için **yığın (stack)** yapısı idealdir.
- Tekrar sayısı `k` birden fazla basamaklı olabilir (`10[a]` gibi); rakamları okurken `k = k * 10 + (ch - '0')` şeklinde biriktirin.
- `'['` karakterini gördüğünüzde o ana kadar biriktirdiğiniz tekrar sayısını (`k`) ve mevcut dizgiyi (`current`) yığınlara kaydedip sıfırlayın.
- `']'` karakterini gördüğünüzde yığından tekrar sayısını ve bir önceki dış dizgiyi çekerek, mevcut dizgiyi tekrar sayısı kadar önceki dizginin sonuna ekleyin.

## Çözüm

İç içe geçmiş `k[...]` bloklarını soldan sağa tek geçişte çözmek için iki yığın kullanırız:
1. `countStack`: Her `'['` öncesinde okunan tekrar sayısını (`k`) saklar.
2. `stringStack`: `'['` parantezine girmeden önce elimizde birikmiş olan dış bağlam dizgisini saklar.

Dizgiyi karakter karakter tararken dört durumla karşılaşırız:
- **Rakam:** Çok basamaklı olabileceği için `k = k * 10 + (ch - '0')` ile mevcut sayıyı güncelleriz.
- **`'['` (Açılış parantezi):** Yeni bir iç bloğa giriyoruz. Elimizdeki `k` değerini `countStack`'e, şu ana kadar oluşturduğumuz `current` dizgisini `stringStack`'e iteriz. Ardından yeni blok için `k = 0` ve `current = ""` yaparız.
- **`']'` (Kapanış parantezi):** İç blok tamamlanmıştır. `countStack`'ten tekrar sayısını (`repeat`), `stringStack`'ten dış dizgiyi (`prev`) çekeriz. `prev` dizgisinin sonuna `current` dizgisini `repeat` kez ekleyerek yeni `current` değerini elde ederiz.
- **Harf:** Doğrudan `current` dizgisinin sonuna ekleriz.

Tarama bittiğinde `current` içinde tamamen çözülmüş dizgi bulunur.

```csharp solution
public class Solution
{
    public string DecodeString(string s)
    {
        Stack<int> countStack = new Stack<int>();
        Stack<StringBuilder> stringStack = new Stack<StringBuilder>();
        StringBuilder current = new StringBuilder();
        int k = 0;

        foreach (char ch in s)
        {
            if (char.IsDigit(ch))
            {
                k = k * 10 + (ch - '0');
            }
            else if (ch == '[')
            {
                countStack.Push(k);
                stringStack.Push(current);
                current = new StringBuilder();
                k = 0;
            }
            else if (ch == ']')
            {
                int repeat = countStack.Pop();
                StringBuilder prev = stringStack.Pop();
                for (int i = 0; i < repeat; i++)
                {
                    prev.Append(current);
                }
                current = prev;
            }
            else
            {
                current.Append(ch);
            }
        }

        return current.ToString();
    }
}
```

```typescript solution
function decodeString(s: string): string {
  const countStack: number[] = [];
  const stringStack: string[] = [];
  let current = "";
  let k = 0;

  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      k = k * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === "[") {
      countStack.push(k);
      stringStack.push(current);
      current = "";
      k = 0;
    } else if (ch === "]") {
      const repeat = countStack.pop()!;
      const prev = stringStack.pop()!;
      current = prev + current.repeat(repeat);
    } else {
      current += ch;
    }
  }

  return current;
}
```

### Karmaşıklık

- **Zaman:** O(M), burada M çözülmüş (çıktı) dizginin uzunluğudur. Her karakter bir kez okunur ve çıktıdaki her karakter sabit sayıda kopyalanır.
- **Alan:** O(M), yığınlarda tutulan ara dizgiler ve iç içe parantez derinliği için.

## Testler

```json
[
  { "args": ["3[a]2[bc]"], "expected": "aaabcbc", "sample": true },
  { "args": ["3[a2[c]]"], "expected": "accaccacc", "sample": true },
  { "args": ["2[abc]3[cd]ef"], "expected": "abcabccdcdcdef", "sample": true },
  { "args": ["abc3[cd]xyz"], "expected": "abccdcdcdxyz" },
  { "args": ["10[a]"], "expected": "aaaaaaaaaa" },
  { "args": ["2[a2[b3[c]]]"], "expected": "abcccbcccabcccbccc" },
  { "args": ["leetcode"], "expected": "leetcode" },
  { "args": ["2[2[ab]c]"], "expected": "ababcababc" }
]
```
