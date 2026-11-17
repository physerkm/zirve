---
title: Histogramdaki En Büyük Dikdörtgen
difficulty: hard
tags: [yigin, dizi]
function: largestRectangleArea
params:
  - { name: heights, type: "int[]" }
returns: "int"
---
Her çubuğun genişliğinin `1` olduğu bir histogramdaki çubuk yüksekliklerini temsil eden `heights` tam sayı dizisi veriliyor. Histogramın içine çizilebilecek **en büyük dikdörtgenin alanını** döndürün.

### Örnek 1

```text
Girdi:  heights = [2, 1, 5, 6, 2, 3]
Çıktı:  10
Açıklama: En büyük dikdörtgen 5 ve 6 yüksekliğindeki çubukları kapsar: yükseklik = 5, genişlik = 2, alan = 10.
```

### Örnek 2

```text
Girdi:  heights = [2, 4]
Çıktı:  4
Açıklama: Tek başına 4 yüksekliğindeki çubuk (4 · 1 = 4) veya her iki çubuğun tabanındaki 2 yüksekliğindeki dikdörtgen (2 · 2 = 4) en büyük alanı verir.
```

### Kısıtlar

- `1 <= heights.length <= 10^5`
- `0 <= heights[i] <= 10^4`

## İpuçları

- Her çubuk için "bu çubuğun yüksekliğini tam olarak kullanan en geniş dikdörtgen nereye kadar uzanır?" sorusunu düşünün.
- Bir çubuk, solunda ve sağında **kendisinden daha kısa** ilk çubuğa çarpana kadar genişleyebilir.
- Yığında `(başlangıçİndeksi, yükseklik)` çiftlerini artan yükseklik sırasıyla tutun: daha kısa bir çubuk geldiğinde, yığının tepesindeki daha uzun çubuklar sağ sınırlarına ulaşmış demektir.
- Uzun çubukları yığından çıkarırken (`Pop`), yeni gelen kısa çubuğun sol başlangıç sınırını çıkarılan çubukların başlangıcına doğru geriye genişletin.

## Çözüm

Bir çubuğun kendi yüksekliğiyle oluşturabileceği en geniş dikdörtgen, sağda ve solda **kendisinden daha kısa** bir çubuk görene kadar devam eder. Her çubuk için sola ve sağa tarama yapmak O(n²) sürer; bunun yerine **monotonik artan bir yığın** kullanarak her çubuğun sol ve sağ sınırını tek geçişte bulabiliriz.

Yığında `(Start, Height)` çiftlerini tutarız. Burada `Start`, o yüksekliğin sola doğru ne kadar geriden başlayabildiğini gösterir:

1. Soldan sağa ilerlerken `heights[i]` çubuğuna geliriz ve başlangıç sınırını `start = i` olarak alırız.
2. Yığının tepesindeki yükseklik `heights[i]` değerinden **büyük olduğu sürece**, tepedeki çubuk sağda daha kısa bir çubuğa çarpmıştır; yani sağa doğru daha fazla uzayamaz. Onu `Pop()` ile çıkarır, `prevHeight * (i - prevStart)` alanını hesaplayıp `maxArea`'yı güncelleriz.
3. Ayrıca yeni çubuğumuz, az önce çıkardığımız daha uzun çubukların içinden sola doğru uzanabileceği için `start = prevStart` diyerek sol sınırı geriye genişletiriz.
4. Döngü sonunda `(start, heights[i])` çiftini yığına ekleriz.
5. Dizi bittiğinde yığında kalan çubuklar dizinin en sonuna (`heights.Length`) kadar kesintisiz uzanabilmiş demektir; hepsini çıkarıp alanlarını kontrol ederiz.

```csharp solution
public class Solution
{
    public int LargestRectangleArea(int[] heights)
    {
        var stack = new Stack<(int Start, int Height)>();
        int maxArea = 0;

        for (int i = 0; i < heights.Length; i++)
        {
            int start = i;

            // Daha kısa bir çubuk geldiğinde, yığındaki daha uzun çubukların sağ sınırı i olur.
            while (stack.Count > 0 && stack.Peek().Height > heights[i])
            {
                var (prevStart, prevHeight) = stack.Pop();
                maxArea = Math.Max(maxArea, prevHeight * (i - prevStart));
                start = prevStart; // Kısa çubuk, uzun çubuğun başladığı yere kadar sola uzanabilir.
            }

            stack.Push((start, heights[i]));
        }

        // Dizi sonuna kadar kesintisiz ulaşan çubukların alanlarını hesapla.
        while (stack.Count > 0)
        {
            var (start, height) = stack.Pop();
            maxArea = Math.Max(maxArea, height * (heights.Length - start));
        }

        return maxArea;
    }
}
```

```typescript solution
function largestRectangleArea(heights: number[]): number {
  const stack: { start: number; height: number }[] = [];
  let maxArea = 0;

  for (let i = 0; i < heights.length; i++) {
    let start = i;

    while (stack.length > 0 && stack[stack.length - 1].height > heights[i]) {
      const { start: prevStart, height: prevHeight } = stack.pop()!;
      maxArea = Math.max(maxArea, prevHeight * (i - prevStart));
      start = prevStart;
    }

    stack.push({ start, height: heights[i] });
  }

  while (stack.length > 0) {
    const { start, height } = stack.pop()!;
    maxArea = Math.max(maxArea, height * (heights.length - start));
  }

  return maxArea;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her çubuk yığına tam olarak bir kez girer ve en fazla bir kez çıkar.
- **Alan:** O(n), artan yükseklikteki çubukları tutan yığın için.

## Testler

```json
[
  { "args": [[2, 1, 5, 6, 2, 3]], "expected": 10, "sample": true },
  { "args": [[2, 4]], "expected": 4, "sample": true },
  { "args": [[1]], "expected": 1 },
  { "args": [[0]], "expected": 0 },
  { "args": [[2, 1, 2]], "expected": 3 },
  { "args": [[6, 2, 5, 4, 5, 1, 6]], "expected": 12 },
  { "args": [[1, 2, 3, 4, 5]], "expected": 9 },
  { "args": [[5, 4, 3, 2, 1]], "expected": 9 }
]
```
