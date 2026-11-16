---
title: Permütasyonlar
difficulty: medium
tags: [geri-izleme, dizi, ozyineleme]
function: permute
params:
  - { name: nums, type: "int[]" }
returns: "List<List<int>>"
compare: unordered
---
Elemanları **birbirinden farklı** bir tam sayı dizisi `nums` veriliyor. Dizinin **bütün permütasyonlarını**, yani elemanlarının bütün farklı sıralanışlarını döndürün.

Permütasyonları istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  nums = [1, 2, 3]
Çıktı:  [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
```

### Örnek 2

```text
Girdi:  nums = [0, 1]
Çıktı:  [[0, 1], [1, 0]]
```

### Örnek 3

```text
Girdi:  nums = [1]
Çıktı:  [[1]]
```

### Kısıtlar

- `1 <= nums.length <= 6`
- `-10 <= nums[i] <= 10`
- Bütün elemanlar birbirinden farklıdır.

## İpuçları

- Permütasyonu soldan sağa, kutu kutu doldurduğunuzu düşünün. İlk kutuya `n` sayıdan herhangi biri, ikinciye kalan `n - 1` sayıdan biri gelebilir.
- Bir sayının o an kullanımda olup olmadığını bilmeniz gerekir. Bunun için dizinin yanında bir `used` dizisi tutabilirsiniz.
- Geri izleme: sayıyı ekleyin, kalan kutular için özyinelemeye girin, dönünce sayıyı **geri çıkarın** ki aynı kutuya sıradaki sayı gelebilsin.
- Sonuca eklerken listenin kendisini değil **kopyasını** ekleyin.

## Çözüm

Permütasyonu soldan sağa, her seferinde bir kutu doldurarak kurarız. `current` o ana kadar doldurulan kutuları, `used[i]` ise `nums[i]`'nin şu an `current` içinde olup olmadığını tutar.

Her çağrı bir sonraki kutuyu doldurur. Kullanılmayan her sayı için aynı üç adım uygulanır:

1. **Seç:** sayıyı `current`'a ekle ve kullanıldı diye işaretle.
2. **İn:** kalan kutuları doldurmak için özyinelemeye gir.
3. **Geri al:** sayıyı çıkar ve işaretini kaldır; böylece aynı kutuya sıradaki sayı gelebilir.

Bütün kutular dolduğunda (`current.Count == nums.Length`) bir permütasyon tamamlanmıştır ve sonuca **kopyası** eklenir. Kopya şarttır: `current` tek bir listedir ve geri alma adımlarıyla değişmeye devam eder.

```csharp solution
public class Solution
{
    public IList<IList<int>> Permute(int[] nums)
    {
        var result = new List<IList<int>>();
        var current = new List<int>();         // kutu kutu kurulan permütasyon
        bool[] used = new bool[nums.Length];   // used[i]: nums[i] şu an current içinde mi?

        Backtrack(nums, used, current, result);
        return result;
    }

    private static void Backtrack(int[] nums, bool[] used, List<int> current, List<IList<int>> result)
    {
        // Bütün kutular doldu. Kopyasını sakla: current bundan sonra değişmeye devam edecek.
        if (current.Count == nums.Length)
        {
            result.Add(new List<int>(current));
            return;
        }

        // Sıradaki kutu için henüz kullanılmayan her sayıyı dene.
        for (int i = 0; i < nums.Length; i++)
        {
            if (used[i]) continue;

            // Seç
            current.Add(nums[i]);
            used[i] = true;

            // İn: kalan kutuları doldur.
            Backtrack(nums, used, current, result);

            // Geri al: bu kutuya sıradaki sayı gelebilsin.
            current.RemoveAt(current.Count - 1);
            used[i] = false;
        }
    }
}
```

```typescript solution
function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const current: number[] = [];
  const used: boolean[] = new Array(nums.length).fill(false);

  const backtrack = (): void => {
    if (current.length === nums.length) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      current.push(nums[i]);
      used[i] = true;

      backtrack();

      current.pop();
      used[i] = false;
    }
  };

  backtrack();
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n · n!). `n!` permütasyon vardır ve her birini kopyalamak O(n) sürer.
- **Alan:** Çıktı hariç O(n) (özyineleme derinliği, `current` ve `used`).

Alt Kümeler problemiyle aynı "seç, in, geri al" iskeleti kullanılır. Fark şudur: alt kümelerde yalnızca ileri gidilir (`start` indeksi), permütasyonlarda ise her kutu için bütün sayılar yeniden denenir ve tekrarı `used` dizisi önler.

## Testler

```json
[
  { "args": [[1, 2, 3]], "expected": [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]], "sample": true },
  { "args": [[0, 1]], "expected": [[0, 1], [1, 0]], "sample": true },
  { "args": [[1]], "expected": [[1]], "sample": true },
  { "args": [[-1, 5]], "expected": [[-1, 5], [5, -1]] },
  { "args": [[3, 2, 1]], "expected": [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] },
  { "args": [[1, 2, 3, 4]], "expected": [[1, 2, 3, 4], [1, 2, 4, 3], [1, 3, 2, 4], [1, 3, 4, 2], [1, 4, 2, 3], [1, 4, 3, 2], [2, 1, 3, 4], [2, 1, 4, 3], [2, 3, 1, 4], [2, 3, 4, 1], [2, 4, 1, 3], [2, 4, 3, 1], [3, 1, 2, 4], [3, 1, 4, 2], [3, 2, 1, 4], [3, 2, 4, 1], [3, 4, 1, 2], [3, 4, 2, 1], [4, 1, 2, 3], [4, 1, 3, 2], [4, 2, 1, 3], [4, 2, 3, 1], [4, 3, 1, 2], [4, 3, 2, 1]] }
]
```
