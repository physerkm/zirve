---
title: Günlük Sıcaklıklar
difficulty: medium
tags: [yigin, dizi]
function: dailyTemperatures
params:
  - { name: temperatures, type: "int[]" }
returns: "int[]"
---
`temperatures[i]`, `i`. günün sıcaklığıdır. Aynı uzunlukta bir dizi `answer` döndürün: `answer[i]`, `i`. günden sonra **daha sıcak** bir gün için kaç gün beklemek gerektiğidir. Daha sıcak bir gün yoksa `answer[i] = 0` olmalıdır.

### Örnek 1

```text
Girdi:  temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
Çıktı:  [1, 1, 4, 2, 1, 1, 0, 0]
```

### Örnek 2

```text
Girdi:  temperatures = [30, 40, 50, 60]
Çıktı:  [1, 1, 1, 0]
```

### Kısıtlar

- `1 <= temperatures.length <= 10^5`
- `30 <= temperatures[i] <= 100`

## İpuçları

- Her gün için sağa doğru taramak O(n²)'dir.
- "Sağdaki ilk daha büyük eleman" sorusu monoton yığın kalıbıdır.
- Yığında, daha sıcak gününü henüz bulamamış günlerin **indekslerini** tutun. Yeni gün, yığının tepesindeki günden sıcaksa o günün yanıtı bulunmuştur.

## Çözüm

Yığında, yanıtını bekleyen günlerin indeksleri durur. Bu günlerin sıcaklıkları yığının dibinden tepesine doğru azalır (aksi halde alttaki günün yanıtı çoktan bulunmuş olurdu).

Yeni bir güne geldiğimizde, yığının tepesindeki gün ondan soğuksa o günün beklediği "daha sıcak gün" budur: indeksi yığından çıkarır ve aradaki gün farkını yazarız. Bunu tepedeki gün daha soğuk olduğu sürece tekrarlar, sonra yeni günü yığına ekleriz.

```csharp solution
public class Solution
{
    public int[] DailyTemperatures(int[] temperatures)
    {
        var answer = new int[temperatures.Length];
        var waiting = new Stack<int>();

        for (var day = 0; day < temperatures.Length; day++)
        {
            while (waiting.Count > 0 && temperatures[day] > temperatures[waiting.Peek()])
            {
                var earlier = waiting.Pop();
                answer[earlier] = day - earlier;
            }

            waiting.Push(day);
        }

        return answer;
    }
}
```

```typescript solution
function dailyTemperatures(temperatures: number[]): number[] {
  const answer: number[] = new Array(temperatures.length).fill(0);
  const waiting: number[] = [];

  for (let day = 0; day < temperatures.length; day++) {
    while (waiting.length > 0 && temperatures[day] > temperatures[waiting[waiting.length - 1]]) {
      const earlier = waiting.pop()!;
      answer[earlier] = day - earlier;
    }

    waiting.push(day);
  }

  return answer;
}
```

### Karmaşıklık

- **Zaman:** O(n). İç içe döngüye rağmen her indeks yığına bir kez girer ve en fazla bir kez çıkar.
- **Alan:** O(n).

Döngü bittiğinde yığında kalan günlerin daha sıcak bir günü yoktur; yanıtları başlangıç değeri olan `0`'da kalır.

## Testler

```json
[
  { "args": [[73, 74, 75, 71, 69, 72, 76, 73]], "expected": [1, 1, 4, 2, 1, 1, 0, 0], "sample": true },
  { "args": [[30, 40, 50, 60]], "expected": [1, 1, 1, 0], "sample": true },
  { "args": [[30, 60, 90]], "expected": [1, 1, 0], "sample": true },
  { "args": [[50]], "expected": [0] },
  { "args": [[90, 80, 70, 60]], "expected": [0, 0, 0, 0] },
  { "args": [[70, 70, 70, 71]], "expected": [3, 2, 1, 0] },
  { "args": [[89, 62, 70, 58, 47, 47, 46, 76, 100, 70]], "expected": [8, 1, 5, 4, 3, 2, 1, 1, 0, 0] }
]
```
