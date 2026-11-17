---
title: Sıralı Dizide İki Sayının Toplamı
difficulty: medium
tags: [dizi, iki-isaretci, ikili-arama]
function: twoSum
params:
  - { name: numbers, type: "int[]" }
  - { name: target, type: "int" }
returns: "int[]"
---
**Artmayan değil, azalmayan sırada** (küçükten büyüğe) sıralanmış, **1 tabanlı** indekslenen bir tam sayı dizisi `numbers` ve bir hedef değer `target` veriliyor. Toplamı `target` eden iki sayıyı bulun ve indekslerini `[index1, index2]` biçiminde döndürün (`1 <= index1 < index2 <= numbers.length`).

Her girdinin tam olarak bir çözümü vardır ve aynı elemanı iki kez kullanamazsınız. Çözümünüz yalnızca **sabit ek alan** kullanmalıdır.

### Örnek 1

```text
Girdi:  numbers = [2, 7, 11, 15], target = 9
Çıktı:  [1, 2]
Açıklama: 2 + 7 = 9. index1 = 1, index2 = 2.
```

### Örnek 2

```text
Girdi:  numbers = [2, 3, 4], target = 6
Çıktı:  [1, 3]
```

### Örnek 3

```text
Girdi:  numbers = [-1, 0], target = -1
Çıktı:  [1, 2]
```

### Kısıtlar

- `2 <= numbers.length <= 3 * 10^4`
- `-1000 <= numbers[i] <= 1000`
- `numbers` azalmayan sırada sıralıdır.
- `-1000 <= target <= 1000`
- Tam olarak bir çözüm vardır.

## İpuçları

- "İki Sayının Toplamı"ndaki hash tablosu burada da çalışır, ama O(n) ek alan harcar. Dizinin sıralı olmasından nasıl yararlanabilirsiniz?
- En küçük ve en büyük elemanı toplayın. Toplam hedeften büyükse, en büyük eleman hiçbir çözümün parçası olabilir mi?
- Bir işaretçiyi başa, birini sona koyun. Toplam büyükse sağdakini sola, küçükse soldakini sağa kaydırın.

## Çözüm

### İki uçtan iki işaretçi

`left = 0` ve `right = n - 1` ile başlarız. `numbers[left] + numbers[right]`:

- `target`'a eşitse cevabı bulduk.
- `target`'tan **büyükse**, `numbers[right]` en küçük olası eşiyle (`numbers[left]`) bile fazla geliyor demektir. Daha sağdaki hiçbir sayıyla da işe yaramaz; `right` bir sola kayar.
- `target`'tan **küçükse**, simetrik nedenle `numbers[left]` en büyük olası eşiyle bile yetmiyor; `left` bir sağa kayar.

Her adımda bir eleman kesin olarak elenir ve çözüm hiçbir zaman aralığın dışında kalmaz. LeetCode'daki gibi indeksler 1 tabanlı döndürülür.

```csharp solution
public class Solution
{
    public int[] TwoSum(int[] numbers, int target)
    {
        var left = 0;
        var right = numbers.Length - 1;

        while (left < right)
        {
            var sum = numbers[left] + numbers[right];
            if (sum == target)
            {
                return new[] { left + 1, right + 1 };
            }

            if (sum > target)
            {
                right--;
            }
            else
            {
                left++;
            }
        }

        return Array.Empty<int>();
    }
}
```

```typescript solution
function twoSum(numbers: number[], target: number): number[] {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    }

    if (sum > target) {
      right--;
    } else {
      left++;
    }
  }

  return [];
}
```

### Karmaşıklık

- **Zaman:** O(n). Her adımda iki işaretçiden biri içeri doğru bir adım atar.
- **Alan:** O(1). Yalnızca iki indeks tutulur.

Her adımda dizinin bir ucunu elemek, sıralı dizilerde iki işaretçi kalıbının özüdür. Aynı fikir "Üç Sayının Toplamı" probleminin iç döngüsüdür.

## Testler

```json
[
  { "args": [[2, 7, 11, 15], 9], "expected": [1, 2], "sample": true },
  { "args": [[2, 3, 4], 6], "expected": [1, 3], "sample": true },
  { "args": [[-1, 0], -1], "expected": [1, 2], "sample": true },
  { "args": [[1, 2, 3, 4, 4, 9, 56, 90], 8], "expected": [4, 5] },
  { "args": [[5, 25, 75], 100], "expected": [2, 3] },
  { "args": [[-10, -8, -2, 1, 2, 5, 6], 0], "expected": [3, 5] },
  { "args": [[1, 1, 1, 1, 1, 1, 2, 2], 4], "expected": [7, 8] },
  { "args": [[-1000, -1, 0, 1, 1000], 999], "expected": [2, 5] }
]
```
