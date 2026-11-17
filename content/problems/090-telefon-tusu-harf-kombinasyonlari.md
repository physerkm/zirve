---
title: Telefon Tuşlarının Harf Kombinasyonları
difficulty: medium
tags: [geri-izleme, dizgi, hash-tablosu]
function: letterCombinations
params:
  - { name: digits, type: "string" }
returns: "List<string>"
compare: unordered
---
`2`'den `9`'a kadar rakamlardan oluşan bir dizgi `digits` veriliyor. Eski telefon tuş takımında her rakam birkaç harfe karşılık gelir:

```text
2: abc   3: def   4: ghi   5: jkl
6: mno   7: pqrs  8: tuv   9: wxyz
```

Bu rakamların yazabileceği **bütün harf kombinasyonlarını** herhangi bir sırada döndürün. `digits` boşsa boş liste döndürün.

### Örnek 1

```text
Girdi:  digits = "23"
Çıktı:  ["ad","ae","af","bd","be","bf","cd","ce","cf"]
```

### Örnek 2

```text
Girdi:  digits = ""
Çıktı:  []
```

### Örnek 3

```text
Girdi:  digits = "2"
Çıktı:  ["a","b","c"]
```

### Kısıtlar

- `0 <= digits.length <= 4`
- `digits[i]`, `['2', '9']` aralığında bir rakamdır.

## İpuçları

- Rakam başına harfleri bir tabloda tutun.
- Her konum için o rakamın harflerinden birini seçip bir sonraki konuma geçen bir geri izleme yazın.
- Kombinasyon uzunluğu rakam sayısına ulaşınca sonuca ekleyin.

## Çözüm

### Geri izleme

`Backtrack(i)`, `i`. rakam için harf seçer. `i == digits.Length` ise oluşturulan dizgi tamamdır ve sonuca eklenir. Aksi halde rakamın her harfi için harf eklenir, `Backtrack(i + 1)` çağrılır, dönüşte harf silinir.

```csharp solution
public class Solution
{
    private static readonly string[] Letters = { "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz" };

    public IList<string> LetterCombinations(string digits)
    {
        var result = new List<string>();
        if (digits.Length == 0)
        {
            return result;
        }

        var current = new StringBuilder();

        void Backtrack(int i)
        {
            if (i == digits.Length)
            {
                result.Add(current.ToString());
                return;
            }

            foreach (var letter in Letters[digits[i] - '0'])
            {
                current.Append(letter);
                Backtrack(i + 1);
                current.Length--;
            }
        }

        Backtrack(0);
        return result;
    }
}
```

```typescript solution
function letterCombinations(digits: string): string[] {
  const letters = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
  const result: string[] = [];
  if (digits.length === 0) return result;

  const current: string[] = [];
  const backtrack = (i: number): void => {
    if (i === digits.length) {
      result.push(current.join(''));
      return;
    }

    for (const letter of letters[Number(digits[i])]) {
      current.push(letter);
      backtrack(i + 1);
      current.pop();
    }
  };

  backtrack(0);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(4^n × n). En fazla 4 harfli tuşlarla `4^n` kombinasyon vardır ve her biri O(n)'de oluşturulur.
- **Alan:** O(n) özyineleme (çıktı hariç).

## Testler

```json
[
  { "args": ["23"], "expected": ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"], "sample": true },
  { "args": [""], "expected": [], "sample": true },
  { "args": ["2"], "expected": ["a", "b", "c"], "sample": true },
  { "args": ["79"], "expected": ["pw", "px", "py", "pz", "qw", "qx", "qy", "qz", "rw", "rx", "ry", "rz", "sw", "sx", "sy", "sz"] },
  { "args": ["92"], "expected": ["wa", "wb", "wc", "xa", "xb", "xc", "ya", "yb", "yc", "za", "zb", "zc"] }
]
```
