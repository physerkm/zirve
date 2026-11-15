---
title: Merdiven Tırmanma
difficulty: easy
tags: [dinamik-programlama, matematik]
function: climbStairs
params:
  - { name: n, type: "int" }
returns: "int"
---
`n` basamaklı bir merdiveni çıkıyorsunuz. Her adımda **1 ya da 2 basamak** çıkabilirsiniz. Tepeye kaç **farklı biçimde** ulaşabilirsiniz?

### Örnek 1

```text
Girdi:  n = 2
Çıktı:  2
Açıklama: 1+1 ya da 2.
```

### Örnek 2

```text
Girdi:  n = 3
Çıktı:  3
Açıklama: 1+1+1, 1+2 ya da 2+1.
```

### Kısıtlar

- `1 <= n <= 45`

## İpuçları

- `n`. basamağa son adımda nereden gelmiş olabilirsiniz?
- `n`. basamağa ulaşma yollarının sayısı, `n-1` ve `n-2`. basamaklara ulaşma yollarının toplamıdır.
- Saklama yapmadan yazılan özyineleme aynı alt problemleri tekrar tekrar çözer ve üstel zaman alır.

## Çözüm

`n`. basamağa ya `n-1`. basamaktan tek adımla ya da `n-2`. basamaktan çift adımla gelinir. Bu iki küme ayrıktır, dolayısıyla:

```text
yol(n) = yol(n-1) + yol(n-2)
yol(0) = 1,  yol(1) = 1
```

Bu, Fibonacci dizisinin kendisidir. Her değer yalnızca önceki iki değere bağlı olduğu için bütün tabloyu tutmak gerekmez; iki değişken yeterlidir.

```csharp solution
public class Solution
{
    public int ClimbStairs(int n)
    {
        var previous = 1;   // yol(i-2)
        var current = 1;    // yol(i-1)

        for (var i = 2; i <= n; i++)
        {
            (previous, current) = (current, previous + current);
        }

        return current;
    }
}
```

```typescript solution
function climbStairs(n: number): number {
  let previous = 1;
  let current = 1;

  for (let i = 2; i <= n; i++) {
    [previous, current] = [current, previous + current];
  }

  return current;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1).

Saklamasız özyineleme (`f(n) = f(n-1) + f(n-2)`) O(2ⁿ) zaman alır; `n = 45` için milyarlarca çağrı yapar. Bu problem, dinamik programlamanın en yalın örneğidir: örtüşen alt problemler bir kez çözülür.

## Testler

```json
[
  { "args": [2], "expected": 2, "sample": true },
  { "args": [3], "expected": 3, "sample": true },
  { "args": [1], "expected": 1 },
  { "args": [4], "expected": 5 },
  { "args": [5], "expected": 8 },
  { "args": [10], "expected": 89 },
  { "args": [30], "expected": 1346269 },
  { "args": [45], "expected": 1836311903 }
]
```
