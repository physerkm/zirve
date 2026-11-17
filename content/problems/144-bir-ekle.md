---
title: Bir Ekle
difficulty: easy
tags: [dizi, matematik]
function: plusOne
params:
  - { name: digits, type: "int[]" }
returns: "int[]"
---
Büyük bir tam sayıyı temsil eden `digits` basamak dizisi veriliyor; burada `digits[i]` sayının en yüksek basamağından en düşük basamağına (soldan sağa) doğru `i`. basamağıdır. Büyük tam sayı hiçbir zaman başında gereksiz `0` barındırmaz (`0` sayısının kendisi hariç).

Bu büyük tam sayıyı **1 artırın** ve oluşan yeni sayının basamak dizisini döndürün.

### Örnek 1

```text
Girdi:  digits = [1,2,3]
Çıktı:  [1,2,4]
Açıklama: Dizi 123 sayısını temsil eder. 123 + 1 = 124 olduğu için [1,2,4] döndürülür.
```

### Örnek 2

```text
Girdi:  digits = [4,3,2,1]
Çıktı:  [4,3,2,2]
Açıklama: Dizi 4321 sayısını temsil eder. 4321 + 1 = 4322 olduğu için [4,3,2,2] döndürülür.
```

### Örnek 3

```text
Girdi:  digits = [9]
Çıktı:  [1,0]
Açıklama: Dizi 9 sayısını temsil eder. 9 + 1 = 10 olduğu için [1,0] döndürülür.
```

### Kısıtlar

- `1 <= digits.length <= 100`
- `0 <= digits[i] <= 9`
- `digits` başında gereksiz `0` içermez.

## İpuçları

- Dizideki basamak sayısı 100'e kadar çıkabileceği için diziyi `int` veya `long` tipine çevirip 1 eklemek taşmaya (overflow) yol açar.
- İlkokulda öğrendiğimiz sağdan sola toplama işlemini doğrudan dizi üzerinde uygulayın.
- Bir basamak `9`'dan küçükse 1 eklediğinizde elde (carry) oluşmaz; o basamağı 1 artırıp diziyi hemen döndürebilirsiniz.
- Peki tüm basamaklar `9` ise (örneğin `[9, 9, 9]`) sonuç dizisinin boyutu ve elemanları ne olur?

## Çözüm

Toplama işlemine en sağdaki (en küçük) basamaktan başlarız ve sola doğru ilerleriz:
1. Baktığımız `digits[i]` basamağı `9`'dan küçükse (`0..8`), 1 eklediğimizde elde oluşmaz: `digits[i]++` yaparız ve başka hiçbir basamak değişmeyeceği için doğrudan `digits` dizisini döndürürüz.
2. Baktığımız basamak `9` ise, `9 + 1 = 10` olduğundan bu basamak `0` olur (`digits[i] = 0`) ve elde `1` bir sol basamağa aktarılır (döngü bir sonraki adıma geçer).
3. Döngü hiç `return` etmeden biterse, dizideki **bütün** basamaklar `9` demektir (`99..9 + 1 = 100..0`). Bu durumda uzunluğu `digits.Length + 1` olan yeni bir dizi açar, yalnızca ilk elemanını `1` yapar (`result[0] = 1`, geri kalanlar varsayılan olarak `0`'dır) ve döndürürüz.

```csharp solution
public class Solution
{
    public int[] PlusOne(int[] digits)
    {
        for (int i = digits.Length - 1; i >= 0; i--)
        {
            // 9'dan küçük ilk basamağı 1 artır; elde oluşmadığı için hemen dön.
            if (digits[i] < 9)
            {
                digits[i]++;
                return digits;
            }

            // Basamak 9 ise 0 olur ve elde sol basamağa taşınır.
            digits[i] = 0;
        }

        // Tüm basamaklar 9 ise: 99...9 + 1 = 100...0
        int[] result = new int[digits.Length + 1];
        result[0] = 1;
        return result;
    }
}
```

```typescript solution
function plusOne(digits: number[]): number[] {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;
      return digits;
    }

    digits[i] = 0;
  }

  const result = new Array<number>(digits.length + 1).fill(0);
  result[0] = 1;
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n). En kötü durumda (tüm basamaklar `9` olduğunda) dizi sondan başa bir kez taranır.
- **Alan:** O(1) (tüm basamaklar `9` değilse yerinde güncellenir; tüm basamaklar `9` olduğunda çıktı için O(n) boyutunda yeni dizi oluşturulur).

## Testler

```json
[
  { "args": [[1, 2, 3]], "expected": [1, 2, 4], "sample": true },
  { "args": [[4, 3, 2, 1]], "expected": [4, 3, 2, 2], "sample": true },
  { "args": [[9]], "expected": [1, 0], "sample": true },
  { "args": [[9, 9, 9]], "expected": [1, 0, 0, 0] },
  { "args": [[1, 9, 9]], "expected": [2, 0, 0] },
  { "args": [[0]], "expected": [1] },
  { "args": [[8, 9, 9, 9]], "expected": [9, 0, 0, 0] }
]
```
