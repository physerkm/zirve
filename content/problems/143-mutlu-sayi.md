---
title: Mutlu Sayı
difficulty: easy
tags: [matematik, iki-isaretci, hash-tablosu]
function: isHappy
params:
  - { name: n, type: "int" }
returns: "bool"
---
Bir `n` sayısının **mutlu sayı** olup olmadığını belirleyen bir algoritma yazın.

**Mutlu sayı** şu süreçle tanımlanır:
- Herhangi bir pozitif tam sayı ile başlayın,
- Sayıyı basamaklarının karelerinin toplamıyla değiştirin,
- Sayı `1`'e eşit olana kadar (bu durumda olduğu yerde kalır) ya da `1`'i içermeyen **sonsuz bir döngüye** girene kadar bu işlemi tekrarlayın,
- Bu sürecin sonunda `1`'e ulaşan sayılar **mutlu sayıdır**.

`n` mutlu bir sayıysa `true`, değilse `false` döndürün.

### Örnek 1

```text
Girdi:  n = 19
Çıktı:  true
Açıklama:
1² + 9² = 82
8² + 2² = 68
6² + 8² = 100
1² + 0² + 0² = 1
```

### Örnek 2

```text
Girdi:  n = 2
Çıktı:  false
Açıklama: 2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 ... şeklinde 1'e hiç uğramayan bir döngüye girer.
```

### Kısıtlar

- `1 <= n <= 2^31 - 1`

## İpuçları

- Çok basamaklı bir sayının basamak kareleri toplamı hızla küçülür (örneğin `999.999.999` için bile toplam yalnızca `9 × 81 = 729` olur); yani dizi sonsuza kadar büyüyemez.
- Sayı büyüyemediğine göre ya `1`'e ulaşır ya da daha önce gördüğü bir sayıya geri dönerek döngüye girer.
- Daha önce görülen sayıları bir `HashSet` içinde tutarak döngüyü yakalayabilirsiniz; peki ek bellek kullanmadan döngü nasıl yakalanır?
- Bağlı listelerde döngü bulmak için kullanılan **Floyd'un Kaplumbağa ve Tavşan** (`slow` ve `fast` işaretçileri) yöntemini burada da uygulayabilirsiniz.

## Çözüm

Her sayıdan bir sonraki sayıya (`SumOfSquares(x)`) geçişi, gizli bir bağlı listenin bir sonraki düğümüne ilerlemek gibi düşünebiliriz. En büyük `int` değeri olan `2.147.483.647` için bile basamak kareleri toplamı birkaç adımda `243`'ün altına iner. Sonlu sayıda durum olduğu için zincir ya `1`'de sabitlenir ya da bir döngüye girer.

Görülen sayıları `HashSet`'te tutmak yerine **Floyd'un Döngü Yakalama Algoritmasını** kullanırsak **O(1)** ek bellek yeterli olur:
- Yavaş işaretçi (`slow`) her adımda 1 kez, hızlı işaretçi (`fast`) 2 kez `SumOfSquares` uygular.
- Zincir `1`'e ulaşırsa `fast` (veya `slow`) `1` olur ve `true` döneriz.
- Zincirde `1` dışındaki bir döngü varsa hızlı işaretçi yavaş işaretçiyi döngü içinde yakalar (`slow == fast`) ve `false` döneriz.

```csharp solution
public class Solution
{
    public bool IsHappy(int n)
    {
        int slow = n;
        int fast = SumOfSquares(n);

        // fast 1'e ulaşana veya iki işaretçi döngüde buluşana kadar ilerle.
        while (fast != 1 && slow != fast)
        {
            slow = SumOfSquares(slow);
            fast = SumOfSquares(SumOfSquares(fast));
        }

        return fast == 1;
    }

    private int SumOfSquares(int num)
    {
        int sum = 0;
        while (num > 0)
        {
            int digit = num % 10;
            sum += digit * digit;
            num /= 10;
        }
        return sum;
    }
}
```

```typescript solution
function isHappy(n: number): boolean {
  const sumOfSquares = (num: number): number => {
    let sum = 0;
    while (num > 0) {
      const digit = num % 10;
      sum += digit * digit;
      num = Math.floor(num / 10);
    }
    return sum;
  };

  let slow = n;
  let fast = sumOfSquares(n);

  while (fast !== 1 && slow !== fast) {
    slow = sumOfSquares(slow);
    fast = sumOfSquares(sumOfSquares(fast));
  }

  return fast === 1;
}
```

### Karmaşıklık

- **Zaman:** O(log n). Bir sayının basamak kareleri toplamını hesaplamak basamak sayısı kadar yani O(log n) sürer; ilk adımdan sonra değerler 243'ün altına düştüğü için döngü sabit sayıda adımda sonlanır.
- **Alan:** O(1). `HashSet` yerine yalnızca `slow` ve `fast` değişkenleri kullanılır.

## Testler

```json
[
  { "args": [19], "expected": true, "sample": true },
  { "args": [2], "expected": false, "sample": true },
  { "args": [1], "expected": true },
  { "args": [7], "expected": true },
  { "args": [4], "expected": false },
  { "args": [100], "expected": true },
  { "args": [116], "expected": false }
]
```
