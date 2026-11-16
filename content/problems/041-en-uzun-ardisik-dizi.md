---
title: En Uzun Ardışık Dizi
difficulty: medium
tags: [hash-tablosu, dizi]
function: longestConsecutive
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
Sırasız bir tam sayı dizisi `nums` veriliyor. Dizideki sayılardan oluşturulabilecek **en uzun ardışık sayı dizisinin** uzunluğunu döndürün. Ardışık dizi, her sayının bir öncekinden tam 1 büyük olduğu dizidir (örneğin `1, 2, 3, 4`); sayıların `nums` içinde yan yana durması gerekmez.

Çözümünüz **O(n)** zamanda çalışmalıdır.

### Örnek 1

```text
Girdi:  nums = [100, 4, 200, 1, 3, 2]
Çıktı:  4
Açıklama: En uzun ardışık dizi 1, 2, 3, 4'tür.
```

### Örnek 2

```text
Girdi:  nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]
Çıktı:  9
```

### Örnek 3

```text
Girdi:  nums = [1, 0, 1, 2]
Çıktı:  3
```

### Kısıtlar

- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## İpuçları

- Sıralamak işi kolaylaştırır ama O(n log n) sürer. "Bu sayı dizide var mı?" sorusunu O(1)'de yanıtlayan bir veri yapısı düşünün.
- Her sayıdan başlayıp ileri doğru saymak, uzun dizilerde aynı sayıları tekrar tekrar saydırır.
- Bir sayı ne zaman bir ardışık dizinin **başlangıcıdır**? Bir eksiği dizide yoksa.
- Yalnızca başlangıç olan sayılardan ileri doğru sayın.

## Çözüm

Bütün sayıları bir kümeye (`HashSet`) koyarız. Böylece tekrar eden sayılar teke iner ve "x burada mı?" sorusu O(1)'de yanıtlanır.

Asıl fikir, saymaya yalnızca **dizi başlangıçlarından** başlamaktır. Bir sayının bir eksiği (`num - 1`) kümedeyse o sayı bir dizinin ortasındadır; o diziyi zaten gerçek başlangıcı sayacaktır, bu yüzden atlanır. Bir eksiği kümede yoksa sayı bir başlangıçtır: `num + 1`, `num + 2`, … kümede oldukça ilerleyip uzunluğu sayarız.

İç içe iki döngü olmasına rağmen çözüm O(n)'dir: iç döngü yalnızca başlangıçlardan çalışır ve her sayı, ait olduğu tek dizinin içinde en fazla bir kez sayılır.

Döngünün `nums` üzerinde değil **küme** üzerinde dönmesi de önemlidir. Aynı başlangıç sayısı dizide binlerce kez tekrar ediyorsa `nums` üzerinde dönmek aynı diziyi binlerce kez saydırır.

```csharp solution
public class Solution
{
    public int LongestConsecutive(int[] nums)
    {
        // Tekrarlar teke iner ve "x burada mı?" sorusu O(1)'de yanıtlanır.
        HashSet<int> set = new HashSet<int>(nums);
        int longest = 0;

        // nums değil küme üzerinde dön: çok kez tekrar eden bir başlangıç yalnızca bir kez sayılır.
        foreach (int num in set)
        {
            // num - 1 varsa num bir dizinin ortasındadır; o diziyi gerçek başlangıcı sayacak.
            if (set.Contains(num - 1))
                continue;

            int length = 1;
            while (set.Contains(num + length))
                length++;

            longest = Math.Max(longest, length);
        }

        return longest;
    }
}
```

```typescript solution
function longestConsecutive(nums: number[]): number {
  const set = new Set<number>(nums);
  let longest = 0;

  for (const num of set) {
    if (set.has(num - 1)) continue;

    let length = 1;
    while (set.has(num + length)) length++;

    longest = Math.max(longest, length);
  }

  return longest;
}
```

### Karmaşıklık

- **Zaman:** O(n). Küme O(n)'de kurulur; her sayı en fazla bir kez "başlangıç mı?" diye sorulur ve en fazla bir kez sayılır.
- **Alan:** O(n), küme için.

"Başlangıç mı?" denetimi olmadan çözüm yine doğru sonuç verir ama `[1, 2, 3, …, n]` gibi bir girdide her sayıdan sona kadar sayar ve O(n²)'ye düşer.

## Testler

```json
[
  { "args": [[100, 4, 200, 1, 3, 2]], "expected": 4, "sample": true },
  { "args": [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], "expected": 9, "sample": true },
  { "args": [[1, 0, 1, 2]], "expected": 3, "sample": true },
  { "args": [[]], "expected": 0 },
  { "args": [[7]], "expected": 1 },
  { "args": [[5, 5, 5]], "expected": 1 },
  { "args": [[10, 20, 30]], "expected": 1 },
  { "args": [[-1, -2, 0, 1]], "expected": 4 },
  { "args": [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]], "expected": 7 },
  { "args": [[1000000000, 999999999, -1000000000]], "expected": 2 }
]
```
