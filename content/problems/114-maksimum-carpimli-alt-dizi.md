---
title: Maksimum Çarpımlı Alt Dizi
difficulty: medium
tags: [dinamik-programlama, dizi]
function: maxProduct
params:
  - { name: nums, type: "int[]" }
returns: "int"
---

Bir tam sayı dizisi `nums` veriliyor. Elemanlarının çarpımı en büyük olan **boş olmayan bitişik bir alt diziyi** (subarray) bulun ve bu çarpımı döndürün.

Test verileri, cevabın 32-bitlik işaretli bir tam sayıya (`int`) sığacağı şekilde üretilmiştir.

Bitişik alt dizi, dizi içindeki ardışık elemanlardan oluşan kesintisiz bir bölümdür.

### Örnek 1

```text
Girdi:  nums = [2, 3, -2, 4]
Çıktı:  6
Açıklama: [2, 3] alt dizisi en büyük çarpım olan 6 değerini verir.
```

### Örnek 2

```text
Girdi:  nums = [-2, 0, -1]
Çıktı:  0
Açıklama: [-2, -1] bitişik bir alt dizi olmadığı için sonuç 2 olamaz; en büyük çarpım [0] ile 0'dır.
```

### Kısıtlar

- `1 <= nums.length <= 2 * 10^4`
- `-10 <= nums[i] <= 10`
- `nums` dizisinin herhangi bir alt dizisinin çarpımı 32-bitlik işaretli tam sayıya sığar.

## İpuçları

- Yalnızca pozitif sayılar olsaydı Kadane algoritmasına benzer şekilde o ana kadarki maksimum çarpımı tutmak yeterli olurdu.
- Ancak negatif bir sayıyla çarpmak işareti tersine çevirir: çok küçük (negatif) bir çarpım, yeni bir negatif sayıyla çarpıldığında bir anda çok büyük (pozitif) bir çarpıma dönüşebilir.
- Bu nedenle her adımda yalnızca o konumda biten **maksimum** çarpımı (`curMax`) değil, aynı zamanda **minimum** çarpımı (`curMin`) da takip edin.
- Sıfır (`0`) ile karşılaşıldığında hem `curMax` hem `curMin` sıfırlanır ve bir sonraki elemandan yeni bir alt dizi başlatma seçeneği (`Math.Max(n, curMax * n)`) devreye girer.

## Çözüm

Toplam maksimizasyonunda (Kadane algoritması) negatif sayılar toplamı yalnızca küçültür. Çarpımda ise **negatif × negatif = pozitif** olduğu için, o ana kadar elde edilmiş en küçük (en negatif) çarpım bir sonraki negatif sayıyla çarpıldığında en büyük pozitif çarpımı üretebilir.

Bu yüzden diziyi soldan sağa tararken `i` konumunda biten alt diziler için iki değeri aynı anda tutarız:

- `curMax`: `i` konumunda biten alt dizilerin **en büyük** çarpımı,
- `curMin`: `i` konumunda biten alt dizilerin **en küçük** çarpımı.

Yeni eleman `n = nums[i]` negatifse, `curMax` ile `n` çarpıldığında küçülecek, `curMin` ile `n` çarpıldığında ise büyüyecektir. Bu durumu tek adımda ele almak için `n < 0` olduğunda `curMax` ve `curMin` değerlerini birbiriyle takas ederiz. Ardından her iki değeri de "ya `n`'den yeni bir alt dizi başlat ya da önceki alt diziyi `n` ile uzat" kuralıyla güncelleriz:

- `curMax = Math.Max(n, curMax * n)`
- `curMin = Math.Min(n, curMin * n)`

Her adımda genel maksimumu `result = Math.Max(result, curMax)` ile güncelleriz.

```csharp solution
public class Solution
{
    public int MaxProduct(int[] nums)
    {
        int curMax = nums[0];
        int curMin = nums[0];
        int result = nums[0];

        for (int i = 1; i < nums.Length; i++)
        {
            int n = nums[i];

            if (n < 0)
            {
                int temp = curMax;
                curMax = curMin;
                curMin = temp;
            }

            curMax = Math.Max(n, curMax * n);
            curMin = Math.Min(n, curMin * n);
            result = Math.Max(result, curMax);
        }

        return result;
    }
}
```

```typescript solution
function maxProduct(nums: number[]): number {
  let curMax = nums[0];
  let curMin = nums[0];
  let result = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];

    if (n < 0) {
      const temp = curMax;
      curMax = curMin;
      curMin = temp;
    }

    curMax = Math.max(n, curMax * n);
    curMin = Math.min(n, curMin * n);
    result = Math.max(result, curMax);
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizi baştan sona yalnızca bir kez taranır.
- **Alan:** O(1). Yalnızca `curMax`, `curMin` ve `result` değişkenleri tutulur.

## Testler

```json
[
  { "args": [[2, 3, -2, 4]], "expected": 6, "sample": true },
  { "args": [[-2, 0, -1]], "expected": 0, "sample": true },
  { "args": [[-2, 3, -4]], "expected": 24 },
  { "args": [[-3]], "expected": -3 },
  { "args": [[0, 2]], "expected": 2 },
  { "args": [[2, -5, -2, -4, 3]], "expected": 24 },
  { "args": [[-1, -2, -9, -6]], "expected": 108 }
]
```
