---
title: Hedef Üçlü İçin Üçlüleri Birleştir
difficulty: medium
tags: [acgozlu, dizi]
function: mergeTriplets
params:
  - { name: triplets, type: "int[][]" }
  - { name: target, type: "int[]" }
returns: "bool"
---
Bir **üçlü** (triplet), üç tam sayıdan oluşan bir dizidir. Size 2 boyutlu bir tam sayı dizisi `triplets` (`triplets[i] = [ai, bi, ci]`) ve elde etmek istediğiniz hedef üçlü `target = [x, y, z]` veriliyor.

`target` üçlüsünü elde etmek için `triplets` üzerinde aşağıdaki işlemi istediğiniz kadar (sıfır kez dahil) uygulayabilirsiniz:

- İki farklı indeks `i` ve `j` (`i != j`) seçin ve `triplets[j]` değerini `[max(ai, aj), max(bi, bj), max(ci, cj)]` olarak güncelleyin.

Bu işlemler sonucunda `target` üçlüsünü `triplets` dizisinin bir elemanı olarak elde etmek mümkünse `true`, değilse `false` döndürün.

### Örnek 1

```text
Girdi:  triplets = [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target = [2, 7, 5]
Çıktı:  true
Açıklama: 0. ve 2. üçlüleri birleştirirsek [max(2, 1), max(5, 7), max(3, 5)] = [2, 7, 5] elde ederiz.
```

### Örnek 2

```text
Girdi:  triplets = [[3, 4, 5], [4, 5, 6]], target = [3, 2, 5]
Çıktı:  false
Açıklama: Her iki üçlünün de ortanca elemanı hedefin ortanca elemanından (2) büyüktür; birleştirme işlemi değerleri yalnızca büyütebileceği için [3, 2, 5] elde edilemez.
```

### Örnek 3

```text
Girdi:  triplets = [[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], target = [5, 5, 5]
Çıktı:  true
Açıklama: Tüm üçlüleri sırayla birleştirirsek [5, 5, 5] hedef üçlüsüne ulaşırız.
```

### Kısıtlar

- `1 <= triplets.length <= 10^5`
- `triplets[i].length == target.length == 3`
- `1 <= ai, bi, ci, x, y, z <= 1000`

## İpuçları

- Birleştirme işlemi (`max`) elemanları yalnızca büyütür, asla küçültmez.
- Herhangi bir konumda `target` değerini **aşan** (`t[0] > target[0]` veya `t[1] > target[1]` veya `t[2] > target[2]`) bir üçlü seçilirse, o konum bir daha asla hedefe indirilemez.
- Bu "tehlikeli" üçlüleri tamamen elediğimizde, geriye kalan "güvenli" üçlülerin hepsini birleştirmek hiçbir konumu hedefin üzerine çıkarmaz.
- Kalan güvenli üçlüler arasında 0., 1. ve 2. indekslerde `target` değerlerine eşit en az birer eleman bulabiliyorsak hedefe ulaşabiliriz.

## Çözüm

Birleştirme işlemi iki üçlünün karşılıklı elemanlarının **maksimumunu** alır. Dolayısıyla bir üçlünün herhangi bir elemanı hedefin ilgili elemanından büyükse (`t[0] > target[0]`, `t[1] > target[1]` veya `t[2] > target[2]`), bu üçlüyü birleştirmeye dahil ettiğimiz anda o indeks hedefin üstüne çıkar ve `max` işlemiyle bir daha asla küçültülemez. Bu yüzden bu tür üçlüleri **kesinlikle kullanamayız**.

Peki hiçbir indekste hedefi aşmayan (`t[0] <= target[0]`, `t[1] <= target[1]` ve `t[2] <= target[2]`) "güvenli" üçlülerin **hepsini** birleştirirsek ne olur?
- Hiçbir indeks `target` değerini aşmaz.
- Eğer güvenli üçlülerden en az birinin 0. elemanı `target[0]` ise, en az birinin 1. elemanı `target[1]` ise ve en az birinin 2. elemanı `target[2]` ise, bunların birleşimi tam olarak `[target[0], target[1], target[2]]` olur!

Bu nedenle diziyi tek geçişte tararız:
1. Hedefi aşan üçlüleri `continue` ile atlarız.
2. Güvenli üçlülerde `t[0] == target[0]`, `t[1] == target[1]` ve `t[2] == target[2]` koşullarını üç ayrı `bool` bayrağında (`ok0`, `ok1`, `ok2`) takip ederiz.
3. Üç bayrak da `true` olduğunda hedef oluşturulabilir demektir.

```csharp solution
public class Solution
{
    public bool MergeTriplets(int[][] triplets, int[] target)
    {
        bool ok0 = false, ok1 = false, ok2 = false;

        foreach (int[] t in triplets)
        {
            // Herhangi bir indekste hedefi aşan üçlü kullanılamaz.
            if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2])
                continue;

            if (t[0] == target[0]) ok0 = true;
            if (t[1] == target[1]) ok1 = true;
            if (t[2] == target[2]) ok2 = true;
        }

        return ok0 && ok1 && ok2;
    }
}
```

```typescript solution
function mergeTriplets(triplets: number[][], target: number[]): boolean {
  let ok0 = false;
  let ok1 = false;
  let ok2 = false;

  for (const t of triplets) {
    if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) {
      continue;
    }
    if (t[0] === target[0]) ok0 = true;
    if (t[1] === target[1]) ok1 = true;
    if (t[2] === target[2]) ok2 = true;
  }

  return ok0 && ok1 && ok2;
}
```

### Karmaşıklık

- **Zaman:** O(n). `triplets` dizisindeki her üçlüye sabit sayıda karşılaştırma ile tam bir kez bakılır.
- **Alan:** O(1). Yalnızca üç adet mantıksal değişken kullanılır.

## Testler

```json
[
  { "args": [[[2, 5, 3], [1, 8, 4], [1, 7, 5]], [2, 7, 5]], "expected": true, "sample": true },
  { "args": [[[3, 4, 5], [4, 5, 6]], [3, 2, 5]], "expected": false, "sample": true },
  { "args": [[[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], [5, 5, 5]], "expected": true, "sample": true },
  { "args": [[[1, 1, 1]], [1, 1, 1]], "expected": true },
  { "args": [[[1, 2, 3], [2, 3, 4]], [2, 2, 3]], "expected": false },
  { "args": [[[3, 1, 1], [1, 4, 1], [1, 1, 5]], [3, 4, 5]], "expected": true },
  { "args": [[[3, 5, 1], [1, 4, 1], [1, 1, 5]], [3, 4, 5]], "expected": false }
]
```
