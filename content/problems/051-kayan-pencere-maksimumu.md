---
title: Kayan Pencere Maksimumu
difficulty: hard
tags: [dizi, kayan-pencere, kuyruk]
function: maxSlidingWindow
params:
  - { name: nums, type: "int[]" }
  - { name: k, type: "int" }
returns: "int[]"
---
Bir `nums` tam sayı dizisi ve `k` boyutunda bir kayan pencere veriliyor. Pencere dizinin en solundan başlar ve her adımda bir konum sağa kayarak dizinin en sağına kadar ilerler. Pencerede her seferinde yalnızca `k` sayı görünür.

Her pencere konumu için pencere içindeki **en büyük elemanı** içeren diziyi döndürün.

### Örnek 1

```text
Girdi:  nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
Çıktı:  [3, 3, 5, 5, 6, 7]
Açıklama:
Pencere konumu                Maksimum
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7
```

### Örnek 2

```text
Girdi:  nums = [1], k = 1
Çıktı:  [1]
Açıklama: Tek elemanlı pencerede maksimum kendisidir.
```

### Kısıtlar

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `1 <= k <= nums.length`

## İpuçları

- Her pencerede `k` elemanı baştan taramak O(n·k) sürer. Pencere kayarken hangi elemanların **bir daha asla maksimum olamayacağını** düşünün.
- Pencereye sağdan yeni bir `nums[right]` elemanı girdiğinde, pencerede ondan daha solda bulunan ve değeri `nums[right]`'tan küçük veya eşit olan hiçbir eleman artık maksimum olamaz; çünkü `nums[right]` hem onlardan büyüktür hem de pencerede onlardan daha uzun süre kalacaktır.
- İndeksleri **monotonik azalan** bir çift uçlu kuyrukta (Deque) tutun: yeni indeks eklemeden önce kuyruğun sonundan `nums[son] <= nums[right]` olan tüm indeksleri çıkarın.
- Kuyruğun başındaki indeks her zaman mevcut pencerenin en büyük elemanını gösterir; yalnızca pencere dışına çıktığında (`deque.First < right - k + 1`) baştan silinir.

## Çözüm

Her pencere için maksimumu O(1) zamanda bulmak adına, elemanların indekslerini değerleri **büyükten küçüğe** (monotonik azalan) sırada kalacak şekilde bir **çift uçlu kuyrukta (Deque)** tutarız.

`right` indeksindeki yeni elemanı işlerken üç adım uygularız:
1. **Süresi dolanı çıkar:** Kuyruğun en başındaki indeks pencerenin sol sınırının gerisinde kaldıysa (`deque.First.Value < right - k + 1`), onu kuyruğun başından çıkarırız.
2. **Küçükleri ele:** Kuyruğun sonundaki indekslerin değerleri `nums[right]`'tan küçük veya eşit oldukça (`nums[deque.Last.Value] <= nums[right]`), onları kuyruğun sonundan atarız. Çünkü `nums[right]` hem daha büyüktür hem de daha sağda olduğu için pencerede daha uzun yaşayacaktır; eski küçük elemanların maksimum olma şansı kalmamıştır.
3. **Ekle ve oku:** `right` indeksini kuyruğun sonuna ekleriz. İlk tam pencere oluştuğundan itibaren (`right >= k - 1`), her adımda kuyruğun en başındaki indeks (`nums[deque.First.Value]`) o pencerenin maksimumudur.

Her indeks kuyruğa tam bir kez girer ve en fazla bir kez çıkar; böylece tüm pencereler toplam O(n) zamanda hesaplanır.

```csharp solution
public class Solution
{
    public int[] MaxSlidingWindow(int[] nums, int k)
    {
        int n = nums.Length;
        int[] result = new int[n - k + 1];
        LinkedList<int> deque = new LinkedList<int>();

        for (int right = 0; right < n; right++)
        {
            // Pencere dışına çıkan indeksi kuyruğun başından at.
            if (deque.Count > 0 && deque.First!.Value < right - k + 1)
                deque.RemoveFirst();

            // Yeni elemandan küçük veya eşit olanları kuyruğun sonundan at.
            while (deque.Count > 0 && nums[deque.Last!.Value] <= nums[right])
                deque.RemoveLast();

            deque.AddLast(right);

            // İlk tam pencere oluştuğundan itibaren maksimumu kaydet.
            if (right >= k - 1)
                result[right - k + 1] = nums[deque.First!.Value];
        }

        return result;
    }
}
```

```typescript solution
function maxSlidingWindow(nums: number[], k: number): number[] {
  const n = nums.length;
  const result: number[] = [];
  const deque: number[] = [];
  let head = 0;

  for (let right = 0; right < n; right++) {
    if (head < deque.length && deque[head] < right - k + 1) {
      head++;
    }

    while (head < deque.length && nums[deque[deque.length - 1]] <= nums[right]) {
      deque.pop();
    }

    deque.push(right);

    if (right >= k - 1) {
      result.push(nums[deque[head]]);
    }
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her indeks çift uçlu kuyruğa bir kez eklenir ve en fazla bir kez çıkarılır.
- **Alan:** O(k) (çıktı dizisi hariç). Kuyrukta aynı anda en fazla bir pencere boyutu (`k`) kadar indeks bulunur.

## Testler

```json
[
  { "args": [[1, 3, -1, -3, 5, 3, 6, 7], 3], "expected": [3, 3, 5, 5, 6, 7], "sample": true },
  { "args": [[1], 1], "expected": [1], "sample": true },
  { "args": [[9, 11], 2], "expected": [11] },
  { "args": [[4, -2], 2], "expected": [4] },
  { "args": [[7, 2, 4], 2], "expected": [7, 4] },
  { "args": [[1, 3, 1, 2, 0, 5], 3], "expected": [3, 3, 2, 5] },
  { "args": [[5, 4, 3, 2, 1], 3], "expected": [5, 4, 3] },
  { "args": [[-7, -8, 7, 5, 7, 1, 6, 0], 4], "expected": [7, 7, 7, 7, 7] }
]
```
