---
title: Görev Zamanlayıcı
difficulty: medium
tags: [acgozlu, heap, hash-tablosu, dizi]
function: leastInterval
params:
  - { name: tasks, type: "char[]" }
  - { name: n, type: "int" }
returns: "int"
---
İşlemcinin yapması gereken görevler, her biri `A`'dan `Z`'ye bir harf olan `tasks` dizisiyle veriliyor. Her görev bir zaman biriminde tamamlanır. Her zaman biriminde işlemci ya bir görevi tamamlar ya da boşta bekler.

Aynı harfli iki görev arasında **en az `n` zaman birimi** olmalıdır. Görevler istenen sırada yapılabilir. Bütün görevleri bitirmek için gereken **en az zaman birimi** sayısını döndürün.

### Örnek 1

```text
Girdi:  tasks = ["A","A","A","B","B","B"], n = 2
Çıktı:  8
Açıklama: A → B → boşta → A → B → boşta → A → B
```

### Örnek 2

```text
Girdi:  tasks = ["A","A","A","B","B","B"], n = 0
Çıktı:  6
Açıklama: Bekleme gerekmez; görevler herhangi bir sırayla art arda yapılır.
```

### Örnek 3

```text
Girdi:  tasks = ["A","A","A","A","A","A","B","C","D","E","F","G"], n = 2
Çıktı:  16
Açıklama: A → B → C → A → D → E → A → F → G → A → boşta → boşta → A → boşta → boşta → A
```

### Kısıtlar

- `1 <= tasks.length <= 10^4`
- `tasks[i]` büyük bir İngilizce harftir.
- `0 <= n <= 100`

## İpuçları

- Süreyi belirleyen, **en sık** tekrar eden görevdir. Onu `n` aralıklarla yerleştirmek zorundasınız.
- En sık görev `maxCount` kez geçiyorsa, aralarında `maxCount - 1` tane `n` uzunluğunda boşluk vardır. Bu boşluklar diğer görevlerle doldurulur.
- Aynı `maxCount` sıklığına sahip birden fazla görev olabilir; son satıra onlar da eklenir. Görevler boşlukları taşırırsa hiç bekleme gerekmez.

## Çözüm

### En sık görevin çizdiği çerçeve

En sık görevin sayısı `maxCount` olsun. Bu görevi `n + 1` genişliğinde satırların başına yerleştirdiğimizi düşünelim: `maxCount - 1` tam satır ve bir son satır vardır. Tam satırlar `(maxCount - 1) × (n + 1)` zaman birimi tutar. Son satırda yalnızca sıklığı `maxCount` olan görevler bulunur; sayıları `countMax` olsun.

Diğer bütün görevler tam satırlardaki boşluklara sırayla yerleştirilebilir; aynı görevin kopyaları farklı satırlara düştüğü için aralarında en az `n` birim olur. Böylece cevap `(maxCount - 1) × (n + 1) + countMax` olur.

Görevler boşluklardan fazlaysa satırları genişletiriz ve **hiç beklemeye gerek kalmaz**; cevap görev sayısıdır. Bu yüzden sonuç iki değerin büyüğüdür.

```csharp solution
public class Solution
{
    public int LeastInterval(char[] tasks, int n)
    {
        var counts = new int[26];
        foreach (var task in tasks)
        {
            counts[task - 'A']++;
        }

        var maxCount = counts.Max();
        var countMax = counts.Count(c => c == maxCount);

        var frame = (maxCount - 1) * (n + 1) + countMax;
        return Math.Max(tasks.Length, frame);
    }
}
```

```typescript solution
function leastInterval(tasks: string[], n: number): number {
  const counts = new Array<number>(26).fill(0);
  for (const task of tasks) {
    counts[task.charCodeAt(0) - 65]++;
  }

  const maxCount = Math.max(...counts);
  const countMax = counts.filter((c) => c === maxCount).length;

  const frame = (maxCount - 1) * (n + 1) + countMax;
  return Math.max(tasks.length, frame);
}
```

### Karmaşıklık

- **Zaman:** O(t). `t` görev sayısı; harf sayısı sabittir.
- **Alan:** O(1). 26 elemanlı sayaç dizisi.

Simülasyon da mümkündür: her turda en sık kalan görevleri bir max-heap'ten seçip bekleyenleri bir kuyrukta tutmak. O(t log 26) sürer ve "hangi sırayla?" sorusunu da yanıtlar; ama yalnızca süre isteniyorsa formül daha yalındır.

## Testler

```json
[
  { "args": [["A", "A", "A", "B", "B", "B"], 2], "expected": 8, "sample": true },
  { "args": [["A", "A", "A", "B", "B", "B"], 0], "expected": 6, "sample": true },
  { "args": [["A", "A", "A", "A", "A", "A", "B", "C", "D", "E", "F", "G"], 2], "expected": 16, "sample": true },
  { "args": [["A", "C", "A", "B", "D", "B"], 1], "expected": 6 },
  { "args": [["A", "A", "A", "B", "B", "B"], 3], "expected": 10 },
  { "args": [["A"], 5], "expected": 1 },
  { "args": [["A", "A", "A", "B", "B", "B", "C", "C", "C", "D", "D", "E"], 2], "expected": 12 }
]
```
