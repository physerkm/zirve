---
title: Sayıyı İngilizce Kelimelerle Yaz
difficulty: hard
tags: [dizgi, matematik, ozyineleme]
function: numberToWords
params:
  - { name: num, type: "int" }
returns: "string"
---
Negatif olmayan bir tam sayı `num` veriliyor. Sayıyı İngilizce kelimelerle yazıp döndürün. Kelimeler tek boşlukla ayrılır ve her kelime büyük harfle başlar; `"and"` ya da tire kullanılmaz.

### Örnek 1

```text
Girdi:  num = 123
Çıktı:  "One Hundred Twenty Three"
```

### Örnek 2

```text
Girdi:  num = 12345
Çıktı:  "Twelve Thousand Three Hundred Forty Five"
```

### Örnek 3

```text
Girdi:  num = 1234567
Çıktı:  "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"
```

### Kısıtlar

- `0 <= num <= 2^31 - 1`

## İpuçları

- İngilizcede sayılar üçlü gruplar halinde okunur: milyar, milyon, bin ve geri kalan.
- Önce 0-999 arasındaki bir sayıyı kelimelere çeviren yardımcı bir fonksiyon yazın.
- 20'nin altındaki sayıların özel adları vardır (`Eleven`, `Twelve`, …, `Nineteen`). Sıfır olan grupları atlamayı ve `0` için `"Zero"` döndürmeyi unutmayın.

## Çözüm

### Üçlü gruplar

Sayı sağdan üçerli gruplara bölünür ve her grup `Three(n)` yardımcısıyla (0-999) yazılır; gruba ölçek kelimesi (`Billion`, `Million`, `Thousand`) eklenir. Değeri `0` olan gruplar tamamen atlanır: `1000010` → `"One Million Ten"`.

`Three(n)` şöyle çalışır:

- `n >= 100` ise `Ones[n / 100] + " Hundred"`, sonra kalan `n % 100`.
- Kalan `< 20` ise doğrudan özel adı (`Ones` tablosu 0-19'u içerir).
- Değilse onlar basamağının adı (`Tens[n / 10]`) ve sıfır değilse birler basamağı.

Parçalar bir listeye toplanıp tek boşlukla birleştirilir; böylece fazladan boşluk oluşmaz.

```csharp solution
public class Solution
{
    private static readonly string[] Ones =
    {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    };

    private static readonly string[] Tens =
    {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    };

    public string NumberToWords(int num)
    {
        if (num == 0)
        {
            return "Zero";
        }

        var words = new List<string>();
        (int Value, string Name)[] scales = { (1_000_000_000, "Billion"), (1_000_000, "Million"), (1_000, "Thousand"), (1, "") };

        foreach (var (value, name) in scales)
        {
            var group = num / value;
            if (group == 0)
            {
                continue;
            }

            Three(group, words);
            if (name.Length > 0)
            {
                words.Add(name);
            }

            num %= value;
        }

        return string.Join(" ", words);
    }

    private static void Three(int n, List<string> words)
    {
        if (n >= 100)
        {
            words.Add(Ones[n / 100]);
            words.Add("Hundred");
            n %= 100;
        }

        if (n >= 20)
        {
            words.Add(Tens[n / 10]);
            n %= 10;
        }

        if (n > 0)
        {
            words.Add(Ones[n]);
        }
    }
}
```

```typescript solution
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const words: string[] = [];
  const three = (n: number): void => {
    if (n >= 100) {
      words.push(ONES[Math.floor(n / 100)], 'Hundred');
      n %= 100;
    }
    if (n >= 20) {
      words.push(TENS[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) words.push(ONES[n]);
  };

  const scales: [number, string][] = [[1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1_000, 'Thousand'], [1, '']];
  for (const [value, name] of scales) {
    const group = Math.floor(num / value);
    if (group === 0) continue;
    three(group);
    if (name) words.push(name);
    num %= value;
  }

  return words.join(' ');
}
```

### Karmaşıklık

- **Zaman:** O(1). Sayı en fazla 10 basamaklıdır; dört grup işlenir.
- **Alan:** O(1).

Bu problemde algoritmadan çok **özel durumlar** sınanır: `0`, 10-19 arası sayılar, sıfır gruplar (`1000000`), grubun içindeki sıfırlar (`105`, `1010`). Mülakatta bunları baştan listelemek iyi bir sinyaldir.

## Testler

```json
[
  { "args": [123], "expected": "One Hundred Twenty Three", "sample": true },
  { "args": [12345], "expected": "Twelve Thousand Three Hundred Forty Five", "sample": true },
  { "args": [1234567], "expected": "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven", "sample": true },
  { "args": [0], "expected": "Zero" },
  { "args": [1000010], "expected": "One Million Ten" },
  { "args": [2147483647], "expected": "Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Seven" },
  { "args": [100], "expected": "One Hundred" },
  { "args": [1000000], "expected": "One Million" },
  { "args": [20], "expected": "Twenty" },
  { "args": [1019], "expected": "One Thousand Nineteen" },
  { "args": [105], "expected": "One Hundred Five" }
]
```
