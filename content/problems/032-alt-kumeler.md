---
title: Alt Kümeler
difficulty: medium
tags: [geri-izleme, dizi, ozyineleme]
function: subsets
params:
  - { name: nums, type: "int[]" }
returns: "List<List<int>>"
compare: unordered-nested
---
Elemanları **birbirinden farklı** bir tam sayı dizisi `nums` veriliyor. Dizinin **bütün alt kümelerini** (kuvvet kümesini) döndürün.

Sonuçta aynı alt küme birden fazla kez yer almamalıdır. Alt kümeleri ve elemanlarını istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  nums = [1, 2, 3]
Çıktı:  [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]
```

### Örnek 2

```text
Girdi:  nums = [0]
Çıktı:  [[], [0]]
```

### Kısıtlar

- `1 <= nums.length <= 10`
- Bütün elemanlar birbirinden farklıdır.

## İpuçları

- `n` elemanlı bir kümenin kaç alt kümesi vardır? Her eleman için iki seçenek olduğunu düşünün.
- Her eleman için bir karar verin: alt kümeye **al** ya da **alma**. Bu kararlar bir karar ağacı oluşturur.
- Geri izleme: elemanı ekleyin, özyinelemeye girin, sonra elemanı **geri çıkarın**.

## Çözüm

Her eleman ya alt kümededir ya değildir; `n` eleman için 2ⁿ alt küme vardır. Geri izleme ile bu karar ağacını gezeriz.

`current`, o ana kadar seçilmiş elemanları tutar. Her çağrıda önce `current`'ın bir **kopyasını** sonuca ekleriz (her düğüm geçerli bir alt kümedir). Sonra `start` indeksinden itibaren her elemanı sırayla ekler, kalan elemanlar için özyinelemeye girer ve dönüşte elemanı geri çıkarırız. Yalnızca ileri doğru (`i + 1`) gitmek, aynı alt kümenin farklı sıralarla yeniden üretilmesini önler.

```csharp solution
public class Solution
{
    public IList<IList<int>> Subsets(int[] nums)
    {
        var result = new List<IList<int>>();
        Build(nums, 0, new List<int>(), result);
        return result;
    }

    private void Build(int[] nums, int start, List<int> current, List<IList<int>> result)
    {
        result.Add(new List<int>(current));   // kopya: current sonradan değişecek

        for (var i = start; i < nums.Length; i++)
        {
            current.Add(nums[i]);
            Build(nums, i + 1, current, result);
            current.RemoveAt(current.Count - 1);
        }
    }
}
```

```typescript solution
function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  const current: number[] = [];

  const build = (start: number): void => {
    result.push([...current]);

    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);
      build(i + 1);
      current.pop();
    }
  };

  build(0);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n · 2ⁿ). 2ⁿ alt küme vardır ve her birini kopyalamak O(n) sürer.
- **Alan:** Çıktı hariç O(n) (özyineleme derinliği ve `current`).

En sık yapılan hata, sonuca `current`'ın kopyası yerine **kendisini** eklemektir: bütün girdiler aynı listeyi gösterir ve sonunda hepsi boş görünür.

Bu "seç, in, geri al" iskeleti; permütasyonlar, kombinasyonlar, hedef toplam ve N vezir gibi bütün geri izleme problemlerinin temelidir.

## Testler

```json
[
  { "args": [[1, 2, 3]], "expected": [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]], "sample": true },
  { "args": [[0]], "expected": [[], [0]], "sample": true },
  { "args": [[5, -1]], "expected": [[], [5], [-1], [5, -1]] },
  { "args": [[1, 2, 3, 4]], "expected": [[], [1], [2], [3], [4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4], [1, 2, 3, 4]] }
]
```
