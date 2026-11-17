---
title: Toplamı K Olan Alt Dizi Sayısı
difficulty: medium
tags: [dizi, on-ek-toplami, hash-tablosu]
function: subarraySum
params:
  - { name: nums, type: "int[]" }
  - { name: k, type: "int" }
returns: "int"
---
Bir tam sayı dizisi `nums` ve bir tam sayı `k` veriliyor. Elemanlarının toplamı `k`'ya eşit olan **kesintisiz (bitişik) alt dizilerin** toplam sayısını döndürün.

Alt dizi, dizinin içindeki ardışık ve boş olmayan elemanlardan oluşan bir bölümdür.

### Örnek 1

```text
Girdi:  nums = [1, 1, 1], k = 2
Çıktı:  2
Açıklama: Toplamı 2 olan alt diziler [0..1] ve [1..2] aralığındaki [1, 1] alt dizileridir.
```

### Örnek 2

```text
Girdi:  nums = [1, 2, 3], k = 3
Çıktı:  2
Açıklama: [1, 2] ve [3] alt dizilerinin toplamı 3'tür.
```

### Örnek 3

```text
Girdi:  nums = [1, -1, 0], k = 0
Çıktı:  3
Açıklama: [1, -1], [0] ve [1, -1, 0] alt dizilerinin toplamı 0'dır.
```

### Kısıtlar

- `1 <= nums.length <= 2 * 10^4`
- `-1000 <= nums[i] <= 1000`
- `-10^7 <= k <= 10^7`

## İpuçları

- Dizide negatif sayılar ve sıfırlar bulunabildiği için pencereyi büyütmek toplamı her zaman artırmaz, küçültmek de her zaman azaltmaz; bu yüzden kayan pencere (sliding window) yöntemi burada çalışmaz.
- `i` ile `j` indeksleri arasındaki alt dizinin toplamı, `j` indeksine kadarki ön ek toplamından (`curSum`) `i - 1` indeksine kadarki ön ek toplamının çıkarılmasına eşittir.
- Şu anki ön ek toplamı `curSum` ise, "daha önce `curSum - k` değerinde kaç tane ön ek toplamı gördük?" sorusunun cevabı, şu anki elemanda biten ve toplamı `k` olan alt dizi sayısını verir.
- Dizinin en başından başlayan alt dizileri kaçırmamak için hash tablosuna başlangıçta `{0: 1}` kaydını eklemeyi unutmayın.

## Çözüm

Dizide negatif sayılar olabildiği için iki işaretçi veya kayan pencere kullanamayız; çünkü sağa doğru ilerlerken toplam artabileceği gibi azalabilir de. Bunun yerine **ön ek toplamı (prefix sum)** ve **hash tablosu** ikilisini kullanırız.

Dizinin başından mevcut indekse kadar olan elemanların toplamına `curSum` diyelim. Eğer daha önceki bir noktada ön ek toplamı `curSum - k` olmuşsa, o noktadan mevcut indekse kadar olan alt dizinin elemanları toplamı tam olarak `curSum - (curSum - k) = k` demektir.

Negatif sayılar ve sıfırlar yüzünden aynı ön ek toplamı birden fazla kez oluşabilir. Bu nedenle bir hash tablosunda (`prefixCounts`) her ön ek toplamının **kaç kez görüldüğünü** saklarız:

1. Başlangıçta hiçbir eleman seçilmemişken toplam `0`'dır; bu durumu temsil etmek için tabloyu `{0: 1}` ile başlatırız.
2. Her `num` elemanında `curSum += num` yaparız.
3. Tabloda `curSum - k` anahtarı varsa, frekansını `count` değişkenine ekleriz.
4. Son olarak `curSum` değerinin tablodaki frekansını 1 artırırız (önce kontrol edip sonra eklemek, `k = 0` olduğunda boş alt diziyi yanlışlıkla saymamızı önler).

```csharp solution
public class Solution
{
    public int SubarraySum(int[] nums, int k)
    {
        // { ön_ek_toplamı : görülme_sayısı } — başlangıçtaki boş toplam için 0: 1
        var prefixCounts = new Dictionary<int, int> { [0] = 1 };
        int curSum = 0;
        int count = 0;

        foreach (int num in nums)
        {
            curSum += num;

            // Daha önce (curSum - k) toplamını kaç kez gördüysek o kadar geçerli alt dizi burada biter.
            if (prefixCounts.TryGetValue(curSum - k, out int freq))
                count += freq;

            prefixCounts[curSum] = prefixCounts.GetValueOrDefault(curSum, 0) + 1;
        }

        return count;
    }
}
```

```typescript solution
function subarraySum(nums: number[], k: number): number {
  const prefixCounts = new Map<number, number>([[0, 1]]);
  let curSum = 0;
  let count = 0;

  for (const num of nums) {
    curSum += num;
    count += prefixCounts.get(curSum - k) ?? 0;
    prefixCounts.set(curSum, (prefixCounts.get(curSum) ?? 0) + 1);
  }

  return count;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizi tek bir geçişte taranır; her adımda hash tablosu sorgusu ve güncellemesi ortalama O(1) sürer.
- **Alan:** O(n). En kötü durumda tüm ön ek toplamları birbirinden farklı olur ve hash tablosunda `n + 1` kayıt tutulur.

## Testler

```json
[
  { "args": [[1, 1, 1], 2], "expected": 2, "sample": true },
  { "args": [[1, 2, 3], 3], "expected": 2, "sample": true },
  { "args": [[1, -1, 0], 0], "expected": 3, "sample": true },
  { "args": [[3, 4, 7, 2, -3, 1, 4, 2], 7], "expected": 4 },
  { "args": [[0, 0, 0], 0], "expected": 6 },
  { "args": [[-1, -1, 1], 0], "expected": 1 },
  { "args": [[5], 5], "expected": 1 },
  { "args": [[1, 2, 3], 7], "expected": 0 }
]
```
