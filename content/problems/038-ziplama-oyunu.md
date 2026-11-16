---
title: Zıplama Oyunu
difficulty: medium
tags: [acgozlu, dizi]
function: canJump
params:
  - { name: nums, type: "int[]" }
returns: "bool"
---
Bir tam sayı dizisi `nums` veriliyor. Başlangıçta dizinin **ilk** indeksindesiniz ve her eleman, o indeksten yapabileceğiniz **en uzun** zıplamayı gösterir. Daha kısa zıplamak da serbesttir.

Son indekse ulaşabiliyorsanız `true`, ulaşamıyorsanız `false` döndürün.

### Örnek 1

```text
Girdi:  nums = [2, 3, 1, 1, 4]
Çıktı:  true
Açıklama: 0. indeksten 1 adım, sonra 1. indeksten 3 adım zıplayarak sona varılır.
```

### Örnek 2

```text
Girdi:  nums = [3, 2, 1, 0, 4]
Çıktı:  false
Açıklama: Hangi yoldan gidilirse gidilsin 3. indekse gelinir; oradaki 0 ilerlemeye izin vermez.
```

### Kısıtlar

- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 10^5`

## İpuçları

- Hangi zıplamaları yaptığınızı bilmek zorunda değilsiniz; yalnızca "ulaşılabilir mi?" sorusu soruluyor.
- `i` indeksine ulaşabiliyorsanız `i`'den önceki bütün indekslere de ulaşabilirsiniz. Öyleyse ulaşılabilen indeksler baştan başlayan kesintisiz bir aralıktır.
- Tek bir sayı tutun: şimdiye kadar ulaşılabilen **en uzak** indeks. Her indekste bunu `i + nums[i]` ile güncelleyin.
- Bulunduğunuz indeks bu sınırın ötesindeyse oraya hiçbir yoldan varılamaz.

## Çözüm

Bütün zıplama yollarını denemek gerekmez. Bir indekse ulaşılabiliyorsa ondan önceki bütün indekslere de ulaşılabilir (daha kısa zıplamak serbest olduğu için). Bu yüzden ulaşılabilen indeksler her zaman `0`'dan başlayan kesintisiz bir aralıktır ve bu aralığı tek bir sayı tanımlar: `farthest`, yani ulaşılabilen en uzak indeks.

Diziyi soldan sağa gezeriz:

- `i > farthest` ise `i` indeksine hiçbir yoldan varılamaz; sona da varılamaz.
- Değilse `i`'den en fazla `i + nums[i]` indeksine zıplanabilir; `farthest` bununla büyütülür.
- `farthest` son indekse ulaştığı anda cevap bellidir; dizinin geri kalanına bakmak gerekmez.

Bu açgözlü bir çözümdür: her adımda yalnızca "şimdiye kadarki en iyi erişim" saklanır ve bu bilgi doğru cevabı vermeye yeter.

```csharp solution
public class Solution
{
    public bool CanJump(int[] nums)
    {
        int lastIndex = nums.Length - 1;
        int farthest = 0; // 0'dan farthest'e kadar her indekse ulaşılabilir

        for (int i = 0; i < nums.Length; i++)
        {
            // i, ulaşabildiğimiz her indeksin ötesinde: sona varmadan takıldık.
            if (i > farthest)
                return false;

            // i'den i + nums[i]'ye kadar her yere inilebilir: zıplama nums[i]'den kısa olabilir.
            int reach = i + nums[i];
            farthest = Math.Max(farthest, reach);

            // Son indeks erişim içinde; dizinin geri kalanı önemli değil.
            if (farthest >= lastIndex)
                return true;
        }

        // Buraya yalnızca boş dizide gelinir. En az bir eleman varken döngünün
        // son turu mutlaka döner; C# yine de sonda bir return ister.
        return false;
    }
}
```

```typescript solution
function canJump(nums: number[]): boolean {
  const lastIndex = nums.length - 1;
  let farthest = 0;

  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;

    farthest = Math.max(farthest, i + nums[i]);

    if (farthest >= lastIndex) return true;
  }

  return false;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizi en fazla bir kez gezilir.
- **Alan:** O(1).

Dinamik programlama ile de çözülür ("bu indeksten sona varılabilir mi?" sorusunu sondan başa doldurarak), ama o çözüm O(n²) zaman alır. Açgözlü çözüm aynı sonucu tek geçişte verir.

## Testler

```json
[
  { "args": [[2, 3, 1, 1, 4]], "expected": true, "sample": true },
  { "args": [[3, 2, 1, 0, 4]], "expected": false, "sample": true },
  { "args": [[0]], "expected": true },
  { "args": [[0, 1]], "expected": false },
  { "args": [[1, 0]], "expected": true },
  { "args": [[2, 0, 0]], "expected": true },
  { "args": [[1, 1, 0, 1]], "expected": false },
  { "args": [[5, 0, 0, 0, 0, 0]], "expected": true },
  { "args": [[4, 0, 0, 0, 0, 0]], "expected": false },
  { "args": [[1, 2, 3]], "expected": true }
]
```
