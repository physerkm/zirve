---
title: Yağmur Suyu Biriktirme
difficulty: hard
tags: [dizi, iki-isaretci, yigin, dinamik-programlama]
function: trap
params:
  - { name: height, type: "int[]" }
returns: "int"
---
Her birinin genişliği `1` olan sütunlardan oluşan bir yükselti haritası, negatif olmayan tam sayılardan oluşan `height` dizisiyle veriliyor. Yağmur yağdıktan sonra sütunların arasında **ne kadar su birikeceğini** hesaplayın.

### Örnek 1

```text
Girdi:  height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
Çıktı:  6
Açıklama: 2, 4, 5, 6 ve 9. indekslerin üstünde toplam 6 birim su birikir.
```

### Örnek 2

```text
Girdi:  height = [4, 2, 0, 3, 2, 5]
Çıktı:  9
```

### Kısıtlar

- `1 <= height.length <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

## İpuçları

- Tek bir sütunu düşünün: üstünde ne kadar su durur? Solundaki en yüksek ve sağındaki en yüksek sütun ne işe yarar?
- `i` sütununun üstündeki su `min(solMaks, sağMaks) - height[i]` olur. Her sütun için iki maksimumu önceden hesaplarsanız O(n) zaman, O(n) alan elde edersiniz.
- Ek dizileri atmak için iki işaretçi kullanın: maksimumu küçük olan taraftaki sütunun suyu kesin olarak bellidir.

## Çözüm

### Sütun başına su

`i` sütununun üstündeki su seviyesi, solundaki en yüksek duvar ile sağındaki en yüksek duvarın **kısa olanına** kadar çıkar: `su[i] = min(solMaks[i], sağMaks[i]) - height[i]`. Bu iki maksimumu ayrı dizilerde tutmak O(n) alan ister.

### İki işaretçiyle O(1) alan

`left` ve `right` iki uçtan başlar; `leftMax` soldan, `rightMax` sağdan görülen en yüksek duvarı tutar. `leftMax < rightMax` ise, `left` sütununun sağında **en az** `rightMax` yüksekliğinde bir duvar olduğu kesindir. Dolayısıyla `left`'in su seviyesini sınırlayan `leftMax`'tir ve suyu hemen hesaplanabilir: `leftMax - height[left]`. Sonra `left` bir sağa geçer. Simetrik durumda sağ taraf işlenir.

Önce maksimumu güncelleyip sonra suyu eklemek, sütunun kendisi en yüksekse suyu kendiliğinden `0` yapar.

```csharp solution
public class Solution
{
    public int Trap(int[] height)
    {
        var left = 0;
        var right = height.Length - 1;
        var leftMax = 0;
        var rightMax = 0;
        var water = 0;

        while (left < right)
        {
            leftMax = Math.Max(leftMax, height[left]);
            rightMax = Math.Max(rightMax, height[right]);

            if (leftMax < rightMax)
            {
                water += leftMax - height[left];
                left++;
            }
            else
            {
                water += rightMax - height[right];
                right--;
            }
        }

        return water;
    }
}
```

```typescript solution
function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);

    if (leftMax < rightMax) {
      water += leftMax - height[left];
      left++;
    } else {
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her sütun bir kez işlenir.
- **Alan:** O(1).

Monoton yığınla da O(n) çözüm vardır (suyu yatay katmanlar halinde toplar), ama iki işaretçi hem daha kısa hem de sabit alanlıdır.

## Testler

```json
[
  { "args": [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], "expected": 6, "sample": true },
  { "args": [[4, 2, 0, 3, 2, 5]], "expected": 9, "sample": true },
  { "args": [[1]], "expected": 0 },
  { "args": [[3, 0, 3]], "expected": 3 },
  { "args": [[5, 4, 3, 2, 1]], "expected": 0 },
  { "args": [[2, 0, 2, 0, 2]], "expected": 4 },
  { "args": [[0, 7, 1, 4, 6]], "expected": 7 },
  { "args": [[4, 2, 3]], "expected": 1 },
  { "args": [[100000, 0, 100000]], "expected": 100000 }
]
```
