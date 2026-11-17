---
title: İkili Ağacın Çapı
difficulty: easy
tags: [agac, dfs, ozyineleme]
function: diameterOfBinaryTree
params:
  - { name: root, type: "TreeNode" }
returns: "int"
---
Bir ikili ağacın kökü `root` veriliyor. Ağacın **çapını** döndürün.

Çap, ağaçtaki herhangi iki düğüm arasındaki **en uzun yolun kenar sayısıdır**. Bu yol köke uğramak zorunda değildir.

### Örnek 1

```text
Girdi:  root = [1, 2, 3, 4, 5]
Çıktı:  3
Açıklama: En uzun yol [4, 2, 1, 3] ya da [5, 2, 1, 3]; 3 kenar.
```

### Örnek 2

```text
Girdi:  root = [1, 2]
Çıktı:  1
```

### Kısıtlar

- Düğüm sayısı `[1, 10^4]` aralığındadır.
- `-100 <= Node.val <= 100`

## İpuçları

- En uzun yolun "en yüksek" düğümünü düşünün. Yol bu düğümün iki alt ağacına iniyorsa uzunluğu ne olur?
- Her düğümden geçen en uzun yol `solYükseklik + sağYükseklik` olur. Bütün düğümler için bunun en büyüğü cevaptır.
- Tek bir DFS hem yüksekliği döndürsün hem de geçerken en iyi çapı güncellesin.

## Çözüm

### Yüksekliği döndüren DFS

Bir düğümün **yüksekliği** (aşağıya doğru en uzun yolun düğüm sayısı) `1 + max(sol, sağ)` olur; boş ağacın yüksekliği `0`'dır. Bir düğümü "tepe noktası" kabul eden en uzun yol, sol alt ağaçta en derine inip sağ alt ağaçta en derine çıkar: kenar sayısı `sol + sağ`.

DFS her düğümde iki çocuğun yüksekliğini öğrenir, `best = max(best, sol + sağ)` ile çapı günceller ve üst düğüme kendi yüksekliğini döndürür. Böylece her düğüm bir kez işlenir.

```csharp solution
public class Solution
{
    private int best;

    public int DiameterOfBinaryTree(TreeNode root)
    {
        best = 0;
        Height(root);
        return best;
    }

    private int Height(TreeNode node)
    {
        if (node == null)
        {
            return 0;
        }

        var left = Height(node.left);
        var right = Height(node.right);
        best = Math.Max(best, left + right);
        return 1 + Math.Max(left, right);
    }
}
```

```typescript solution
function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;

  const height = (node: TreeNode | null): number => {
    if (node === null) {
      return 0;
    }

    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };

  height(root);
  return best;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(h) özyineleme yığını.

Her düğümde yüksekliği ayrı bir fonksiyonla yeniden hesaplamak O(n²)'ye çıkar. "Alt ağaçtan yukarı bir değer döndür, yanda global bir en iyiyi güncelle" kalıbı, maksimum yol toplamı gibi zor problemlerde de aynen kullanılır.

## Testler

```json
[
  { "args": [[1, 2, 3, 4, 5]], "expected": 3, "sample": true },
  { "args": [[1, 2]], "expected": 1, "sample": true },
  { "args": [[1]], "expected": 0 },
  { "args": [[1, 2, null, 3, null, 4]], "expected": 3 },
  { "args": [[1, 2, null, 3, 4, 5, null, null, 6, 7, null, null, 8]], "expected": 6 },
  { "args": [[1, 2, 3, 4, 5, 6, 7]], "expected": 4 }
]
```
