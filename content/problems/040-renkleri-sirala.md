---
title: Renkleri Sırala
difficulty: medium
tags: [iki-isaretci, siralama, dizi]
function: sortColors
params:
  - { name: nums, type: "int[]" }
returns: "int[]"
---
Kırmızı, beyaz ve mavi renkli nesnelerden oluşan bir dizi `nums` veriliyor. Renkler sırasıyla `0`, `1` ve `2` sayılarıyla gösterilir.

Diziyi, aynı renkteki nesneler yan yana gelecek ve renkler kırmızı, beyaz, mavi sırasında olacak biçimde **yerinde** sıralayın ve sıralanmış diziyi döndürün.

Kütüphanenin hazır sıralama fonksiyonunu kullanmayın.

### Örnek 1

```text
Girdi:  nums = [2, 0, 2, 1, 1, 0]
Çıktı:  [0, 0, 1, 1, 2, 2]
```

### Örnek 2

```text
Girdi:  nums = [2, 0, 1]
Çıktı:  [0, 1, 2]
```

### Kısıtlar

- `1 <= nums.length <= 300`
- `nums[i]` yalnızca `0`, `1` ya da `2` olabilir.

**Devam sorusu:** Diziyi yalnızca **tek geçişte** ve sabit ek bellekle sıralayabilir misiniz?

## İpuçları

- Basit çözüm iki geçiştir: önce 0, 1 ve 2'leri sayın, sonra diziyi bu sayılara göre yeniden yazın.
- Tek geçiş için diziyi bölgelere ayırın: başta 0'lar, sonda 2'ler, ortada 1'ler ve henüz bakılmamış elemanlar.
- Üç işaretçi kullanın: 0'ların bittiği yer, şu an bakılan eleman ve 2'lerin başladığı yer.
- Bir 2'yi sona attığınızda oradan gelen elemana henüz bakmadınız. O turda ilerlemeyin.

## Çözüm

Bu, "Hollanda bayrağı" problemi olarak bilinir. Diziyi üç işaretçiyle dört bölgeye ayırırız:

```text
[0, low)       0'lar
[low, mid)     1'ler
[mid, high]    henüz bakılmadı
(high, son]    2'ler
```

Başlangıçta bütün dizi "bakılmadı" bölgesidir. Her turda `nums[mid]`'e bakarız:

- **0 ise** `low`'daki elemanla yer değiştirir; `low` ve `mid` birer ilerler. `low`'dan geri gelen eleman ya bir 1'dir ya da (`low == mid` iken) aynı 0'dır; ikisinde de yeniden bakmaya gerek yoktur.
- **1 ise** zaten doğru bölgededir; yalnızca `mid` ilerler.
- **2 ise** `high`'daki elemanla yer değiştirir ve `high` bir geri gelir. `high`'dan gelen elemana henüz bakılmadığı için **`mid` ilerlemez**; sonraki turda o eleman incelenir.

Her turda ya `mid` sağa ya `high` sola gider; "bakılmadı" bölgesi her turda bir eleman küçülür ve döngü tam `n` turda biter.

```csharp solution
public class Solution
{
    public int[] SortColors(int[] nums)
    {
        // Dizi dört bölge olarak tutulur:
        //   [0, low)       0'lar
        //   [low, mid)     1'ler
        //   [mid, high]    henüz bakılmadı
        //   (high, son]    2'ler
        int low = 0;
        int mid = 0;
        int high = nums.Length - 1;

        // Her turda ya mid sağa ya high sola gider; döngü tam n kez döner.
        while (mid <= high)
        {
            if (nums[mid] == 0)
            {
                // 0'ı 0'ların sonuna al. low'dan geri gelen bir 1'dir
                // (ya da low == mid iken aynı 0); iki bölge de bir büyür.
                (nums[low], nums[mid]) = (nums[mid], nums[low]);
                low++;
                mid++;
            }
            else if (nums[mid] == 1)
            {
                // Zaten 1'ler bölgesinde.
                mid++;
            }
            else
            {
                // 2'yi 2'lerin başına al. high'dan gelene henüz bakılmadı;
                // mid yerinde kalır ve onu sonraki turda inceler.
                (nums[mid], nums[high]) = (nums[high], nums[mid]);
                high--;
            }
        }

        return nums;
    }
}
```

```typescript solution
function sortColors(nums: number[]): number[] {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }

  return nums;
}
```

### Karmaşıklık

- **Zaman:** O(n), tek geçiş.
- **Alan:** O(1).

En sık yapılan hata, 2'yi sona attıktan sonra `mid`'i de ilerletmektir. `[2, 0, 1]` gibi bir girdide sondan gelen eleman incelenmeden atlanır ve dizi sırasız kalır.

**Alternatif:** Sayarak sıralama (0, 1 ve 2'leri sayıp diziyi yeniden yazmak) da O(n) zaman ve O(1) alan kullanır ama diziyi iki kez gezer.

## Testler

```json
[
  { "args": [[2, 0, 2, 1, 1, 0]], "expected": [0, 0, 1, 1, 2, 2], "sample": true },
  { "args": [[2, 0, 1]], "expected": [0, 1, 2], "sample": true },
  { "args": [[0]], "expected": [0] },
  { "args": [[1]], "expected": [1] },
  { "args": [[2, 1]], "expected": [1, 2] },
  { "args": [[1, 0]], "expected": [0, 1] },
  { "args": [[2, 2, 2]], "expected": [2, 2, 2] },
  { "args": [[0, 1, 2]], "expected": [0, 1, 2] },
  { "args": [[2, 1, 0]], "expected": [0, 1, 2] },
  { "args": [[1, 2, 0, 2, 0, 1, 1, 0, 2]], "expected": [0, 0, 0, 1, 1, 1, 2, 2, 2] },
  { "args": [[2, 2, 0, 0]], "expected": [0, 0, 2, 2] }
]
```
