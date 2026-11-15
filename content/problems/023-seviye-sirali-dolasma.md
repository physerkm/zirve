---
title: Ağacı Seviye Seviye Dolaş
difficulty: medium
tags: [agac, bfs, kuyruk]
function: levelOrder
params:
  - { name: root, type: "TreeNode" }
returns: "List<List<int>>"
---
Bir ikili ağacın kökü `root` veriliyor. Düğümlerin değerlerini **seviye seviye**, her seviyede soldan sağa olacak biçimde döndürün. Her seviye ayrı bir liste olmalıdır.

### Örnek 1

```text
Girdi:  root = [3, 9, 20, null, null, 15, 7]
Çıktı:  [[3], [9, 20], [15, 7]]
```

### Örnek 2

```text
Girdi:  root = []
Çıktı:  []
```

### Kısıtlar

- Düğüm sayısı `[0, 2000]` aralığındadır.

## İpuçları

- "Seviye seviye" ifadesi genişlik öncelikli aramayı (BFS) işaret eder; kuyruk kullanın.
- Bir seviyenin nerede bittiğini nasıl anlarsınız? Seviyeyi işlemeye başlamadan önce kuyruğun **boyutunu** saklayın.

## Çözüm

Kökü bir kuyruğa koyarız. Her turda kuyruktaki düğüm sayısını (`size`) saklarız: bu, o seviyedeki düğüm sayısıdır. Tam o kadar düğümü kuyruktan çıkarır, değerlerini seviyenin listesine ekler ve çocuklarını kuyruğun sonuna koyarız. Tur bittiğinde kuyrukta yalnızca bir sonraki seviyenin düğümleri kalır.

```csharp solution
public class Solution
{
    public IList<IList<int>> LevelOrder(TreeNode root)
    {
        var levels = new List<IList<int>>();
        if (root == null) return levels;

        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);

        while (queue.Count > 0)
        {
            var size = queue.Count;
            var level = new List<int>(size);

            for (var i = 0; i < size; i++)
            {
                var node = queue.Dequeue();
                level.Add(node.val);

                if (node.left != null) queue.Enqueue(node.left);
                if (node.right != null) queue.Enqueue(node.right);
            }

            levels.Add(level);
        }

        return levels;
    }
}
```

```typescript solution
function levelOrder(root: TreeNode | null): number[][] {
  const levels: number[][] = [];
  if (root === null) return levels;

  let current: TreeNode[] = [root];

  while (current.length > 0) {
    const next: TreeNode[] = [];
    const level: number[] = [];

    for (const node of current) {
      level.push(node.val);
      if (node.left !== null) next.push(node.left);
      if (node.right !== null) next.push(node.right);
    }

    levels.push(level);
    current = next;
  }

  return levels;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(n); en geniş seviye kuyrukta tutulur (dolu bir ağaçta yaklaşık n/2 düğüm).

TypeScript çözümü kuyruk yerine "şimdiki seviye" ve "sonraki seviye" dizilerini kullanır. JavaScript'te `array.shift()` O(n) olduğu için bu biçim hem daha hızlı hem daha okunaklıdır.

Aynı iskelet pek çok soruyu çözer: ağacın sağdan görünümü (her seviyenin son elemanı), zikzak dolaşma (seviyeleri sırayla ters çevirme), seviye ortalamaları.

## Testler

```json
[
  { "args": [[3, 9, 20, null, null, 15, 7]], "expected": [[3], [9, 20], [15, 7]], "sample": true },
  { "args": [[1]], "expected": [[1]], "sample": true },
  { "args": [[]], "expected": [], "sample": true },
  { "args": [[1, 2, 3, 4, 5, 6, 7]], "expected": [[1], [2, 3], [4, 5, 6, 7]] },
  { "args": [[1, null, 2, null, 3]], "expected": [[1], [2], [3]] },
  { "args": [[1, 2, 3, 4, null, null, 5]], "expected": [[1], [2, 3], [4, 5]] }
]
```
