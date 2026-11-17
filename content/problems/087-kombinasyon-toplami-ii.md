---
title: Kombinasyon Toplamı II
difficulty: medium
tags: [geri-izleme, dizi, siralama]
function: combinationSum2
params:
  - { name: candidates, type: "int[]" }
  - { name: target, type: "int" }
returns: "List<List<int>>"
compare: unordered-nested
---
Aday sayılardan oluşan bir `candidates` dizisi ve bir hedef sayı `target` veriliyor. `candidates` içindeki sayıların toplamı `target` değerine eşit olan tüm **benzersiz kombinasyonları** bulun.

`candidates` içindeki her bir sayı (her bir indeks), bir kombinasyonda **en fazla bir kez** kullanılabilir.

**Not:** Çözüm kümesi tekrar eden (kopya) kombinasyonlar içermemelidir.

### Örnek 1

```text
Girdi:  candidates = [10, 1, 2, 7, 6, 1, 5], target = 8
Çıktı:  [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]
Açıklama:
Dizide iki adet 1 bulunduğu için [1, 1, 6] geçerlidir; ancak [1, 7] veya [1, 2, 5] kombinasyonları sonuçta yalnızca birer kez yer alır.
```

### Örnek 2

```text
Girdi:  candidates = [2, 5, 2, 1, 2], target = 5
Çıktı:  [[1, 2, 2], [5]]
Açıklama: Toplamı 5 yapan benzersiz kombinasyonlar [1, 2, 2] ve [5]'tir.
```

### Kısıtlar

- `1 <= candidates.length <= 100`
- `1 <= candidates[i] <= 50`
- `1 <= target <= 30`

## İpuçları

- İlk "Kombinasyon Toplamı" probleminden iki farkı vardır: her indeks en fazla bir kez kullanılabilir ve dizide tekrar eden sayılar bulunabilir.
- Tekrar eden sayıları yan yana getirmek ve erken budama yapabilmek için önce `candidates` dizisini **sıralayın**.
- Bir elemanı en fazla bir kez kullanabilmek için özyinelemeli çağrıda başlangıç indeksini `i` yerine `i + 1` olarak ilerletin.
- Aynı karar seviyesinde kopya kombinasyonlar üretmemek için `i > start && candidates[i] == candidates[i - 1]` olduğunda o adayı atlayın. Ayrıca dizi sıralı olduğundan `candidates[i] > remaining` olduğunda döngüyü `break` ile tamamen sonlandırabilirsiniz.

## Çözüm

Bu problem, **Kombinasyon Toplamı** (LC 39) ile **Alt Kümeler II** (LC 90) tekniklerinin birleşimidir:

1. **Sıralama:** İşe `candidates` dizisini küçükten büyüğe sıralayarak başlarız. Böylece hem aynı değere sahip elemanlar yan yana gelir hem de kalan hedefi aşan bir sayıya ulaştığımızda döngüyü erken sonlandırma (`break`) şansı elde ederiz.
2. **Aynı Seviyede Kopya Budama:** `for` döngüsünde `i > start && candidates[i] == candidates[i - 1]` koşulu sağlanıyorsa, bu ağaç seviyesinde aynı sayıyı bir önceki adımda zaten seçip tüm alt kombinasyonlarını aramışız demektir; `continue` ile atlarız.
3. **Tek Kullanım (`i + 1`):** Her indeks en fazla bir kez kullanılabildiği için alt çağrıyı `Backtrack(i + 1, remaining - candidates[i])` şeklinde yaparız.
4. **Sıralı Erken Çıkış (`break`):** Dizi sıralı olduğu için `candidates[i] > remaining` olduğunda, `i` ve sonrasındaki hiçbir eleman kalan hedefe sığamaz; `break` ile döngüden hemen çıkarız.

```csharp solution
public class Solution
{
    public IList<IList<int>> CombinationSum2(int[] candidates, int target)
    {
        Array.Sort(candidates);
        IList<IList<int>> result = new List<IList<int>>();
        List<int> path = new List<int>();

        void Backtrack(int start, int remaining)
        {
            if (remaining == 0)
            {
                result.Add(new List<int>(path));
                return;
            }

            for (int i = start; i < candidates.Length; i++)
            {
                // Aynı ağaç seviyesinde kopya dal açmayı önle.
                if (i > start && candidates[i] == candidates[i - 1])
                    continue;

                // Dizi sıralı olduğundan sonraki elemanlar da remaining'den büyük olacaktır.
                if (candidates[i] > remaining)
                    break;

                path.Add(candidates[i]);
                Backtrack(i + 1, remaining - candidates[i]);
                path.RemoveAt(path.Count - 1);
            }
        }

        Backtrack(0, target);
        return result;
    }
}
```

```typescript solution
function combinationSum2(candidates: number[], target: number): number[][] {
  candidates.sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number, remaining: number): void {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      if (candidates[i] > remaining) break;

      path.push(candidates[i]);
      backtrack(i + 1, remaining - candidates[i]);
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(N * 2^N). En kötü durumda karar ağacında `2^N` alt küme incelenir ve geçerli her kombinasyonun kopyalanması O(N) sürer.
- **Alan:** O(N) (sonuç listesi hariç). Özyineleme yığını ve `path` listesi en fazla `N` derinliğe ulaşır.

## Testler

```json
[
  { "args": [[10, 1, 2, 7, 6, 1, 5], 8], "expected": [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]], "sample": true },
  { "args": [[2, 5, 2, 1, 2], 5], "expected": [[1, 2, 2], [5]], "sample": true },
  { "args": [[1, 1, 1, 1], 2], "expected": [[1, 1]] },
  { "args": [[3, 1, 3, 5, 1, 1], 8], "expected": [[1, 1, 1, 5], [1, 1, 3, 3], [3, 5]] },
  { "args": [[2, 4, 6], 5], "expected": [] },
  { "args": [[1, 2, 3, 4], 5], "expected": [[1, 4], [2, 3]] },
  { "args": [[2, 2, 2], 4], "expected": [[2, 2]] }
]
```
