---
title: Tekrar Eden Sayıyı Bul
difficulty: medium
tags: [dizi, iki-isaretci, ikili-arama, bit-islemleri]
function: findDuplicate
params:
  - { name: nums, type: "int[]" }
returns: "int"
---
`n + 1` elemanlı bir tam sayı dizisi `nums` veriliyor; her eleman `[1, n]` aralığındadır. Dizide **tekrar eden tek bir sayı** vardır (bu sayı ikiden fazla kez de geçebilir). Bu sayıyı döndürün.

Diziyi **değiştirmeden** ve yalnızca **sabit ek alan** kullanarak çözmelisiniz.

### Örnek 1

```text
Girdi:  nums = [1, 3, 4, 2, 2]
Çıktı:  2
```

### Örnek 2

```text
Girdi:  nums = [3, 1, 3, 4, 2]
Çıktı:  3
```

### Örnek 3

```text
Girdi:  nums = [3, 3, 3, 3, 3]
Çıktı:  3
```

### Kısıtlar

- `1 <= n <= 10^5`
- `nums.length == n + 1`
- `1 <= nums[i] <= n`
- Yalnızca bir sayı tekrar eder; o sayı birden fazla kez tekrar edebilir.

**Devam sorusu:** Doğrusal zamanda çözebilir misiniz?

## İpuçları

- Hash kümesi ya da sıralama kolay çözümlerdir, ama biri O(n) alan ister, öbürü diziyi değiştirir.
- Her `i` indeksinden `nums[i]` indeksine bir ok çizdiğinizi düşünün. Değerler `[1, n]` aralığında olduğu için her ok dizinin içine düşer. Bu yapı neye benziyor?
- `0`'dan başlayan "bağlı liste" bir döngüye girer ve döngünün giriş noktası tekrar eden sayıdır. Floyd'un döngü bulma algoritmasını uygulayın.

## Çözüm

### Diziyi bağlı liste gibi görmek

`i → nums[i]` oklarını izlediğimizde, `0` indeksinden başlayan yol bir süre sonra mutlaka bir döngüye girer (n + 1 indeks var, oklar yalnızca `1..n`'yi gösteriyor). Tekrar eden sayı `d`'yi gösteren en az iki ok vardır; döngüye giriş noktası tam olarak `d` indeksidir.

### Floyd: buluşma ve giriş noktası

1. **Buluşma:** `slow = nums[slow]` bir adım, `fast = nums[nums[fast]]` iki adım ilerler; döngüde buluşurlar.
2. **Giriş:** `slow` başa (`0`) alınır; ikisi de birer adım ilerler. Başlangıçtan girişe olan mesafe, buluşma noktasından girişe olan mesafeye (döngü uzunluğunun katları kadar farkla) eşit olduğu için tam giriş noktasında karşılaşırlar.

```csharp solution
public class Solution
{
    public int FindDuplicate(int[] nums)
    {
        var slow = 0;
        var fast = 0;

        do
        {
            slow = nums[slow];
            fast = nums[nums[fast]];
        }
        while (slow != fast);

        slow = 0;
        while (slow != fast)
        {
            slow = nums[slow];
            fast = nums[fast];
        }

        return slow;
    }
}
```

```typescript solution
function findDuplicate(nums: number[]): number {
  let slow = 0;
  let fast = 0;

  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);

  slow = 0;
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }

  return slow;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1). Dizi değiştirilmez.

Alternatif O(n log n) çözüm, **değer aralığında ikili arama** yapar: `<= mid` olan eleman sayısı `mid`'den fazlaysa tekrar eden sayı `[1, mid]` aralığındadır (güvercin yuvası ilkesi).

## Testler

```json
[
  { "args": [[1, 3, 4, 2, 2]], "expected": 2, "sample": true },
  { "args": [[3, 1, 3, 4, 2]], "expected": 3, "sample": true },
  { "args": [[3, 3, 3, 3, 3]], "expected": 3, "sample": true },
  { "args": [[1, 1]], "expected": 1 },
  { "args": [[1, 1, 2]], "expected": 1 },
  { "args": [[1, 4, 4, 2, 4]], "expected": 4 },
  { "args": [[2, 5, 9, 6, 9, 3, 8, 9, 7, 1]], "expected": 9 },
  { "args": [[2, 6, 4, 1, 3, 1, 5]], "expected": 1 }
]
```
