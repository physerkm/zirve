---
title: Ev Soyguncusu
difficulty: medium
tags: [dinamik-programlama, dizi]
function: rob
params:
  - { name: nums, type: "int[]" }
returns: "int"
---

Bir sokak boyunca dizilmiş evleri soymayı planlayan profesyonel bir soyguncusunuz. Her evde belirli miktarda para bulunmaktadır. Sizi engelleyen tek kısıt, **yan yana bulunan iki evin güvenlik sistemlerinin birbirine bağlı olmasıdır**: aynı gece içinde bitişik iki eve girerseniz polis otomatik olarak haberdar edilir.

Her evdeki para miktarını gösteren negatif olmayan tam sayılardan oluşan `nums` dizisi verildiğinde, **polisi alarma geçirmeden** bu gece soyabileceğiniz **maksimum para miktarını** döndürün.

### Örnek 1

```text
Girdi:  nums = [1, 2, 3, 1]
Çıktı:  4
Açıklama: 1. evi (para = 1) ve ardından 3. evi (para = 3) soyun. Toplam soyulan miktar = 1 + 3 = 4.
```

### Örnek 2

```text
Girdi:  nums = [2, 7, 9, 3, 1]
Çıktı:  12
Açıklama: 1. evi (para = 2), 3. evi (para = 9) ve 5. evi (para = 1) soyun. Toplam soyulan miktar = 2 + 9 + 1 = 12.
```

### Örnek 3

```text
Girdi:  nums = [2, 1, 1, 2]
Çıktı:  4
Açıklama: İlk evi (2) ve son evi (2) soyarak 2 + 2 = 4 elde edilir (arada iki ev boş bırakılabilir).
```

### Kısıtlar

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 400`

## İpuçları

- Her `i`. eve geldiğinizde iki seçeneğiniz vardır: bu evi **soymak** ya da **pas geçmek**.
- Eğer `i`. evi soyarsanız, bir önceki (`i - 1`) evi soyamazsınız; dolayısıyla kazancınız `nums[i] + dp[i - 2]` olur.
- Eğer `i`. evi pas geçerseniz, kazancınız bir önceki eve kadarki en iyi kazanç olan `dp[i - 1]` olur.
- Yalnızca son iki adımdaki en yüksek kazancı (`rob1` ve `rob2`) tutarak ekstra dizi kullanmadan O(1) bellek ile çözebilirsiniz.

## Çözüm

Sokağın başından sonuna doğru ilerlerken her evde şu kararı veririz:

- **Bu evi soy:** O zaman bir önceki evi soyamayız, iki önceki eve kadar elde edilebilen maksimum kazanca (`rob1`) bu evin parasını (`num`) ekleriz: `rob1 + num`.
- **Bu evi pas geç:** O zaman bir önceki eve kadar elde edilebilen maksimum kazancı (`rob2`) koruruz.

Bu iki seçenekten büyük olanı (`Math.Max(rob1 + num, rob2)`) şu ana kadarki yeni maksimum kazancımız olur. Ardından bir sonraki eve geçmeden önce `rob1 = rob2` ve `rob2 = temp` atamalarıyla iki değişkenli penceremizi kaydırırız.

`nums = [2, 1, 1, 2]` örneğinde görüldüğü gibi her zaman "bir dolu, bir boş" gitmek zorunda değiliz; `rob2` zaten önceki tüm evler içindeki en iyi sonucu taşıdığı için iki ev üst üste boş bırakma durumu da doğal olarak kapsanır.

```csharp solution
public class Solution
{
    public int Rob(int[] nums)
    {
        int rob1 = 0;
        int rob2 = 0;

        // [rob1, rob2, num, ...]
        foreach (int num in nums)
        {
            int temp = Math.Max(rob1 + num, rob2);
            rob1 = rob2;
            rob2 = temp;
        }

        return rob2;
    }
}
```

```typescript solution
function rob(nums: number[]): number {
  let rob1 = 0;
  let rob2 = 0;

  for (const num of nums) {
    const temp = Math.max(rob1 + num, rob2);
    rob1 = rob2;
    rob2 = temp;
  }

  return rob2;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizideki her ev sabit zamanda yalnızca bir kez değerlendirilir.
- **Alan:** O(1). Yalnızca `rob1`, `rob2` ve `temp` değişkenleri kullanılır.

## Testler

```json
[
  { "args": [[1, 2, 3, 1]], "expected": 4, "sample": true },
  { "args": [[2, 7, 9, 3, 1]], "expected": 12, "sample": true },
  { "args": [[2, 1, 1, 2]], "expected": 4, "sample": true },
  { "args": [[5]], "expected": 5 },
  { "args": [[10, 5]], "expected": 10 },
  { "args": [[0, 0, 0]], "expected": 0 },
  { "args": [[4, 1, 2, 7, 5, 3, 1]], "expected": 14 }
]
```
