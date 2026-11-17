---
title: Son Taşın Ağırlığı
difficulty: easy
tags: [heap, dizi]
function: lastStoneWeight
params:
  - { name: stones, type: "int[]" }
returns: "int"
---
Pozitif tam sayılardan oluşan bir `stones` dizisi veriliyor; `stones[i]`, `i.` taşın ağırlığını gösterir.

Her turda kalan taşlar arasından **en ağır iki taşı** seçip birbirine çarpıyoruz. Bu iki taşın ağırlıkları `x` ve `y` (`x <= y`) olsun. Çarpışma sonucu şu şekilde belirlenir:

- Eğer `x == y` ise her iki taş da tamamen parçalanır ve oyundan çıkar.
- Eğer `x != y` ise `x` ağırlığındaki taş parçalanır, `y` ağırlığındaki taşın yeni ağırlığı `y - x` olur ve tekrar taşların arasına döner.

Oyun sonunda en fazla bir taş kalır. Kalan son taşın ağırlığını, hiç taş kalmadıysa `0` değerini döndürün.

### Örnek 1

```text
Girdi:  stones = [2, 7, 4, 1, 8, 1]
Çıktı:  1
Açıklama:
  7 ve 8 çarpışır -> 1 kalır, taşlar: [2, 4, 1, 1, 1]
  2 ve 4 çarpışır -> 2 kalır, taşlar: [2, 1, 1, 1]
  1 ve 2 çarpışır -> 1 kalır, taşlar: [1, 1, 1]
  1 ve 1 çarpışır -> ikisi de yok olur, taşlar: [1]
  Geriye kalan tek taşın ağırlığı 1'dir.
```

### Örnek 2

```text
Girdi:  stones = [1]
Çıktı:  1
Açıklama: Başlangıçta yalnızca bir taş olduğundan çarpışma olmaz; ağırlığı 1 olarak döner.
```

### Örnek 3

```text
Girdi:  stones = [2, 2]
Çıktı:  0
Açıklama: İki eşit taş çarpışınca ikisi de parçalanır ve geriye taş kalmaz.
```

### Kısıtlar

- `1 <= stones.length <= 30`
- `1 <= stones[i] <= 1000`

## İpuçları

- Her turda güncel taşlar arasındaki **en ağır iki taşa** ihtiyacımız var ve çarpışma sonucunda geriye parça kalırsa onu tekrar taşların arasına eklememiz gerekiyor.
- Diziyi her turda baştan sıralamak O(n² log n) zaman alır. Bunun yerine en büyük elemanı hızlıca veren ve yeni elemanı sırasını koruyarak ekleyen bir **Max-Heap (Öncelik Kuyruğu)** kullanın.
- C#'taki `PriorityQueue<TElement, TPriority>` varsayılan olarak en küçük öncelik değerini önce çıkarır (Min-Heap). Ağırlığın negatifini (`-stone`) öncelik olarak vererek onu doğrudan bir Max-Heap gibi çalıştırabilirsiniz.
- Kuyrukta birden fazla taş kaldığı sürece (`heap.Count > 1`) iki taş çekip farkları sıfırdan büyükse kuyruğa geri ekleyin.

## Çözüm

Simülasyonun her adımında elimizdeki en büyük iki sayıyı çekmemiz ve farkları sıfırdan farklıysa yeni oluşan sayıyı tekrar koleksiyona dahil etmemiz gerekir. Bu işlem kalıbı **Max-Heap** veri yapısının klasik kullanım alanıdır.

1. Bütün taşları bir Max-Heap içine ekleriz. C#'ta `PriorityQueue<int, int>` en küçük önceliği tepeye koyduğu için her taşı `(stone, -stone)` şeklinde negatif öncelikle ekleriz; böylece en ağır taş en küçük (en negatif) öncelik değerine sahip olur ve ilk sırada çıkar.
2. Heap'te en az iki taş bulunduğu sürece (`heap.Count > 1`) tepeden ardışık iki taş (`first` ve `second`) çekeriz. İlk çekilen taş her zaman ikinciden büyük veya ona eşittir (`first >= second`).
3. Eğer `first > second` ise aradaki farkı (`diff = first - second`) hesaplayıp yeniden heap'e ekleriz. Eşitlerse (`first == second`) ikisi de yok olduğu için hiçbir şey eklemeyiz.
4. Döngü bittiğinde heap'te bir taş kaldıysa onu, kalmadıysa `0` değerini döndürürüz.

```csharp solution
public class Solution
{
    public int LastStoneWeight(int[] stones)
    {
        PriorityQueue<int, int> heap = new PriorityQueue<int, int>();
        foreach (int stone in stones)
        {
            heap.Enqueue(stone, -stone);
        }

        while (heap.Count > 1)
        {
            int first = heap.Dequeue();
            int second = heap.Dequeue();

            if (first > second)
            {
                int diff = first - second;
                heap.Enqueue(diff, -diff);
            }
        }

        return heap.Count == 1 ? heap.Dequeue() : 0;
    }
}
```

```typescript solution
function lastStoneWeight(stones: number[]): number {
  const heap = [...stones];

  const siftDown = (idx: number): void => {
    const n = heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < n && heap[left] > heap[largest]) largest = left;
      if (right < n && heap[right] > heap[largest]) largest = right;
      if (largest === idx) break;

      [heap[idx], heap[largest]] = [heap[largest], heap[idx]];
      idx = largest;
    }
  };

  const siftUp = (idx: number): void => {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (heap[parent] >= heap[idx]) break;
      [heap[parent], heap[idx]] = [heap[idx], heap[parent]];
      idx = parent;
    }
  };

  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      siftDown(0);
    }
    return top;
  };

  const push = (val: number): void => {
    heap.push(val);
    siftUp(heap.length - 1);
  };

  for (let i = (heap.length >> 1) - 1; i >= 0; i--) {
    siftDown(i);
  }

  while (heap.length > 1) {
    const first = pop();
    const second = pop();
    if (first > second) {
      push(first - second);
    }
  }

  return heap.length === 1 ? heap[0] : 0;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). Her çarpışmada taş sayısı en az 1 azalır; en fazla `n - 1` çarpışma yaşanır ve her heap işlemi O(log n) sürer.
- **Alan:** O(n), taşları tutan Max-Heap için.

## Testler

```json
[
  { "args": [[2, 7, 4, 1, 8, 1]], "expected": 1, "sample": true },
  { "args": [[1]], "expected": 1, "sample": true },
  { "args": [[2, 2]], "expected": 0, "sample": true },
  { "args": [[10, 4, 2, 10]], "expected": 2 },
  { "args": [[3, 7, 2]], "expected": 2 },
  { "args": [[9, 3, 2, 10]], "expected": 0 },
  { "args": [[31, 26, 33, 21, 40]], "expected": 9 },
  { "args": [[5, 5, 5, 5]], "expected": 0 }
]
```
