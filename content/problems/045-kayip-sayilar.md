---
title: Kayıp Sayılar
difficulty: easy
tags: [dizi, hash-tablosu]
function: findDisappearedNumbers
params:
  - { name: nums, type: "int[]" }
returns: "List<int>"
compare: unordered
---
`n` elemanlı bir tam sayı dizisi `nums` veriliyor ve her eleman `[1, n]` aralığındadır. Bazı sayılar birden fazla kez geçebilir, bazıları hiç geçmeyebilir.

`[1, n]` aralığında olup `nums` içinde **hiç geçmeyen** bütün sayıları döndürün. Sayıları istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  nums = [4, 3, 2, 7, 8, 2, 3, 1]
Çıktı:  [5, 6]
```

### Örnek 2

```text
Girdi:  nums = [1, 1]
Çıktı:  [2]
```

### Kısıtlar

- `1 <= n <= 10^5`
- `1 <= nums[i] <= n`

**Devam sorusu:** Ek bellek kullanmadan ve O(n) zamanda çözebilir misiniz? (Döndürülen liste ek bellek sayılmaz.)

## İpuçları

- Görülen sayıları bir kümeye koyup 1'den `n`'ye kadar olanları sorgulamak çalışır ama O(n) ek bellek ister.
- Değerler `1..n`, indeksler `0..n-1` aralığında. Her `x` değerine dizide bir "kutu" karşılık gelir: `nums[x - 1]`.
- Bir sayıyı gördüğünüzü, onun kutusundaki değeri bozmadan nasıl işaretleyebilirsiniz? İşaretini değiştirmeyi düşünün.
- İşaretledikten sonra okurken mutlak değer almayı unutmayın.

## Çözüm

Değerler `1..n` aralığında, dizinin indeksleri ise `0..n-1`. Öyleyse her `x` sayısının dizide kendine ait bir kutusu vardır: `nums[x - 1]`. Ek bir veri yapısı açmak yerine "bu sayıyı gördüm" bilgisini bu kutuya yazarız.

Kutudaki asıl değeri kaybetmemek için işaretlemeyi **eksi işaretiyle** yaparız: `x` görüldüğünde `nums[x - 1]` negatif yapılır. Değerin büyüklüğü aynı kalır; yalnızca işareti bilgi taşır.

1. **İşaretle:** Her eleman için kutusunu bul ve negatif yap. Elemanın kendisi daha önceki bir işaretleme yüzünden negatif olabilir; bu yüzden kutuyu hesaplarken mutlak değeri alınır. Kutu zaten negatifse dokunulmaz (aynı sayı ikinci kez görülmüştür).
2. **Topla:** Diziyi bir kez daha gez. Pozitif kalan her kutu, hiç görülmemiş bir sayıya aittir: `i` indeksi pozitifse `i + 1` kayıptır.

İkinci geçişte negatif kutular yeniden pozitife çevrilir; böylece fonksiyonu çağıran kod dizisini değişmemiş olarak geri alır.

```csharp solution
public class Solution
{
    public IList<int> FindDisappearedNumbers(int[] nums)
    {
        // 1..n arasındaki her x sayısının kendi kutusu vardır: nums[x - 1].
        // x görüldüğünde kutusu, oradaki değer negatif yapılarak işaretlenir.
        foreach (int num in nums)
        {
            int box = Math.Abs(num) - 1; // num daha önceki bir işaretlemeyle negatif olmuş olabilir
            if (nums[box] > 0)
                nums[box] = -nums[box];
        }

        // Pozitif kalan kutu, hiç görülmemiş bir sayıya aittir.
        List<int> result = new List<int>();
        for (int i = 0; i < nums.Length; i++)
        {
            if (nums[i] > 0)
                result.Add(i + 1);
            else
                nums[i] = -nums[i]; // işareti geri al: çağıran taraf dizisini değişmemiş olarak geri alsın
        }

        return result;
    }
}
```

```typescript solution
function findDisappearedNumbers(nums: number[]): number[] {
  for (const num of nums) {
    const box = Math.abs(num) - 1;
    if (nums[box] > 0) nums[box] = -nums[box];
  }

  const result: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > 0) result.push(i + 1);
    else nums[i] = -nums[i];
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n), iki geçiş.
- **Alan:** Döndürülen liste hariç O(1).

"Değerler `1..n` aralığında" kısıtı, diziyi kendi kendisinin hash tablosu olarak kullanabileceğinizin işaretidir. Aynı fikir "tekrar eden sayıyı bul" ve "ilk eksik pozitif sayı" gibi problemlerde de karşınıza çıkar.

TypeScript çözümündeki `for...of` döngüsü, dizi döngü sırasında değiştirildiği hâlde doğru çalışır: her adımda elemanın **güncel** değeri okunur ve mutlak değer alındığı için işaretlenmiş olması sonucu etkilemez.

## Testler

```json
[
  { "args": [[4, 3, 2, 7, 8, 2, 3, 1]], "expected": [5, 6], "sample": true },
  { "args": [[1, 1]], "expected": [2], "sample": true },
  { "args": [[1]], "expected": [] },
  { "args": [[2, 2]], "expected": [1] },
  { "args": [[1, 2, 3, 4]], "expected": [] },
  { "args": [[3, 3, 3]], "expected": [1, 2] },
  { "args": [[5, 4, 3, 2, 1]], "expected": [] },
  { "args": [[2, 2, 4, 4, 6, 6]], "expected": [1, 3, 5] }
]
```
