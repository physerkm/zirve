---
title: Balonları Patlat
difficulty: hard
tags: [dinamik-programlama, dizi]
function: maxCoins
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
`0`'dan `n - 1`'e kadar indekslenmiş `n` adet balon veriliyor. Her balonun üzerinde `nums` dizisiyle temsil edilen bir sayı yazılıdır. Bütün balonları patlatmanız isteniyor.

`i`. balonu patlattığınızda `nums[i - 1] * nums[i] * nums[i + 1]` adet altın kazanırsınız. Burada `i - 1` veya `i + 1` dizinin sınırları dışına çıkarsa, orada üzerinde `1` yazan sanal bir balon varmış gibi kabul edilir.

Balonları en uygun sırayla patlatarak toplayabileceğiniz **en fazla altın sayısını** döndürün.

### Örnek 1

```text
Girdi:  nums = [3, 1, 5, 8]
Çıktı:  167
Açıklama:
nums = [3, 1, 5, 8] --> [3, 5, 8] --> [3, 8] --> [8] --> []
altın =  3*1*5      +   3*5*8     +  1*3*8  + 1*8*1 = 167
```

### Örnek 2

```text
Girdi:  nums = [1, 5]
Çıktı:  10
Açıklama:
Önce 1'i patlat (1*1*5 = 5), sonra 5'i patlat (1*5*1 = 5). Toplam 10 altın.
```

### Kısıtlar

- `n == nums.length`
- `1 <= n <= 300`
- `0 <= nums[i] <= 100`

## İpuçları

- İlk hangi balonu patlatacağınızı seçerseniz, solundaki ve sağındaki balonlar birbirine komşu olur ve alt problemler birbirine bağımlı hale gelir.
- Bunun yerine tersinden düşünün: `[left, right]` aralığında **en son** hangi balonu (`i`) patlatacaksınız?
- Eğer `i` balonu `[left, right]` aralığında en son patlatılırsa, patlatıldığı anda `[left, right]` içindeki diğer tüm balonlar zaten patlamıştır; dolayısıyla `i`'nin o andaki komşuları kesinlikle `left - 1` ve `right + 1` balonlarıdır!
- Dizinin iki ucuna `1` değerinde sanal balonlar ekleyerek sınır kontrollerini ortadan kaldırın.

## Çözüm

Bir balonu **ilk** patlattığımızda sol ve sağ alt diziler artık birbirine komşu olur; bu da alt problemlerin bağımsızlığını bozar. Anahtar fikir, `[left, right]` aralığında **en son patlatılan** balonu (`i`) seçmektir.

Önce dizinin soluna ve sağına birer `1` ekleyerek `n + 2` uzunluğunda `balloons` dizisini oluştururuz (`1..n` indeksleri gerçek balonlardır). `dp[left, right]`, `[left, right]` kapalı aralığındaki tüm balonları patlatarak kazanılabilecek maksimum altın sayısını tutsun.

`[left, right]` aralığında en son `i` (`left <= i <= right`) balonunun patlatıldığını varsayalım:
- `i`'den önce `[left, i - 1]` ve `[i + 1, right]` aralıklarındaki tüm balonlar birbirinden bağımsız olarak patlatılır (`dp[left, i - 1] + dp[i + 1, right]`).
- Sıra `i`'ye geldiğinde `[left, right]` aralığında başka balon kalmadığı için `i`'nin sol komşusu `balloons[left - 1]`, sağ komşusu ise `balloons[right + 1]` olur.
- Dolayısıyla `i`'nin patlamasından `balloons[left - 1] * balloons[i] * balloons[right + 1]` altın kazanılır.

Aralık uzunluğunu `len = 1`'den `n`'ye kadar büyüterek tüm `[left, right]` alt aralıklarını hesaplarız ve `dp[1, n]` değerini döndürürüz.

```csharp solution
public class Solution
{
    public int MaxCoins(int[] nums)
    {
        int n = nums.Length;
        int[] balloons = new int[n + 2];
        balloons[0] = 1;
        balloons[n + 1] = 1;
        for (int i = 0; i < n; i++)
            balloons[i + 1] = nums[i];

        int[,] dp = new int[n + 2, n + 2];

        for (int len = 1; len <= n; len++)
        {
            for (int left = 1; left <= n - len + 1; left++)
            {
                int right = left + len - 1;
                for (int i = left; i <= right; i++)
                {
                    int coins = balloons[left - 1] * balloons[i] * balloons[right + 1]
                              + dp[left, i - 1] + dp[i + 1, right];
                    dp[left, right] = Math.Max(dp[left, right], coins);
                }
            }
        }

        return dp[1, n];
    }
}
```

```typescript solution
function maxCoins(nums: number[]): number {
  const n = nums.length;
  const balloons = [1, ...nums, 1];
  const dp: number[][] = Array.from({ length: n + 2 }, () =>
    new Array<number>(n + 2).fill(0)
  );

  for (let len = 1; len <= n; len++) {
    for (let left = 1; left <= n - len + 1; left++) {
      const right = left + len - 1;
      for (let i = left; i <= right; i++) {
        const coins =
          balloons[left - 1] * balloons[i] * balloons[right + 1] +
          dp[left][i - 1] +
          dp[i + 1][right];
        dp[left][right] = Math.max(dp[left][right], coins);
      }
    }
  }

  return dp[1][n];
}
```

### Karmaşıklık

- **Zaman:** O(n³). Toplam O(n²) adet `[left, right]` alt aralığı vardır ve her aralıkta en son patlatılacak `i` balonu için O(n) aday denenir.
- **Alan:** O(n²). `(n + 2) x (n + 2)` boyutundaki `dp` tablosu için.

## Testler

```json
[
  { "args": [[3, 1, 5, 8]], "expected": 167, "sample": true },
  { "args": [[1, 5]], "expected": 10, "sample": true },
  { "args": [[7]], "expected": 7 },
  { "args": [[0, 0, 0]], "expected": 0 },
  { "args": [[2, 4, 3]], "expected": 33 },
  { "args": [[1, 2, 3, 4]], "expected": 40 },
  { "args": [[5, 5, 5]], "expected": 155 }
]
```
