---
title: Zıplama Oyunu II
difficulty: medium
tags: [acgozlu, dizi]
function: jump
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
`0`'dan başlayan `n` uzunluğunda bir tam sayı dizisi `nums` veriliyor. Başlangıçta `0`. indekste duruyorsunuz.

Her `nums[i]` elemanı, `i` indeksinden ileri doğru yapabileceğiniz **en uzun zıplama mesafesini** gösterir. Başka bir deyişle, `nums[i]` konumundaysanız `0 <= j <= nums[i]` ve `i + j < n` koşullarını sağlayan herhangi bir `i + j` indeksine zıplayabilirsiniz.

Son indekse (`n - 1`) ulaşmak için gereken **en az zıplama sayısını** döndürün. Son indekse her zaman ulaşılabileceği garanti edilmektedir.

### Örnek 1

```text
Girdi:  nums = [2, 3, 1, 1, 4]
Çıktı:  2
Açıklama: Son indekse ulaşmak için en az zıplama sayısı 2'dir.
0. indeksten 1. indekse 1 birim zıpla, ardından 3 birim zıplayarak son indekse ulaş.
```

### Örnek 2

```text
Girdi:  nums = [2, 3, 0, 1, 4]
Çıktı:  2
Açıklama: 0. indeksten 1. indekse (değeri 3), oradan da doğrudan 4. indekse zıplanır.
```

### Kısıtlar

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 1000`
- `nums[n - 1]` konumuna her zaman ulaşılabileceği garanti edilir.

## İpuçları

- Problemi 1 boyutlu dizi üzerinde katman katman ilerleyen bir **Genişlik Öncelikli Arama (BFS)** gibi düşünün.
- Başlangıçta `0`. zıplama katmanınız `[l, r] = [0, 0]` aralığıdır.
- Mevcut `[l, r]` aralığındaki tüm indeksleri tarayarak tek bir zıplamayla ulaşılabilecek en uzak noktayı (`farthest = max(i + nums[i])`) bulun.
- Bir sonraki zıplama katmanınız `[r + 1, farthest]` aralığı olur; `r` son indekse ulaşana kadar pencereyi kaydırıp zıplama sayısını artırın.

## Çözüm

En az zıplama sayısını bulmak için dizi üzerinde **seviye bazlı BFS (pencere kaydırma)** uygularız. `[l, r]` penceresi, tam olarak `jumps` adet zıplamayla ulaşılabilen indeks aralığını temsil eder.

Başlangıçta `0`. indeksteyiz: `l = 0`, `r = 0` ve `jumps = 0`.
Pencerenin sağ sınırı `r` henüz son indekse (`nums.Length - 1`) ulaşmadığı sürece:
1. Mevcut `[l, r]` penceresindeki her `i` indeksinden zıplandığında ulaşılabilecek en uzak noktayı hesaplarız: `farthest = Math.Max(farthest, i + nums[i])`.
2. Bir sonraki zıplama seviyesinin penceresini `l = r + 1` ve `r = farthest` olarak güncelleriz ve `jumps` sayacını 1 artırırız.

Her indeks en fazla bir pencerenin içinde ziyaret edildiği için algoritma **O(n)** zamanda ve ek bellek kullanmadan **O(1)** alanda çalışır.

```csharp solution
public class Solution
{
    public int Jump(int[] nums)
    {
        int jumps = 0;
        int l = 0;
        int r = 0;

        while (r < nums.Length - 1)
        {
            int farthest = 0;
            for (int i = l; i <= r; i++)
            {
                farthest = Math.Max(farthest, i + nums[i]);
            }

            l = r + 1;
            r = farthest;
            jumps++;
        }

        return jumps;
    }
}
```

```typescript solution
function jump(nums: number[]): number {
  let jumps = 0;
  let l = 0;
  let r = 0;

  while (r < nums.length - 1) {
    let farthest = 0;
    for (let i = l; i <= r; i++) {
      farthest = Math.max(farthest, i + nums[i]);
    }

    l = r + 1;
    r = farthest;
    jumps++;
  }

  return jumps;
}
```

### Karmaşıklık

- **Zaman:** O(n). `[l, r]` penceresi her adımda ileri kayar ve dizideki her elemana en fazla bir kez bakılır.
- **Alan:** O(1). Yalnızca sınır işaretçileri (`l`, `r`, `farthest`) ve sayaç (`jumps`) tutulur.

## Testler

```json
[
  { "args": [[2, 3, 1, 1, 4]], "expected": 2, "sample": true },
  { "args": [[2, 3, 0, 1, 4]], "expected": 2, "sample": true },
  { "args": [[0]], "expected": 0 },
  { "args": [[1, 2]], "expected": 1 },
  { "args": [[1, 1, 1, 1]], "expected": 3 },
  { "args": [[1, 2, 1, 1, 1]], "expected": 3 },
  { "args": [[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0]], "expected": 2 },
  { "args": [[2, 1, 1, 1, 4]], "expected": 3 }
]
```
