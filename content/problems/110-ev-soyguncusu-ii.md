---
title: Ev Soyguncusu II
difficulty: medium
tags: [dinamik-programlama, dizi]
function: rob
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
Bir hırsız bir sokaktaki evleri soymayı planlıyor; `nums[i]`, `i`. evdeki para miktarı. Bu sokakta evler **daire şeklinde** dizilmiş: ilk ev son evin komşusudur. Komşu iki ev aynı gece soyulursa alarm çalar.

Alarmı çaldırmadan soyulabilecek **en fazla parayı** döndürün.

### Örnek 1

```text
Girdi:  nums = [2, 3, 2]
Çıktı:  3
Açıklama: 1. ve 3. evler (2 + 2) komşu oldukları için birlikte soyulamaz.
```

### Örnek 2

```text
Girdi:  nums = [1, 2, 3, 1]
Çıktı:  4
Açıklama: 1. ev (1) ve 3. ev (3).
```

### Örnek 3

```text
Girdi:  nums = [1, 2, 3]
Çıktı:  3
```

### Kısıtlar

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 1000`

## İpuçları

- Daire olmasaydı problem "Ev Soyguncusu"nun aynısı olurdu.
- İlk ve son ev aynı anda soyulamaz. Demek ki ya ilk ev **dışarıda** kalır ya da son ev.
- Doğrusal çözümü iki kez çalıştırın: `nums[0..n-2]` ve `nums[1..n-1]`. Büyük olanı cevaptır. Tek ev varsa onu döndürün.

## Çözüm

### İki doğrusal soygun

Daireyi iki doğrusal probleme bölüyoruz: ilk evi hariç tutan aralık `[1, n-1]` ve son evi hariç tutan aralık `[0, n-2]`. Herhangi bir geçerli soygun bu ikisinden en az birine sığar; çünkü ilk ve son ev aynı anda seçilemez.

Doğrusal problem için iki değişken yeter: `prev2` bir önceki evden iki önceye kadarki en iyi kazanç, `prev1` bir öncekine kadarki en iyi kazanç. Her evde `cur = max(prev1, prev2 + nums[i])`: ya bu evi atlarız ya da soyup iki öncesinin kazancına ekleriz.

```csharp solution
public class Solution
{
    public int Rob(int[] nums)
    {
        if (nums.Length == 1)
        {
            return nums[0];
        }

        return Math.Max(RobLine(nums, 0, nums.Length - 2), RobLine(nums, 1, nums.Length - 1));
    }

    private static int RobLine(int[] nums, int lo, int hi)
    {
        var prev2 = 0;
        var prev1 = 0;
        for (var i = lo; i <= hi; i++)
        {
            var current = Math.Max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = current;
        }

        return prev1;
    }
}
```

```typescript solution
function rob(nums: number[]): number {
  if (nums.length === 1) return nums[0];

  const robLine = (lo: number, hi: number): number => {
    let prev2 = 0;
    let prev1 = 0;
    for (let i = lo; i <= hi; i++) {
      const current = Math.max(prev1, prev2 + nums[i]);
      prev2 = prev1;
      prev1 = current;
    }
    return prev1;
  };

  return Math.max(robLine(0, nums.length - 2), robLine(1, nums.length - 1));
}
```

### Karmaşıklık

- **Zaman:** O(n). İki doğrusal geçiş.
- **Alan:** O(1).

Dairesel bir kısıtı "şu eleman dahil değil" ve "bu eleman dahil değil" diye iki doğrusal duruma bölmek, dairesel dizilerde sık kullanılan bir hiledir.

## Testler

```json
[
  { "args": [[2, 3, 2]], "expected": 3, "sample": true },
  { "args": [[1, 2, 3, 1]], "expected": 4, "sample": true },
  { "args": [[1, 2, 3]], "expected": 3, "sample": true },
  { "args": [[1]], "expected": 1 },
  { "args": [[1, 2]], "expected": 2 },
  { "args": [[200, 3, 140, 20, 10]], "expected": 340 },
  { "args": [[2, 7, 9, 3, 1]], "expected": 11 },
  { "args": [[0, 0, 0]], "expected": 0 }
]
```
