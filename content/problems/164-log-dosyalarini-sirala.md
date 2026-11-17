---
title: Log Dosyalarını Yeniden Sırala
difficulty: medium
tags: [dizgi, siralama, dizi]
function: reorderLogFiles
params:
  - { name: logs, type: "string[]" }
returns: "string[]"
---
Her biri boşlukla ayrılmış kelimelerden oluşan bir log dizisi `logs` veriliyor. Her logun ilk kelimesi bir **tanımlayıcıdır**. İki tür log vardır:

- **Harf logları:** Tanımlayıcı dışındaki bütün kelimeler küçük harflerden oluşur.
- **Rakam logları:** Tanımlayıcı dışındaki bütün kelimeler rakamlardan oluşur.

Logları şu kurallara göre yeniden sıralayıp döndürün:

1. Bütün harf logları, rakam loglarından **önce** gelir.
2. Harf logları **içeriklerine** göre sözlük sırasıyla sıralanır; içerikler aynıysa **tanımlayıcıya** göre sıralanır.
3. Rakam logları **özgün sıralarını** korur.

### Örnek 1

```text
Girdi:  logs = ["dig1 8 1 5 1","let1 art can","dig2 3 6","let2 own kit dig","let3 art zero"]
Çıktı:  ["let1 art can","let3 art zero","let2 own kit dig","dig1 8 1 5 1","dig2 3 6"]
```

### Örnek 2

```text
Girdi:  logs = ["a1 9 2 3 1","g1 act car","zo4 4 7","ab1 off key dog","a8 act zoo"]
Çıktı:  ["g1 act car","a8 act zoo","ab1 off key dog","a1 9 2 3 1","zo4 4 7"]
```

### Kısıtlar

- `1 <= logs.length <= 100`
- `3 <= logs[i].length <= 100`
- Kelimeler arasında tek boşluk vardır; tanımlayıcıdan sonra en az bir kelime bulunur.

## İpuçları

- Logu ilk boşluktan ikiye ayırın: tanımlayıcı ve içerik. İçeriğin ilk karakteri rakamsa log bir rakam logudur.
- Harf loglarını `(içerik, tanımlayıcı)` anahtarıyla sıralayın.
- Rakam loglarının sırası korunmalı: onları ayrı bir listede biriktirip sona ekleyin (ya da kararlı bir sıralama kullanın).

## Çözüm

### İki listeye ayır, yalnızca harf loglarını sırala

Loglar tek geçişte ikiye ayrılır. Rakam logları geldikleri sırayla bir listeye eklenir; böylece sıraları kendiliğinden korunur. Harf logları önce içeriğe, eşitlikte tanımlayıcıya göre sıralanır. Sonuç, sıralı harf logları ile rakam loglarının birleşimidir.

Karşılaştırmalar **ordinal** (karakter kodu) olarak yapılır; kültüre bağlı sıralama küçük harf/rakam düzenini değiştirebilir.

```csharp solution
public class Solution
{
    public string[] ReorderLogFiles(string[] logs)
    {
        var letters = new List<(string Id, string Content, string Log)>();
        var digits = new List<string>();

        foreach (var log in logs)
        {
            var space = log.IndexOf(' ');
            var id = log[..space];
            var content = log[(space + 1)..];
            if (char.IsDigit(content[0]))
            {
                digits.Add(log);
            }
            else
            {
                letters.Add((id, content, log));
            }
        }

        letters.Sort((a, b) =>
        {
            var byContent = string.CompareOrdinal(a.Content, b.Content);
            return byContent != 0 ? byContent : string.CompareOrdinal(a.Id, b.Id);
        });

        return letters.Select(x => x.Log).Concat(digits).ToArray();
    }
}
```

```typescript solution
function reorderLogFiles(logs: string[]): string[] {
  const letters: { id: string; content: string; log: string }[] = [];
  const digits: string[] = [];

  for (const log of logs) {
    const space = log.indexOf(' ');
    const id = log.slice(0, space);
    const content = log.slice(space + 1);
    if (content[0] >= '0' && content[0] <= '9') {
      digits.push(log);
    } else {
      letters.push({ id, content, log });
    }
  }

  const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
  letters.sort((a, b) => compare(a.content, b.content) || compare(a.id, b.id));

  return [...letters.map((x) => x.log), ...digits];
}
```

### Karmaşıklık

- **Zaman:** O(n log n × L). Sıralamada her karşılaştırma en fazla log uzunluğu `L` kadar sürer.
- **Alan:** O(n × L).

## Testler

```json
[
  {
    "args": [["dig1 8 1 5 1", "let1 art can", "dig2 3 6", "let2 own kit dig", "let3 art zero"]],
    "expected": ["let1 art can", "let3 art zero", "let2 own kit dig", "dig1 8 1 5 1", "dig2 3 6"],
    "sample": true
  },
  {
    "args": [["a1 9 2 3 1", "g1 act car", "zo4 4 7", "ab1 off key dog", "a8 act zoo"]],
    "expected": ["g1 act car", "a8 act zoo", "ab1 off key dog", "a1 9 2 3 1", "zo4 4 7"],
    "sample": true
  },
  { "args": [["b art can", "a art can"]], "expected": ["a art can", "b art can"] },
  { "args": [["d1 1", "l1 a", "d2 2"]], "expected": ["l1 a", "d1 1", "d2 2"] },
  { "args": [["x 5 5", "y 1 1"]], "expected": ["x 5 5", "y 1 1"] },
  { "args": [["k1 ab c", "k2 ab", "k3 a"]], "expected": ["k3 a", "k2 ab", "k1 ab c"] }
]
```
