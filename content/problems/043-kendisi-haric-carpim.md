---
title: Kendisi Hariç Çarpım
difficulty: medium
tags: [dizi, on-ek-toplami]
function: productExceptSelf
params:
  - { name: nums, type: "int[]" }
returns: "int[]"
---
Bir tam sayı dizisi `nums` veriliyor. Öyle bir `answer` dizisi döndürün ki `answer[i]`, `nums[i]` **dışındaki** bütün elemanların çarpımına eşit olsun.

Çözümünüz **O(n)** zamanda çalışmalı ve **bölme işlemi kullanmamalıdır**.

### Örnek 1

```text
Girdi:  nums = [1, 2, 3, 4]
Çıktı:  [24, 12, 8, 6]
```

### Örnek 2

```text
Girdi:  nums = [-1, 1, 0, -3, 3]
Çıktı:  [0, 0, 9, 0, 0]
```

### Kısıtlar

- `2 <= nums.length <= 10^5`
- `-30 <= nums[i] <= 30`
- Her ön ek ve son ek çarpımı 32 bitlik tam sayıya sığar.

**Devam sorusu:** Problemi O(1) ek bellekle çözebilir misiniz? (Döndürülen dizi ek bellek sayılmaz.)

## İpuçları

- Hepsini çarpıp `nums[i]`'ye bölmek hem yasak hem de dizide 0 varken çalışmaz.
- Bir elemanı kapattığınızda geriye kalanlar iki gruptur: solundakiler ve sağındakiler.
- `answer[i]` = (soldakilerin çarpımı) × (sağdakilerin çarpımı). Sol çarpımları soldan sağa tek geçişte hesaplayabilirsiniz.
- Sağ çarpımlar için ayrı bir dizi şart değil: sağdan sola dönerken tek bir değişkende biriktirin.

## Çözüm

Bir elemanı kapattığımızda kalanlar ikiye ayrılır: solundakiler ve sağındakiler. Cevap bu iki grubun çarpımlarının çarpımıdır:

```text
answer[i] = (nums[0] · … · nums[i-1]) × (nums[i+1] · … · nums[n-1])
```

İki geçişte hesaplarız:

1. **Soldan sağa:** `answer[i]`'ye `i`'nin solundaki bütün elemanların çarpımını yazarız. İlk elemanın solunda eleman yoktur; çarpmanın etkisiz elemanı olan 1 yazılır. Sonraki her kutu, bir önceki kutunun değeri ile bir önceki sayının çarpımıdır.
2. **Sağdan sola:** `right` değişkeni, geçtiğimiz elemanların (yani `i`'nin sağındakilerin) çarpımını tutar. `answer[i]`'yi `right` ile çarpınca o kutunun cevabı tamamlanır; sonra `nums[i]`, `right`'a katılır.

Sol çarpımlar doğrudan sonuç dizisine yazıldığı ve sağ çarpımlar tek değişkende biriktiği için ek dizi gerekmez.

Hiç bölme yapılmadığı için sıfırlar da kendiliğinden doğru sonucu verir: tek bir 0 varsa yalnızca o indeksin cevabı sıfırdan farklı olur; iki 0 varsa bütün cevaplar 0'dır.

```csharp solution
public class Solution
{
    public int[] ProductExceptSelf(int[] nums)
    {
        int n = nums.Length;
        int[] answer = new int[n];

        // Soldan sağa: answer[i] = i'nin solundaki her şeyin çarpımı.
        answer[0] = 1;
        for (int i = 1; i < n; i++)
            answer[i] = answer[i - 1] * nums[i - 1];

        // Sağdan sola: right, i'nin sağındaki her şeyin çarpımıdır.
        int right = 1;
        for (int i = n - 1; i >= 0; i--)
        {
            answer[i] *= right;
            right *= nums[i];
        }

        return answer;
    }
}
```

```typescript solution
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const answer: number[] = new Array(n).fill(1);

  for (let i = 1; i < n; i++) {
    answer[i] = answer[i - 1] * nums[i - 1];
  }

  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }

  // -0 yerine 0 döndür: JavaScript'te 0 ile negatif bir sayının çarpımı -0'dır.
  return answer.map((value) => value + 0);
}
```

### Karmaşıklık

- **Zaman:** O(n), iki geçiş.
- **Alan:** Döndürülen dizi hariç O(1).

**Daha kolay ama daha çok bellek isteyen çözüm:** Sol ve sağ çarpımları `left` ve `right` adlı iki ayrı dizide tutup sonra kutu kutu çarpmak. O da O(n) zamanda çalışır ama O(n) ek bellek kullanır. Mülakatta önce bunu anlatıp sonra tek değişkene indirmek iyi bir yoldur.

## Testler

```json
[
  { "args": [[1, 2, 3, 4]], "expected": [24, 12, 8, 6], "sample": true },
  { "args": [[-1, 1, 0, -3, 3]], "expected": [0, 0, 9, 0, 0], "sample": true },
  { "args": [[2, 3]], "expected": [3, 2] },
  { "args": [[0, 4, 0]], "expected": [0, 0, 0] },
  { "args": [[0, 0]], "expected": [0, 0] },
  { "args": [[5, 0]], "expected": [0, 5] },
  { "args": [[-2, -3, 4]], "expected": [-12, -8, 6] },
  { "args": [[1, 1, 1, 1]], "expected": [1, 1, 1, 1] },
  { "args": [[2, 2, 2, 2, 2, 2, 2, 2, 2, 2]], "expected": [512, 512, 512, 512, 512, 512, 512, 512, 512, 512] },
  { "args": [[-1, -1, -1]], "expected": [1, 1, 1] }
]
```
