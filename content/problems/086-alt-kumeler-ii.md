---
title: Alt Kümeler II
difficulty: medium
tags: [geri-izleme, dizi, siralama]
function: subsetsWithDup
params:
  - { name: nums, type: "int[]" }
returns: "List<List<int>>"
compare: unordered-nested
---
Tekrar eden elemanlar içerebilen bir tam sayı dizisi `nums` veriliyor. Bu dizinin oluşturulabilecek tüm **benzersiz alt kümelerini** (güç kümesini) döndürün.

Çözüm kümesi **tekrar eden (kopya) alt kümeler içermemelidir**. Alt kümeleri istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  nums = [1, 2, 2]
Çıktı:  [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
Açıklama: Dizide iki adet 2 bulunmasına rağmen [2] ve [1, 2] alt kümeleri sonuçta yalnızca birer kez yer alır.
```

### Örnek 2

```text
Girdi:  nums = [0]
Çıktı:  [[], [0]]
Açıklama: Tek elemanlı dizinin alt kümeleri boş küme ve kendisidir.
```

### Örnek 3

```text
Girdi:  nums = [2, 1, 2]
Çıktı:  [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
Açıklama: Elemanların başlangıç sırası farklı olsa da üretilen benzersiz alt kümeler aynıdır.
```

### Kısıtlar

- `1 <= nums.length <= 10`
- `-10 <= nums[i] <= 10`

## İpuçları

- Tekrar eden elemanları kolayca tespit edebilmek için işe `nums` dizisini **sıralayarak** başlayın.
- Karar ağacının her düğümünde o anki `path` listesi geçerli bir alt kümedir; dolayısıyla her çağrının başında `path` kopyasını sonuca ekleyebilirsiniz.
- Aynı alt kümeyi iki kez üretmemek için, **aynı karar seviyesinde** (aynı `for` döngüsü içinde) daha önce denediğiniz bir sayıyla tekrar karşılaştığınızda onu atlayın.
- `i == start` iken aynı sayıyı seçmek yeni bir derinlik seviyesidir (örneğin `[1, 2, 2]` içinde ikinci `2`'yi seçmek), ancak `i > start && nums[i] == nums[i - 1]` durumu aynı seviyede kopya dal açmak demektir; yalnızca bu durumu atlayın.

## Çözüm

Standart alt küme üretme probleminden tek farkı, girdide aynı sayıdan birden fazla bulunabilmesidir. Örneğin `nums = [1, 2, 2]` dizisinde birinci `2` ile ikinci `2`'yi aynı konumda ayrı ayrı seçersek iki tane `[1, 2]` alt kümesi üretmiş oluruz.

Bunu önlemenin en temiz yolu önce `nums` dizisini **küçükten büyüğe sıralamaktır**. Sıralama sayesinde eşit sayılar yan yana gelir. Ardından geri izleme (`Backtrack(start)`) fonksiyonunda:

1. Her çağrının başında mevcut `path` listesinin bir kopyasını `result` içine ekleriz.
2. `i` indeksini `start`'tan başlatarak dizinin sonuna kadar ilerleriz.
3. Eğer `i > start && nums[i] == nums[i - 1]` ise, bu karar seviyesinde `nums[i]` değerini bir önceki adımda (`i - 1`) zaten seçip tüm alt dallarını üretmişiz demektir; `continue` ile bu kopya dalı atlarız.
4. Aksi halde `nums[i]` elemanını `path` listesine ekler, `Backtrack(i + 1)` ile bir sonraki seviyeye iner ve dönüşte son elemanı listeden çıkarırız.

Dikkat edilirse `i == start` olduğunda `nums[i] == nums[i - 1]` kontrolü yapılmaz; böylece `[1, 2, 2]` gibi aynı sayının farklı derinliklerde birden fazla kez kullanıldığı geçerli alt kümeler korunur.

```csharp solution
public class Solution
{
    public IList<IList<int>> SubsetsWithDup(int[] nums)
    {
        Array.Sort(nums);
        IList<IList<int>> result = new List<IList<int>>();
        List<int> path = new List<int>();

        void Backtrack(int start)
        {
            result.Add(new List<int>(path));

            for (int i = start; i < nums.Length; i++)
            {
                // Aynı ağaç seviyesinde daha önce işlenen kopya elemanı atla.
                if (i > start && nums[i] == nums[i - 1])
                    continue;

                path.Add(nums[i]);
                Backtrack(i + 1);
                path.RemoveAt(path.Count - 1);
            }
        }

        Backtrack(0);
        return result;
    }
}
```

```typescript solution
function subsetsWithDup(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number): void {
    result.push([...path]);

    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;

      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(N * 2^N). En kötü durumda (tüm elemanlar birbirinden farklıyken) `2^N` alt küme vardır ve her alt kümenin kopyalanması en fazla O(N) sürer. Başlangıçtaki sıralama O(N log N) olup üstel terimin yanında baskın değildir.
- **Alan:** O(N) (sonuç listesi hariç). Özyineleme çağrı yığını ve `path` listesi en fazla `N` eleman tutar.

## Testler

```json
[
  { "args": [[1, 2, 2]], "expected": [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]], "sample": true },
  { "args": [[0]], "expected": [[], [0]], "sample": true },
  { "args": [[2, 1, 2]], "expected": [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]], "sample": true },
  { "args": [[4, 4, 4, 1, 4]], "expected": [[], [1], [1, 4], [1, 4, 4], [1, 4, 4, 4], [1, 4, 4, 4, 4], [4], [4, 4], [4, 4, 4], [4, 4, 4, 4]] },
  { "args": [[1, 2, 3]], "expected": [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]] },
  { "args": [[5, 5]], "expected": [[], [5], [5, 5]] },
  { "args": [[-1, 1, -1]], "expected": [[], [-1], [-1, -1], [-1, -1, 1], [-1, 1], [1]] }
]
```
