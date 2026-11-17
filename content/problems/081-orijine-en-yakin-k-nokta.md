---
title: Orijine En Yakın K Nokta
difficulty: medium
tags: [heap, dizi, siralama]
function: kClosest
params:
  - { name: points, type: "int[][]" }
  - { name: k, type: "int" }
returns: "int[][]"
compare: unordered
---
Koordinat düzlemindeki noktaları temsil eden bir `points` dizisi (`points[i] = [xi, yi]`) ve bir `k` tam sayısı veriliyor. Orijine (`(0, 0)` noktasına) **en yakın `k` noktayı** döndürün.

İki nokta arasındaki uzaklık Öklid mesafesi ile ölçülür: orijine olan uzaklık `√(x² + y²)` formülüyle hesaplanır. Cevabı **herhangi bir sırada** döndürebilirsiniz; cevabın tekil (benzersiz) olduğu garanti edilmektedir.

### Örnek 1

```text
Girdi:  points = [[1, 3], [-2, 2]], k = 1
Çıktı:  [[-2, 2]]
Açıklama:
  (1, 3) noktasının orijine uzaklığı √(1 + 9) = √10.
  (-2, 2) noktasının orijine uzaklığı √(4 + 4) = √8.
  √8 < √10 olduğundan orijine en yakın nokta [-2, 2]'dir.
```

### Örnek 2

```text
Girdi:  points = [[3, 3], [5, -1], [-2, 4]], k = 2
Çıktı:  [[3, 3], [-2, 4]]
Açıklama:
  Mesafelerin kareleri sırasıyla 18, 26 ve 20'dir. En küçük iki mesafe 18 ve 20 olduğundan [3, 3] ve [-2, 4] döner.
```

### Kısıtlar

- `1 <= k <= points.length <= 10^4`
- `-10^4 <= xi, yi <= 10^4`

## İpuçları

- Uzaklıkları karşılaştırırken karekök (`Math.Sqrt`) almanıza gerek yoktur: `√(x₁² + y₁²) < √(x₂² + y₂²)` eşitsizliği doğrudan `x₁² + y₁² < x₂² + y₂²` ile aynıdır.
- Bütün diziyi sıralamak O(n log n) sürer. Oysa bizim yalnızca en yakın `k` noktayı tutmamız yeterlidir.
- Şimdiye kadar gördüğümüz en yakın `k` noktayı bir arada tutarken, yeni bir nokta geldiğinde içlerinden **en uzaktakini** hızlıca elemek için hangi veri yapısını kullanmalıyız?
- Boyutu `k` ile sınırlandırılmış bir **Max-Heap** kullanın: her noktayı ekleyin, boyut `k`'yı aşarsa tepedeki (en uzak) noktayı çıkarın.

## Çözüm

Tüm noktaları mesafelerine göre sıralamak O(n log n) zaman alır; ancak `k` değeri `n`'den çok küçük olduğunda tüm diziyi sıralamak gereksizdir. Yalnızca şimdiye kadar karşılaştığımız **en yakın `k` adayı** saklamamız yeterlidir.

Yeni bir nokta incelenirken, elimizdeki `k` adaydan daha yakın olup olmadığını anlamak için adaylar arasındaki **en uzak noktaya** bakmamız gerekir. En uzak adayı O(1)'de görmek ve gerekirse O(log k)'da çıkarmak için **Max-Heap** kullanırız:

1. Her nokta için karekök almadan `dist = x² + y²` değerini hesaplarız.
2. Noktayı `-dist` önceliğiyle `PriorityQueue` içine ekleriz (negatif öncelik sayesinde `dist` değeri en büyük olan, yani en uzak nokta heap'in tepesinde durur).
3. Heap'in eleman sayısı `k`'yı geçtiği anda (`maxHeap.Count > k`) tepedeki en uzak noktayı `Dequeue()` ile atarız.
4. Dizi bittiğinde heap içinde tam olarak orijine en yakın `k` nokta kalır.

```csharp solution
public class Solution
{
    public int[][] KClosest(int[][] points, int k)
    {
        PriorityQueue<int[], int> maxHeap = new PriorityQueue<int[], int>();

        foreach (int[] p in points)
        {
            int dist = p[0] * p[0] + p[1] * p[1];
            maxHeap.Enqueue(p, -dist);

            if (maxHeap.Count > k)
            {
                maxHeap.Dequeue();
            }
        }

        int[][] result = new int[k][];
        for (int i = 0; i < k; i++)
        {
            result[i] = maxHeap.Dequeue();
        }

        return result;
    }
}
```

```typescript solution
function kClosest(points: number[][], k: number): number[][] {
  const heap: { point: number[]; dist: number }[] = [];

  const siftUp = (idx: number): void => {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (heap[parent].dist >= heap[idx].dist) break;
      [heap[parent], heap[idx]] = [heap[idx], heap[parent]];
      idx = parent;
    }
  };

  const siftDown = (idx: number): void => {
    const n = heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && heap[left].dist > heap[largest].dist) largest = left;
      if (right < n && heap[right].dist > heap[largest].dist) largest = right;
      if (largest === idx) break;
      [heap[idx], heap[largest]] = [heap[largest], heap[idx]];
      idx = largest;
    }
  };

  for (const point of points) {
    const dist = point[0] * point[0] + point[1] * point[1];
    heap.push({ point, dist });
    siftUp(heap.length - 1);

    if (heap.length > k) {
      const last = heap.pop()!;
      if (heap.length > 0) {
        heap[0] = last;
        siftDown(0);
      }
    }
  }

  return heap.map((item) => item.point);
}
```

### Karmaşıklık

- **Zaman:** O(n log k). Heap'in boyutu hiçbir zaman `k + 1`'i geçmez; bu nedenle her ekleme ve çıkarma işlemi O(log k) sürer.
- **Alan:** O(k), heap'te tutulan en fazla `k + 1` eleman için.

## Testler

```json
[
  { "args": [[[1, 3], [-2, 2]], 1], "expected": [[-2, 2]], "sample": true },
  { "args": [[[3, 3], [5, -1], [-2, 4]], 2], "expected": [[3, 3], [-2, 4]], "sample": true },
  { "args": [[[0, 1], [1, 0]], 2], "expected": [[0, 1], [1, 0]] },
  { "args": [[[2, 2], [1, 1], [3, 3]], 1], "expected": [[1, 1]] },
  { "args": [[[-5, 4], [-6, -5], [4, 6]], 2], "expected": [[-5, 4], [4, 6]] },
  { "args": [[[10, -2], [2, -2], [10, 10], [9, 4], [-8, 1]], 3], "expected": [[2, -2], [-8, 1], [9, 4]] },
  { "args": [[[0, 0], [1, 2], [-3, 4]], 1], "expected": [[0, 0]] }
]
```
