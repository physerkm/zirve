---
title: Ağaçtaki İyi Düğümleri Say
difficulty: medium
tags: [agac, dfs, bfs]
function: goodNodes
params:
  - { name: root, type: "TreeNode" }
returns: "int"
---
Bir ikili ağacın kökü `root` veriliyor. Kökten bir `X` düğümüne giden yol üzerinde **`X`'ten büyük değerli hiçbir düğüm yoksa**, `X` bir **iyi düğümdür**.

Ağaçtaki iyi düğümlerin sayısını döndürün.

### Örnek 1

```text
Girdi:  root = [3, 1, 4, 3, null, 1, 5]
Çıktı:  4
Açıklama: Kök (3) her zaman iyidir. 4 (yol 3→4), 5 (yol 3→4→5) ve sol alttaki 3 (yol 3→1→3) iyidir.
Sağdaki 1 (yol 3→4→1) iyi değildir.
```

### Örnek 2

```text
Girdi:  root = [3, 3, null, 4, 2]
Çıktı:  3
Açıklama: 2 iyi değildir çünkü yolundaki 3 ondan büyüktür.
```

### Kısıtlar

- Düğüm sayısı `[1, 10^5]` aralığındadır.
- `-10^4 <= Node.val <= 10^4`

## İpuçları

- Bir düğümün iyi olup olmadığını anlamak için yolun tamamına değil, yalnızca yoldaki **en büyük** değere ihtiyacınız var.
- DFS ile aşağı inerken o ana kadarki maksimumu parametre olarak taşıyın.

## Çözüm

### Maksimumu taşıyan DFS

`Dfs(node, maxSoFar)`, kökten `node`'a gelene kadar görülen en büyük değeri bilir:

- `node.val >= maxSoFar` ise düğüm iyidir (eşitlik de sayılır: yolda **daha büyük** değer yok).
- Çocuklara inerken maksimum `max(maxSoFar, node.val)` olarak güncellenir.

Kök için başlangıç maksimumu kökün kendi değeridir; böylece kök her zaman iyi sayılır.

```csharp solution
public class Solution
{
    public int GoodNodes(TreeNode root)
    {
        return Dfs(root, root.val);
    }

    private static int Dfs(TreeNode node, int maxSoFar)
    {
        if (node == null)
        {
            return 0;
        }

        var good = node.val >= maxSoFar ? 1 : 0;
        var next = Math.Max(maxSoFar, node.val);
        return good + Dfs(node.left, next) + Dfs(node.right, next);
    }
}
```

```typescript solution
function goodNodes(root: TreeNode | null): number {
  const dfs = (node: TreeNode | null, maxSoFar: number): number => {
    if (node === null) {
      return 0;
    }

    const good = node.val >= maxSoFar ? 1 : 0;
    const next = Math.max(maxSoFar, node.val);
    return good + dfs(node.left, next) + dfs(node.right, next);
  };

  return root === null ? 0 : dfs(root, root.val);
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(h) özyineleme yığını.

"Kökten gelen bilgiyi parametreyle aşağı taşımak", geçerli ikili arama ağacı kontrolünde kullanılan sınır aktarımıyla aynı kalıptır.

## Testler

```json
[
  { "args": [[3, 1, 4, 3, null, 1, 5]], "expected": 4, "sample": true },
  { "args": [[3, 3, null, 4, 2]], "expected": 3, "sample": true },
  { "args": [[1]], "expected": 1 },
  { "args": [[2, null, 4, 10, 8, null, null, 4]], "expected": 4 },
  { "args": [[9, null, 3, 6]], "expected": 1 },
  { "args": [[-1, -2, -3]], "expected": 1 }
]
```
