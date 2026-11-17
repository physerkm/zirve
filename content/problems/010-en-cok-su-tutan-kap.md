---
title: En Çok Su Tutan Kap
difficulty: medium
tags: [dizi, iki-isaretci, acgozlu]
function: maxArea
params:
  - { name: height, type: "int[]" }
returns: "int"
---
`n` uzunluğunda bir tam sayı dizisi `height` veriliyor. `i`. konumda, `(i, 0)` ile `(i, height[i])` noktalarını birleştiren dikey bir çizgi vardır.

Bu çizgilerden ikisini seçerek x ekseniyle birlikte bir kap oluşturun. Kabın tutabileceği **en fazla su miktarını** döndürün. Kabı eğemezsiniz: su seviyesi kısa olan çizgide durur.

### Örnek 1

```text
Girdi:  height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
Çıktı:  49
Açıklama: 1. ve 8. indeksteki çizgiler (yükseklikler 8 ve 7) seçilir.
Genişlik 8 - 1 = 7, yükseklik min(8, 7) = 7, alan 7 × 7 = 49.
```

### Örnek 2

```text
Girdi:  height = [1, 1]
Çıktı:  1
```

### Kısıtlar

- `2 <= height.length <= 10^5`
- `0 <= height[i] <= 10^4`

## İpuçları

- Bütün çiftleri denemek O(n²) sürer. En geniş kapla, yani iki uçtaki çizgilerle başlayın.
- Genişliği bir azaltmanın karşılığında alanın artabilmesi için yüksekliğin artması gerekir. Hangi çizgiyi bırakmak mantıklı?
- Kısa olan çizgi, karşısındaki çizgi ne kadar uzun olursa olsun alanı sınırlar. Kısa olanı içeri kaydırın.

## Çözüm

### İki uçtan iki işaretçi

İki çizgi arasındaki alan `min(height[left], height[right]) × (right - left)` olur. En geniş aralıkla, `left = 0` ve `right = n - 1` ile başlarız.

Diyelim `height[left] < height[right]`. `left` çizgisini koruyup `right`'ı içeri kaydırmak işe yaramaz: genişlik azalır, yükseklik de en fazla `height[left]` olabilir. Yani `left`'in sağlayabileceği en iyi alan **şu an** hesaplanan alandır ve `left` artık güvenle elenebilir. Bu yüzden her adımda **kısa olan çizgiyi** içeri kaydırırız. Yükseklikler eşitse hangisinin kaydırıldığı önemli değildir.

```csharp solution
public class Solution
{
    public int MaxArea(int[] height)
    {
        var left = 0;
        var right = height.Length - 1;
        var best = 0;

        while (left < right)
        {
            var area = Math.Min(height[left], height[right]) * (right - left);
            best = Math.Max(best, area);

            if (height[left] < height[right])
            {
                left++;
            }
            else
            {
                right--;
            }
        }

        return best;
    }
}
```

```typescript solution
function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let best = 0;

  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    best = Math.max(best, area);

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return best;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her adımda bir işaretçi bir adım ilerler.
- **Alan:** O(1).

Mülakatta önemli olan, "kısa olanı kaydır" kuralının **neden** hiçbir iyi cevabı kaçırmadığını anlatabilmektir: elenen çizginin olası bütün kapları, az önce ölçülen kaptan büyük olamaz.

## Testler

```json
[
  { "args": [[1, 8, 6, 2, 5, 4, 8, 3, 7]], "expected": 49, "sample": true },
  { "args": [[1, 1]], "expected": 1, "sample": true },
  { "args": [[4, 3, 2, 1, 4]], "expected": 16 },
  { "args": [[1, 2, 1]], "expected": 2 },
  { "args": [[2, 3, 4, 5, 18, 17, 6]], "expected": 17 },
  { "args": [[1, 3, 2, 5, 25, 24, 5]], "expected": 24 },
  { "args": [[0, 0]], "expected": 0 },
  { "args": [[10000, 1, 10000]], "expected": 20000 }
]
```
