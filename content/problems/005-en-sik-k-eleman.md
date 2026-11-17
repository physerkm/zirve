---
title: En Sık K Eleman
difficulty: medium
tags: [dizi, hash-tablosu, heap, siralama]
function: topKFrequent
params:
  - { name: nums, type: "int[]" }
  - { name: k, type: "int" }
returns: "int[]"
compare: unordered
---
Bir tam sayı dizisi `nums` ve bir tam sayı `k` veriliyor. Dizide **en sık tekrar eden `k` elemanı** döndürün. Cevabı herhangi bir sırada döndürebilirsiniz.

Cevabın her zaman tekil (benzersiz) olduğu garanti edilmektedir.

Algoritmanızın zaman karmaşıklığı **O(n log n)**'den daha iyi olmalıdır (`n`, dizinin uzunluğudur).

### Örnek 1

```text
Girdi:  nums = [1, 1, 1, 2, 2, 3], k = 2
Çıktı:  [1, 2]
Açıklama: 1 sayısı 3 kez, 2 sayısı 2 kez, 3 sayısı 1 kez geçer. En sık geçen 2 eleman 1 ve 2'dir.
```

### Örnek 2

```text
Girdi:  nums = [1], k = 1
Çıktı:  [1]
Açıklama: Dizide yalnızca 1 elemanı vardır.
```

### Örnek 3

```text
Girdi:  nums = [4, 4, 4, 6, 6, 2, 2, 2, 2], k = 2
Çıktı:  [2, 4]
Açıklama: 2 sayısı 4 kez, 4 sayısı 3 kez, 6 sayısı 2 kez geçer.
```

### Kısıtlar

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `k`, `[1, dizideki benzersiz eleman sayısı]` aralığındadır.
- Cevabın benzersiz olduğu garanti edilmektedir.

## İpuçları

- Önce her sayının kaç kez geçtiğini O(n) zamanda bir hash tablosu (`Dictionary` / `Map`) ile sayın.
- Frekanslara göre sıralamak O(n log n), boyutu `k` olan bir min-heap kullanmak O(n log k) sürer. Peki hiç sıralama yapmadan O(n) zamanda nasıl bulabiliriz?
- Bir sayının frekansı en fazla `nums.length` olabilir. İndeksleri frekans değerini temsil eden bir "kova dizisi" (bucket array) oluşturmayı düşünün.
- En yüksek frekanslı kovadan (`nums.length`) geriye doğru yürüyerek `k` adet elemanı toplayın.

## Çözüm

Her elemanın kaç kez tekrar ettiğini bir hash tablosu (`count`) ile O(n) zamanda sayarız. Buradan sonra elemanları frekanslarına göre sıralamak O(n log n) sürer; ancak frekans değerlerinin `1` ile `n` (`nums.Length`) arasında sınırlı olduğunu kullanarak **Kova Sıralaması (Bucket Sort)** ile süreyi O(n)'e indirebiliriz.

Boyutu `n + 1` olan bir `buckets` dizisi oluştururuz. Bu dizinin `f` indeksindeki liste, `nums` içinde tam olarak `f` kez geçen sayıları tutar. Hash tablosundaki her `(sayı, frekans)` çiftini ilgili `buckets[frekans]` kovasına ekleriz.

Son olarak `buckets` dizisini en sağdan (`n` indeksinden) sola doğru tararız. Boş olmayan kovalardaki sayıları sırayla sonuç dizisine yazarız ve `k` elemana ulaştığımız anda durup sonucu döndürürüz.

```csharp solution
public class Solution
{
    public int[] TopKFrequent(int[] nums, int k)
    {
        // 1. Her sayının tekrar sayısını (frekansını) hesapla.
        Dictionary<int, int> count = new Dictionary<int, int>();
        foreach (int num in nums)
        {
            count[num] = count.GetValueOrDefault(num, 0) + 1;
        }

        // 2. İndeksi frekans olan kovaları (bucket) oluştur.
        List<int>[] buckets = new List<int>[nums.Length + 1];
        foreach (KeyValuePair<int, int> pair in count)
        {
            int num = pair.Key;
            int freq = pair.Value;
            if (buckets[freq] == null)
                buckets[freq] = new List<int>();
            buckets[freq].Add(num);
        }

        // 3. En yüksek frekanstan geriye doğru k elemanı topla.
        int[] result = new int[k];
        int idx = 0;
        for (int f = buckets.Length - 1; f >= 1 && idx < k; f--)
        {
            if (buckets[f] == null)
                continue;

            foreach (int num in buckets[f])
            {
                result[idx++] = num;
                if (idx == k)
                    return result;
            }
        }

        return result;
    }
}
```

```typescript solution
function topKFrequent(nums: number[], k: number): number[] {
  const count = new Map<number, number>();
  for (const num of nums) {
    count.set(num, (count.get(num) ?? 0) + 1);
  }

  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of count.entries()) {
    buckets[freq].push(num);
  }

  const result: number[] = [];
  for (let f = buckets.length - 1; f >= 1 && result.length < k; f--) {
    for (const num of buckets[f]) {
      result.push(num);
      if (result.length === k) {
        return result;
      }
    }
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n). Frekansları saymak O(n), kovaları doldurmak O(n) ve kovaları sondan başa taramak en fazla O(n) adım sürer.
- **Alan:** O(n). Frekans tablosu ve `n + 1` boyutlu kova dizisi toplamda en fazla `n` benzersiz eleman barındırır.

## Testler

```json
[
  { "args": [[1, 1, 1, 2, 2, 3], 2], "expected": [1, 2], "sample": true },
  { "args": [[1], 1], "expected": [1], "sample": true },
  { "args": [[4, 4, 4, 6, 6, 2, 2, 2, 2], 2], "expected": [2, 4], "sample": true },
  { "args": [[-1, -1], 1], "expected": [-1] },
  { "args": [[1, 2], 2], "expected": [1, 2] },
  { "args": [[3, 0, 1, 0], 1], "expected": [0] },
  { "args": [[5, 3, 1, 1, 1, 3, 73, 1], 2], "expected": [1, 3] },
  { "args": [[7, 7, 8, 8, 8, 9, 9, 9, 9], 3], "expected": [9, 8, 7] }
]
```
