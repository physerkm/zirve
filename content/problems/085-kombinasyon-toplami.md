---
title: Kombinasyon Toplamı
difficulty: medium
tags: [geri-izleme, dizi, ozyineleme]
function: combinationSum
params:
  - { name: candidates, type: "int[]" }
  - { name: target, type: "int" }
returns: "List<List<int>>"
compare: unordered-nested
---
Birbirinden **farklı** pozitif tam sayılardan oluşan bir `candidates` dizisi ve bir hedef tam sayı `target` veriliyor. Seçilen sayıların toplamı `target` değerine eşit olan tüm **benzersiz kombinasyonların** listesini döndürün. Kombinasyonları istediğiniz sırada döndürebilirsiniz.

`candidates` içindeki aynı sayı **sınırsız kez** seçilebilir. İki kombinasyon, seçilen sayılardan en az birinin kullanım adedi (frekansı) farklıysa birbirinden farklı kabul edilir.

### Örnek 1

```text
Girdi:  candidates = [2, 3, 6, 7], target = 7
Çıktı:  [[2, 2, 3], [7]]
Açıklama:
2 ve 3 adayları kullanılarak 2 + 2 + 3 = 7 elde edilir (2 birden fazla kez kullanılabilir).
7 tek başına 7'ye eşittir.
Başka bir kombinasyon yoktur.
```

### Örnek 2

```text
Girdi:  candidates = [2, 3, 5], target = 8
Çıktı:  [[2, 2, 2, 2], [2, 3, 3], [3, 5]]
Açıklama: Toplamı 8 olan üç farklı kombinasyon vardır.
```

### Örnek 3

```text
Girdi:  candidates = [2], target = 1
Çıktı:  []
Açıklama: En küçük aday 2 olduğu için toplamı 1 yapan hiçbir seçim mümkün değildir.
```

### Kısıtlar

- `1 <= candidates.length <= 30`
- `2 <= candidates[i] <= 40`
- `candidates` içindeki tüm elemanlar birbirinden farklıdır.
- `1 <= target <= 40`

## İpuçları

- Her adımda bir adayı seçip kalan hedef değerden (`remaining`) düşerek karar ağacında ilerleyebilirsiniz.
- `[2, 2, 3]` ile `[2, 3, 2]` gibi aynı kombinasyonun farklı sıralamalarını (permütasyonlarını) üretmemek için, bir sonraki adımda yalnızca mevcut indeks `i` ve sonrasındaki adaylara bakın (`start` parametresi).
- Aynı elemanı sınırsız kez kullanabildiğiniz için özyineleme çağrısında başlangıç indeksini `i + 1` yerine `i` olarak geçirin.
- Kalan hedef `0` olduğunda geçerli bir kombinasyon buldunuz demektir; `0`'ın altına düştüğünde ise o dalı budayıp geri dönün.

## Çözüm

Problemi bir karar ağacı üzerinde **geri izleme (backtracking)** ile çözeriz. Her düğümde o ana kadar seçtiğimiz sayıları tutan `path` listesi, aramaya hangi indeksten devam edeceğimizi belirten `start` ve ulaşmamız gereken kalan toplam `remaining` bulunur.

Aynı kombinasyonun farklı dizilişlerini (örneğin `[2, 3, 2]` ve `[3, 2, 2]`) tekrar üretmemek için adayları daima belirli bir sıra ile seçeriz: `start` indeksinden başlayarak `i` indeksindeki adayı seçtiğimizde, alt çağrıda `i`'den önceki elemanlara bir daha geri dönmeyiz. Ancak aynı sayıyı sınırsız kez seçebildiğimiz için özyinelemeli çağrıyı `Backtrack(i, remaining - candidates[i])` şeklinde, yani `i` indeksini sabit tutarak yaparız. Döngü bir sonraki adımda `i + 1`'e geçtiğinde ise o elemandan vazgeçip sonraki adaylara geçmiş oluruz.

Kalan toplam `remaining == 0` olduğunda `path` içindeki sayıların toplamı tam olarak `target` değerine ulaşmıştır; `path` listesinin bir **kopyasını** sonuç listesine ekleriz. `remaining < 0` olduğunda ise hedefi aştığımız için bu dalı derhal sonlandırırız ve son eklediğimiz sayıyı `path`'ten çıkararak (`RemoveAt` / `pop`) bir üst karara geri döneriz.

```csharp solution
public class Solution
{
    public IList<IList<int>> CombinationSum(int[] candidates, int target)
    {
        IList<IList<int>> result = new List<IList<int>>();
        List<int> path = new List<int>();

        void Backtrack(int start, int remaining)
        {
            if (remaining == 0)
            {
                result.Add(new List<int>(path));
                return;
            }

            if (remaining < 0)
                return;

            for (int i = start; i < candidates.Length; i++)
            {
                path.Add(candidates[i]);
                // Aynı elemanı tekrar seçebilmek için i indeksini sabit tutuyoruz.
                Backtrack(i, remaining - candidates[i]);
                path.RemoveAt(path.Count - 1);
            }
        }

        Backtrack(0, target);
        return result;
    }
}
```

```typescript solution
function combinationSum(candidates: number[], target: number): number[][] {
  const result: number[][] = [];
  const path: number[] = [];

  function backtrack(start: number, remaining: number): void {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    if (remaining < 0) return;

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]);
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(N^(T/M + 1)). Burada `N` aday sayısı, `T` hedef değer (`target`), `M` ise `candidates` içindeki en küçük sayıdır. Karar ağacının derinliği en fazla `T/M` olabilir ve her düğümde en fazla `N` dallanma gerçekleşir.
- **Alan:** O(T/M) (sonuç listesi hariç). Özyineleme çağrı yığını ve `path` listesi en fazla `T/M` derinliğe ulaşır.

## Testler

```json
[
  { "args": [[2, 3, 6, 7], 7], "expected": [[2, 2, 3], [7]], "sample": true },
  { "args": [[2, 3, 5], 8], "expected": [[2, 2, 2, 2], [2, 3, 3], [3, 5]], "sample": true },
  { "args": [[2], 1], "expected": [], "sample": true },
  { "args": [[3, 4, 7], 7], "expected": [[3, 4], [7]] },
  { "args": [[2, 4, 6], 6], "expected": [[2, 2, 2], [2, 4], [6]] },
  { "args": [[5, 10, 15], 3], "expected": [] },
  { "args": [[2, 3], 6], "expected": [[2, 2, 2], [3, 3]] },
  { "args": [[7], 14], "expected": [[7, 7]] }
]
```
