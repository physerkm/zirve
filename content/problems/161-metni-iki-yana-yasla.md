---
title: Metni İki Yana Yasla
difficulty: hard
tags: [dizgi, dizi]
function: fullJustify
params:
  - { name: words, type: "string[]" }
  - { name: maxWidth, type: "int" }
returns: "List<string>"
---
Bir kelime dizisi `words` ve bir satır genişliği `maxWidth` veriliyor. Metni her satırda tam olarak `maxWidth` karakter bulunacak ve hem sola hem sağa yaslanacak (full justification) biçimde biçimlendirin.

Kelimeleri açgözlü (greedy) bir yaklaşımla paketlemelisiniz; yani her satıra sığabildiği kadar çok kelime koymalısınız. Kelimeler arasındaki boşlukları mümkün olduğunca eşit dağıtacak şekilde ek boşluklarla (`' '`) doldurun. Eğer bir satırdaki boşluk sayısı kelimeler arasındaki aralıklara tam bölünmüyorsa, soldaki aralıklara sağdakilerden birer fazla boşluk verilmelidir.

Metnin **son satırı** veya yalnızca **tek bir kelime** içeren satırlar **sola yaslı** olmalı ve kelimeler arasına fazladan boşluk eklenmemelidir (kalan boşluklar satırın sağına eklenir).

### Örnek 1

```text
Girdi:  words = ["This", "is", "an", "example", "of", "text", "justification."], maxWidth = 16
Çıktı:
[
   "This    is    an",
   "example  of text",
   "justification.  "
]
Açıklama: 2. satırda 3 boşluk 2 aralığa dağıtılırken soldaki aralığa 2, sağdaki aralığa 1 boşluk verilir. Son satır sola yaslanır.
```

### Örnek 2

```text
Girdi:  words = ["What","must","be","acknowledgment","shall","be"], maxWidth = 16
Çıktı:
[
  "What   must   be",
  "acknowledgment  ",
  "shall be        "
]
Açıklama: 2. satır tek kelimeden oluştuğu için sola yaslanır ve sağına 2 boşluk eklenir. Son satır da sola yaslıdır.
```

### Örnek 3

```text
Girdi:  words = ["Science","is","what","we","understand","well","enough","to","explain","to","a","computer.","Art","is","everything","else","we","do"], maxWidth = 20
Çıktı:
[
  "Science  is  what we",
  "understand      well",
  "enough to explain to",
  "a  computer.  Art is",
  "everything  else  we",
  "do                  "
]
```

### Kısıtlar

- `1 <= words.length <= 300`
- `1 <= words[i].length <= 20`
- `words[i]` yalnızca İngilizce harflerden ve sembollerden oluşur.
- `1 <= maxWidth <= 100`
- `words[i].length <= maxWidth`

## İpuçları

- Problemi iki aşamaya ayırın: (1) Mevcut satıra hangi kelimelerin (`words[i..j-1]`) sığacağını belirleyin, (2) Bu kelimeleri kurallara göre birleştirip `maxWidth` uzunluğunda bir dizgi üretin.
- `k` kelimelik bir satırda kelimeler arasında `gaps = k - 1` adet boşluk aralığı vardır; sığma koşulu `kelimeUzunluklarıToplamı + gaps <= maxWidth` şeklindedir.
- Son satır (`j == words.Length`) veya tek kelimeli satır (`gaps == 0`) özel durumdur: kelimeleri tek boşlukla birleştirip sağ tarafı `maxWidth` olana kadar boşlukla doldurun.
- Diğer satırlarda toplam boşluk `spaces = maxWidth - kelimeUzunluklarıToplamı` kadardır. Her aralığa en az `spaces / gaps` boşluk düşer; ilk `spaces % gaps` aralığa ise `+1` boşluk daha eklenir.

## Çözüm

Metni satır satır oluştururuz. Her adımda `i` indisinden başlayarak `j` indisini olabildiğince ileri taşırız: `lineLen` satırdaki kelimelerin harf sayıları toplamını tutarken, `lineLen + (j - i) + words[j].Length <= maxWidth` koşulu sağlandığı sürece `words[j]` kelimesini satıra dahil ederiz (`j - i` kelimeler arasındaki zorunlu en az 1'er boşluğu temsil eder).

Satıra girecek kelimeler `words[i..j-1]` olarak belirlendiğinde:
- Aradaki boşluk noktası sayısı `gaps = j - i - 1` ve dağıtılacak toplam boşluk sayısı `totalSpaces = maxWidth - lineLen` olur.
- **Sola Yaslama Durumu (`j == words.Length` veya `gaps == 0`):** Kelimeler arasına yalnızca 1 boşluk konur ve satırın sonuna `maxWidth` uzunluğunu tamamlayacak kadar boşluk eklenir.
- **İki Yana Yaslama Durumu:** Her aralığa `evenSpaces = totalSpaces / gaps` adet boşluk verilir. Tam bölünmeyen kalan `extraSpaces = totalSpaces % gaps` adet boşluk ise soldan başlayarak ilk `extraSpaces` aralığa birer tane dağıtılır.

```csharp solution
public class Solution
{
    public IList<string> FullJustify(string[] words, int maxWidth)
    {
        IList<string> result = new List<string>();
        int i = 0;
        int n = words.Length;

        while (i < n)
        {
            int lineLen = words[i].Length;
            int j = i + 1;

            while (j < n && lineLen + (j - i) + words[j].Length <= maxWidth)
            {
                lineLen += words[j].Length;
                j++;
            }

            int gaps = j - i - 1;
            int totalSpaces = maxWidth - lineLen;
            StringBuilder sb = new StringBuilder(maxWidth);

            if (j == n || gaps == 0)
            {
                for (int k = i; k < j; k++)
                {
                    if (k > i) sb.Append(' ');
                    sb.Append(words[k]);
                }
                sb.Append(' ', maxWidth - sb.Length);
            }
            else
            {
                int evenSpaces = totalSpaces / gaps;
                int extraSpaces = totalSpaces % gaps;

                for (int k = i; k < j; k++)
                {
                    sb.Append(words[k]);
                    if (k < j - 1)
                    {
                        int gapIndex = k - i;
                        int spaces = evenSpaces + (gapIndex < extraSpaces ? 1 : 0);
                        sb.Append(' ', spaces);
                    }
                }
            }

            result.Add(sb.ToString());
            i = j;
        }

        return result;
    }
}
```

```typescript solution
function fullJustify(words: string[], maxWidth: number): string[] {
  const result: string[] = [];
  let i = 0;
  const n = words.length;

  while (i < n) {
    let lineLen = words[i].length;
    let j = i + 1;

    while (j < n && lineLen + (j - i) + words[j].length <= maxWidth) {
      lineLen += words[j].length;
      j++;
    }

    const gaps = j - i - 1;
    const totalSpaces = maxWidth - lineLen;

    if (j === n || gaps === 0) {
      const line = words.slice(i, j).join(" ");
      result.push(line + " ".repeat(maxWidth - line.length));
    } else {
      const evenSpaces = Math.floor(totalSpaces / gaps);
      const extraSpaces = totalSpaces % gaps;
      let line = "";

      for (let k = i; k < j; k++) {
        line += words[k];
        if (k < j - 1) {
          const gapIndex = k - i;
          const spaces = evenSpaces + (gapIndex < extraSpaces ? 1 : 0);
          line += " ".repeat(spaces);
        }
      }

      result.push(line);
    }

    i = j;
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(N * maxWidth) veya toplam çıktı karakteri sayısına göre O(L * maxWidth) (L satır sayısı). Her kelime iki kez ziyaret edilir: bir kez satır sınırlarını belirlerken, bir kez de satır dizgisini oluştururken.
- **Alan:** O(L * maxWidth), döndürülen satır listesini saklamak için (ek çalışma alanı O(maxWidth)).

## Testler

```json
[
  {
    "args": [["This", "is", "an", "example", "of", "text", "justification."], 16],
    "expected": ["This    is    an", "example  of text", "justification.  "],
    "sample": true
  },
  {
    "args": [["What", "must", "be", "acknowledgment", "shall", "be"], 16],
    "expected": ["What   must   be", "acknowledgment  ", "shall be        "],
    "sample": true
  },
  {
    "args": [["Science", "is", "what", "we", "understand", "well", "enough", "to", "explain", "to", "a", "computer.", "Art", "is", "everything", "else", "we", "do"], 20],
    "expected": [
      "Science  is  what we",
      "understand      well",
      "enough to explain to",
      "a  computer.  Art is",
      "everything  else  we",
      "do                  "
    ],
    "sample": true
  },
  {
    "args": [["Hello"], 5],
    "expected": ["Hello"]
  },
  {
    "args": [["a"], 4],
    "expected": ["a   "]
  },
  {
    "args": [["ab", "cd", "ef"], 5],
    "expected": ["ab cd", "ef   "]
  },
  {
    "args": [["a", "b", "c", "d", "eeeee"], 9],
    "expected": ["a  b  c d", "eeeee    "]
  }
]
```
