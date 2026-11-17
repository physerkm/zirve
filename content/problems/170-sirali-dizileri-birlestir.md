---
title: Sıralı Dizileri Birleştir
difficulty: easy
tags: [dizi, iki-isaretci, siralama]
function: merge
params:
  - { name: nums1, type: "int[]" }
  - { name: m, type: "int" }
  - { name: nums2, type: "int[]" }
  - { name: n, type: "int" }
returns: "int[]"
---
Azalmayan sırada sıralı iki tam sayı dizisi `nums1` ve `nums2` ile eleman sayıları `m` ve `n` veriliyor. `nums2`'yi `nums1`'in içine birleştirerek **tek bir sıralı dizi** elde edin.

`nums1`'in uzunluğu `m + n`'dir: ilk `m` eleman birleştirilecek değerlerdir, son `n` eleman `0`'dır ve yok sayılmalıdır. Sonuç **`nums1`'in içine yerinde** yazılmalı ve testlerin görebilmesi için `nums1` döndürülmelidir.

### Örnek 1

```text
Girdi:  nums1 = [1, 2, 3, 0, 0, 0], m = 3, nums2 = [2, 5, 6], n = 3
Çıktı:  [1, 2, 2, 3, 5, 6]
```

### Örnek 2

```text
Girdi:  nums1 = [1], m = 1, nums2 = [], n = 0
Çıktı:  [1]
```

### Örnek 3

```text
Girdi:  nums1 = [0], m = 0, nums2 = [1], n = 1
Çıktı:  [1]
```

### Kısıtlar

- `nums1.length == m + n`, `nums2.length == n`
- `0 <= m, n <= 200`, `1 <= m + n <= 200`
- `-10^9 <= nums1[i], nums2[j] <= 10^9`

**Devam sorusu:** O(m + n) zamanda çözebilir misiniz?

## İpuçları

- Baştan birleştirmeye çalışırsanız `nums1`'in henüz okunmamış elemanlarının üzerine yazarsınız.
- `nums1`'in sonu boş! En büyük elemanları **sondan başa** doğru yerleştirin.
- `i = m - 1`, `j = n - 1` ve yazma konumu `k = m + n - 1` ile başlayın. `nums2` bitince iş biter; `nums1`'in kalanları zaten yerindedir.

## Çözüm

### Sondan başa üç işaretçi

En büyük eleman, iki dizinin son elemanlarından büyük olanıdır ve sonucun en sonuna gider. `nums1`'in sonundaki `n` boş hücre sayesinde, sondan yazarken henüz okunmamış hiçbir elemanın üzerine yazılmaz: yazma konumu `k`, her zaman `i`'nin sağındadır ya da ona eşittir.

Döngü `j >= 0` olduğu sürece sürer. `nums2` bittiğinde `nums1`'in kalan elemanları zaten doğru yerdedir.

```csharp solution
public class Solution
{
    public int[] Merge(int[] nums1, int m, int[] nums2, int n)
    {
        var i = m - 1;
        var j = n - 1;
        var k = m + n - 1;

        while (j >= 0)
        {
            if (i >= 0 && nums1[i] > nums2[j])
            {
                nums1[k--] = nums1[i--];
            }
            else
            {
                nums1[k--] = nums2[j--];
            }
        }

        return nums1;
    }
}
```

```typescript solution
function merge(nums1: number[], m: number, nums2: number[], n: number): number[] {
  let i = m - 1;
  let j = n - 1;
  let k = m + n - 1;

  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }

  return nums1;
}
```

### Karmaşıklık

- **Zaman:** O(m + n).
- **Alan:** O(1).

## Testler

```json
[
  { "args": [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3], "expected": [1, 2, 2, 3, 5, 6], "sample": true },
  { "args": [[1], 1, [], 0], "expected": [1], "sample": true },
  { "args": [[0], 0, [1], 1], "expected": [1], "sample": true },
  { "args": [[4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3], "expected": [1, 2, 3, 4, 5, 6] },
  { "args": [[2, 0], 1, [1], 1], "expected": [1, 2] },
  { "args": [[-1, 0, 0, 3, 3, 3, 0, 0, 0], 6, [1, 2, 2], 3], "expected": [-1, 0, 0, 1, 2, 2, 3, 3, 3] }
]
```
