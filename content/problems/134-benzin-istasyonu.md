---
title: Benzin İstasyonu
difficulty: medium
tags: [acgozlu, dizi]
function: canCompleteCircuit
params:
  - { name: gas, type: "int[]" }
  - { name: cost, type: "int[]" }
returns: "int"
---
Dairesel bir yol üzerinde `n` benzin istasyonu var. `i`. istasyonda `gas[i]` birim benzin alınabiliyor; `i`. istasyondan bir sonrakine gitmek `cost[i]` birim benzin harcıyor. Deposu sınırsız olan bir arabayla, deposu boş olarak istasyonlardan birinden yola çıkıyorsunuz.

Yolu saat yönünde **bir tur** tamamlayabileceğiniz başlangıç istasyonunun indeksini döndürün; mümkün değilse `-1` döndürün. Çözüm varsa **tektir**.

### Örnek 1

```text
Girdi:  gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]
Çıktı:  3
Açıklama: 3. istasyondan 4 birimle başla. 4. istasyona 4 - 1 + 5 = 8 ile varılır, 0'a 8 - 2 + 1 = 7,
1'e 7 - 3 + 2 = 6, 2'ye 6 - 4 + 3 = 5, 3'e 5 - 5 = 0 ile dönülür.
```

### Örnek 2

```text
Girdi:  gas = [2, 3, 4], cost = [3, 4, 3]
Çıktı:  -1
```

### Kısıtlar

- `n == gas.length == cost.length`, `1 <= n <= 10^5`
- `0 <= gas[i], cost[i] <= 10^4`

## İpuçları

- Toplam benzin toplam maliyetten azsa tur imkânsızdır. Değilse bir çözüm mutlaka vardır.
- `s` istasyonundan başlayıp `k`'ya varmadan deponuz negatife düşerse, `s` ile `k` arasındaki **hiçbir** istasyon da başlangıç olamaz. Neden?
- Depoyu bir kez gezin; negatife düşünce başlangıcı bir sonraki istasyona taşıyıp depoyu sıfırlayın.

## Çözüm

### Tek geçişte açgözlü seçim

1. `sum(gas) < sum(cost)` ise cevap `-1`.
2. Aksi halde `start = 0`, `tank = 0` ile başlarız. Her istasyonda `tank += gas[i] - cost[i]`. Tank negatife düşerse `start = i + 1`, `tank = 0`.

Neden `start` ile `i` arasındaki istasyonları atlayabiliriz? `start`'tan çıkıp `j`'ye (`start < j <= i`) her vardığımızda tankımız **negatif değildi**. `j`'den sıfır tankla başlamak, `start`'tan gelen bu artı katkıdan yoksun kalmak demektir; dolayısıyla `j`'den başlayan tur da `i`'de takılır. Toplam benzin yeterli olduğunda son kalan `start` turu tamamlar.

```csharp solution
public class Solution
{
    public int CanCompleteCircuit(int[] gas, int[] cost)
    {
        if (gas.Sum() < cost.Sum())
        {
            return -1;
        }

        var start = 0;
        var tank = 0;
        for (var i = 0; i < gas.Length; i++)
        {
            tank += gas[i] - cost[i];
            if (tank < 0)
            {
                start = i + 1;
                tank = 0;
            }
        }

        return start;
    }
}
```

```typescript solution
function canCompleteCircuit(gas: number[], cost: number[]): number {
  const total = gas.reduce((a, b) => a + b, 0) - cost.reduce((a, b) => a + b, 0);
  if (total < 0) return -1;

  let start = 0;
  let tank = 0;
  for (let i = 0; i < gas.length; i++) {
    tank += gas[i] - cost[i];
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }

  return start;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1).

## Testler

```json
[
  { "args": [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], "expected": 3, "sample": true },
  { "args": [[2, 3, 4], [3, 4, 3]], "expected": -1, "sample": true },
  { "args": [[5], [4]], "expected": 0 },
  { "args": [[1], [2]], "expected": -1 },
  { "args": [[3, 1, 1], [1, 2, 2]], "expected": 0 },
  { "args": [[5, 1, 2, 3, 4], [4, 4, 1, 5, 1]], "expected": 4 },
  { "args": [[2, 0, 1, 2, 3, 4, 0], [0, 1, 0, 0, 0, 0, 11]], "expected": 0 }
]
```
