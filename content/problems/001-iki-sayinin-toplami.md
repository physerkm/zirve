---
title: İki Sayının Toplamı
difficulty: easy
tags: [dizi, hash-tablosu]
function: twoSum
params:
  - { name: nums, type: "int[]" }
  - { name: target, type: "int" }
returns: "int[]"
compare: unordered
---
Bir tam sayı dizisi `nums` ve bir hedef değer `target` veriliyor. Toplamları `target` eden **iki farklı elemanın indekslerini** döndürün.

Her girdinin tam olarak bir çözümü olduğunu varsayabilirsiniz. Aynı elemanı iki kez kullanamazsınız. İndeksleri istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  nums = [2, 7, 11, 15], target = 9
Çıktı:  [0, 1]
Açıklama: nums[0] + nums[1] = 2 + 7 = 9
```

### Örnek 2

```text
Girdi:  nums = [3, 2, 4], target = 6
Çıktı:  [1, 2]
```

### Kısıtlar

- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i], target <= 10^9`
- Tam olarak bir geçerli yanıt vardır.

**Devam sorusu:** O(n²)'den daha hızlı bir çözüm bulabilir misiniz?

## İpuçları

- Her eleman için "bu elemanla toplamı hedefi veren sayı daha önce geçti mi?" sorusunu sorun.
- Bir değerin daha önce görülüp görülmediğini O(1)'de yanıtlayan veri yapısı hangisidir?
- Hash tablosunda değeri anahtar, indeksi değer olarak saklayın. Böylece dizi üzerinden tek geçiş yeterli olur.

## Çözüm

### Kaba kuvvet

Bütün çiftleri denemek en doğrudan çözümdür: iki iç içe döngü, O(n²) zaman, O(1) ek alan. Mülakatta bunu **söylemek** iyidir; ama burada durmak yetmez.

### Tek geçişte hash tablosu

`x` elemanına bakarken aradığımız şey bellidir: `target - x`. Soru, "bu değeri daha önce gördüm mü?" sorusuna dönüşür ve bunu hash tablosu O(1)'de yanıtlar.

Diziyi soldan sağa gezeriz. Her eleman için önce tamamlayıcısının tabloda olup olmadığına bakar, yoksa elemanın kendisini indeksiyle birlikte tabloya ekleriz. Önce bakıp sonra eklemek, aynı elemanın kendisiyle eşleşmesini kendiliğinden engeller.

```csharp solution
public class Solution
{
    public int[] TwoSum(int[] nums, int target)
    {
        var indexByValue = new Dictionary<int, int>();

        for (var i = 0; i < nums.Length; i++)
        {
            if (indexByValue.TryGetValue(target - nums[i], out var j))
            {
                return new[] { j, i };
            }

            indexByValue[nums[i]] = i;
        }

        return Array.Empty<int>();
    }
}
```

```typescript solution
function twoSum(nums: number[], target: number): number[] {
  const indexByValue = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const j = indexByValue.get(target - nums[i]);
    if (j !== undefined) {
      return [j, i];
    }

    indexByValue.set(nums[i], i);
  }

  return [];
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizi bir kez gezilir; her adımda bir tablo araması ve bir ekleme yapılır.
- **Alan:** O(n). En kötü durumda bütün elemanlar tabloya girer.

Bu problem, mülakatlarda en sık karşılaşılan ödünleşimin en yalın örneğidir: **ek bellek harcayarak zaman kazanmak.**

## Testler

```json
[
  { "args": [[2, 7, 11, 15], 9], "expected": [0, 1], "sample": true },
  { "args": [[3, 2, 4], 6], "expected": [1, 2], "sample": true },
  { "args": [[3, 3], 6], "expected": [0, 1], "sample": true },
  { "args": [[-1, -2, -3, -4, -5], -8], "expected": [2, 4] },
  { "args": [[0, 4, 3, 0], 0], "expected": [0, 3] },
  { "args": [[1000000000, 5, -1000000000, 7], 12], "expected": [1, 3] },
  { "args": [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 19], "expected": [8, 9] },
  { "args": [[5, 75, 25], 100], "expected": [1, 2] }
]
```
