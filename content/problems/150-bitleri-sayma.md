---
title: Bitleri Sayma
difficulty: easy
tags: [bit-islemleri, dinamik-programlama]
function: countBits
params:
  - { name: n, type: "int" }
returns: "int[]"
---
Bir `n` tam sayısı veriliyor. Uzunluğu `n + 1` olan bir `ans` dizisi döndürün; öyle ki her `i` (`0 <= i <= n`) için `ans[i]`, `i` sayısının ikili (binary) gösterimindeki **`1` bitlerinin sayısına** eşit olsun.

Çözümünüz **doğrusal zamanda** (`O(n)`) ve tek geçişte çalışmalıdır.

### Örnek 1

```text
Girdi:  n = 2
Çıktı:  [0, 1, 1]
Açıklama:
0 --> 0      (0 adet 1 biti)
1 --> 1      (1 adet 1 biti)
2 --> 10     (1 adet 1 biti)
```

### Örnek 2

```text
Girdi:  n = 5
Çıktı:  [0, 1, 1, 2, 1, 2]
Açıklama:
0 --> 0      (0)
1 --> 1      (1)
2 --> 10     (1)
3 --> 11     (2)
4 --> 100    (1)
5 --> 101    (2)
```

### Kısıtlar

- `0 <= n <= 10^5`

## İpuçları

- Her sayı için bağımsız olarak bit saymak yerine, daha küçük sayıların daha önce hesaplanmış sonuçlarını kullanabilir misiniz?
- Bir `i` sayısını bir bit sağa kaydırdığınızda (`i >> 1`, yani `i / 2`), yalnızca en sağdaki bit düşer; geri kalan tüm bitler aynı kalır.
- Örneğin `5` (`101`) sayısını bir bit sağa kaydırırsanız `2` (`10`) elde edersiniz ve düşen son bit `1`'dir (`5 & 1 = 1`).
- Dolayısıyla `dp[i] = dp[i >> 1] + (i & 1)` bağıntısı her `i >= 1` için geçerlidir.

## Çözüm

`0`'dan `n`'ye kadar her sayının bitlerini sıfırdan saymak yerine **Dinamik Programlama (DP)** ve **bit kaydırma** ilişkisini kullanabiliriz.

Bir `i` tam sayısının ikili gösterimini iki parçaya ayırabiliriz:
1. **En sağdaki bit hariç geri kalan üst bitler:** Bu değer `i >> 1` (yani `i / 2` tam sayı bölmesi) sayısına karşılık gelir. `i >> 1 < i` olduğu için bu sayının kaç tane `1` biti içerdiğini `dp[i >> 1]` içinde **zaten hesaplamışızdır**.
2. **En sağdaki bit (LSB):** Sayı tekse `1`, çiftse `0`'dır; bu da `i & 1` ifadesiyle `O(1)` zamanda bulunur.

Örneğin `i = 6` (`110`) için:
- `6 >> 1 = 3` (`11`) ve `dp[3] = 2`,
- `6 & 1 = 0` (en sağdaki bit `0`),
- `dp[6] = dp[3] + 0 = 2`.

`i = 7` (`111`) için:
- `7 >> 1 = 3` (`11`) ve `dp[3] = 2`,
- `7 & 1 = 1` (en sağdaki bit `1`),
- `dp[7] = dp[3] + 1 = 3`.

Başlangıç durumu `dp[0] = 0`'dır. `1`'den `n`'ye kadar tek bir döngüyle her elemanı sabit zamanda (`O(1)`) doldururuz.

```csharp solution
public class Solution
{
    public int[] CountBits(int n)
    {
        int[] dp = new int[n + 1];

        for (int i = 1; i <= n; i++)
        {
            // i >> 1 sayısının 1 biti sayısına en sağdaki biti (i & 1) ekle.
            dp[i] = dp[i >> 1] + (i & 1);
        }

        return dp;
    }
}
```

```typescript solution
function countBits(n: number): number[] {
  const dp = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i >> 1] + (i & 1);
  }

  return dp;
}
```

### Karmaşıklık

- **Zaman:** `O(n)`. `1`'den `n`'ye kadar her sayı için yalnızca bir sağa kaydırma, bir VE (`&`) ve bir toplama işlemi yapılır.
- **Alan:** `O(1)` ek bellek (döndürülen `n + 1` boyutlu çıktı dizisi `dp` hariç).

## Testler

```json
[
  { "args": [2], "expected": [0, 1, 1], "sample": true },
  { "args": [5], "expected": [0, 1, 1, 2, 1, 2], "sample": true },
  { "args": [0], "expected": [0] },
  { "args": [1], "expected": [0, 1] },
  { "args": [4], "expected": [0, 1, 1, 2, 1] },
  { "args": [8], "expected": [0, 1, 1, 2, 1, 2, 2, 3, 1] },
  { "args": [15], "expected": [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4] }
]
```
