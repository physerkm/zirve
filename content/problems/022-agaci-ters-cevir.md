---
title: Ağacı Ters Çevir
difficulty: easy
tags: [agac, dfs, bfs, ozyineleme]
function: invertTree
params:
  - { name: root, type: "TreeNode" }
returns: "TreeNode"
---
Bir ikili ağacın kökü `root` veriliyor. Ağacı **ayna görüntüsüne** çevirin (her düğümün sol ve sağ çocuklarını yer değiştirin) ve kökü döndürün.

### Örnek 1

```text
Girdi:  root = [4, 2, 7, 1, 3, 6, 9]
Çıktı:  [4, 7, 2, 9, 6, 3, 1]
```

### Örnek 2

```text
Girdi:  root = [2, 1, 3]
Çıktı:  [2, 3, 1]
```

### Örnek 3

```text
Girdi:  root = []
Çıktı:  []
```

### Kısıtlar

- Düğüm sayısı `[0, 100]` aralığındadır.
- `-100 <= Node.val <= 100`

## İpuçları

- Ayna görüntüsü, **her** düğümde sol ve sağ çocuğun yer değiştirmesidir.
- Kökte çocukları değiştirip aynı işi iki alt ağaca da uygularsanız ne olur?
- Özyineleme yerine bir kuyrukla (BFS) ya da yığınla da bütün düğümleri gezebilirsiniz.

## Çözüm

### Özyinelemeli takas

Boş ağaç zaten kendi aynasıdır. Değilse kökün sol ve sağ çocuğunu yer değiştirir, sonra aynı işlemi iki alt ağaca uygularız. Takasın alt ağaçlardan önce ya da sonra yapılması fark etmez; önemli olan her düğümün bir kez takas edilmesidir.

```csharp solution
public class Solution
{
    public TreeNode InvertTree(TreeNode root)
    {
        if (root == null)
        {
            return null;
        }

        (root.left, root.right) = (root.right, root.left);
        InvertTree(root.left);
        InvertTree(root.right);
        return root;
    }
}
```

```typescript solution
function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) {
    return null;
  }

  [root.left, root.right] = [root.right, root.left];
  invertTree(root.left);
  invertTree(root.right);
  return root;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her düğüm bir kez ziyaret edilir.
- **Alan:** O(h). Özyineleme yığını ağacın yüksekliği kadar derinleşir; dengesiz ağaçta O(n) olabilir.

## Testler

```json
[
  { "args": [[4, 2, 7, 1, 3, 6, 9]], "expected": [4, 7, 2, 9, 6, 3, 1], "sample": true },
  { "args": [[2, 1, 3]], "expected": [2, 3, 1], "sample": true },
  { "args": [[]], "expected": [], "sample": true },
  { "args": [[1]], "expected": [1] },
  { "args": [[1, 2]], "expected": [1, null, 2] },
  { "args": [[1, null, 2]], "expected": [1, 2] },
  { "args": [[1, 2, 3, 4, null, null, 5]], "expected": [1, 3, 2, 5, null, null, 4] }
]
```
