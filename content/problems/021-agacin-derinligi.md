---
title: Ağacın En Büyük Derinliği
difficulty: easy
tags: [agac, dfs, ozyineleme]
function: maxDepth
params:
  - { name: root, type: "TreeNode" }
returns: "int"
---
Bir ikili ağacın kökü `root` veriliyor. Ağacın **en büyük derinliğini** döndürün.

En büyük derinlik, kökten en uzaktaki yaprağa giden yol üzerindeki **düğüm sayısıdır**. Boş ağacın derinliği `0`'dır.

Ağaçlar seviye sırasıyla dizi olarak verilir; `null` olmayan çocuğu gösterir.

### Örnek 1

```text
Girdi:  root = [3, 9, 20, null, null, 15, 7]
Çıktı:  3

        3
       / \
      9  20
         / \
        15  7
```

### Örnek 2

```text
Girdi:  root = [1, null, 2]
Çıktı:  2
```

### Kısıtlar

- Düğüm sayısı `[0, 10^4]` aralığındadır.

## İpuçları

- Bir ağacın derinliği, alt ağaçlarının derinlikleri cinsinden yazılabilir mi?
- Boş ağaç için yanıt nedir? Bu, özyinelemenin temel durumudur.

## Çözüm

Bir ağacın derinliği, kökün kendisi (1) artı **daha derin olan** alt ağacın derinliğidir. Bu tanım doğrudan özyinelemeye çevrilir; boş alt ağacın derinliği `0`'dır.

```csharp solution
public class Solution
{
    public int MaxDepth(TreeNode root)
    {
        if (root == null) return 0;

        return 1 + Math.Max(MaxDepth(root.left), MaxDepth(root.right));
    }
}
```

```typescript solution
function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0;

  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### Karmaşıklık

- **Zaman:** O(n). Her düğüm bir kez ziyaret edilir.
- **Alan:** O(h); `h` ağacın yüksekliğidir (çağrı yığını). Dengeli ağaçta O(log n), tek dala dönüşmüş ağaçta O(n).

**Alternatif:** Genişlik öncelikli arama (BFS) ile katmanları sayabilirsiniz. Alanı en geniş katmanın boyutu kadardır ve çok derin ağaçlarda çağrı yığını taşması riski taşımaz.

## Testler

```json
[
  { "args": [[3, 9, 20, null, null, 15, 7]], "expected": 3, "sample": true },
  { "args": [[1, null, 2]], "expected": 2, "sample": true },
  { "args": [[]], "expected": 0, "sample": true },
  { "args": [[0]], "expected": 1 },
  { "args": [[1, 2, 3, 4, 5]], "expected": 3 },
  { "args": [[1, 2, null, 3, null, 4, null, 5]], "expected": 5 },
  { "args": [[1, 2, 3, 4, null, null, 5]], "expected": 3 }
]
```
