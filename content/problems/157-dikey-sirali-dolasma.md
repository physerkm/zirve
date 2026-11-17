---
title: İkili Ağacı Dikey Sırayla Dolaş
difficulty: medium
tags: [agac, bfs, hash-tablosu, kuyruk]
function: verticalOrder
params:
  - { name: root, type: "TreeNode" }
returns: "List<List<int>>"
---
Bir ikili ağacın kökü `root` veriliyor. Düğüm değerlerini **dikey sırayla** döndürün: sütun sütun, soldan sağa; her sütunun içinde yukarıdan aşağıya.

Kökün sütunu `0`'dır; sol çocuğun sütunu ebeveyninden bir eksik, sağ çocuğunki bir fazladır. Aynı satır ve sütundaki iki düğüm **soldan sağa** sırayla yazılır.

### Örnek 1

```text
Girdi:  root = [3, 9, 20, null, null, 15, 7]
Çıktı:  [[9], [3, 15], [20], [7]]
```

### Örnek 2

```text
Girdi:  root = [3, 9, 8, 4, 0, 1, 7]
Çıktı:  [[4], [9], [3, 0, 1], [8], [7]]
Açıklama: 0 ve 1 aynı satır ve sütunda; 0 solda olduğu için önce gelir.
```

### Örnek 3

```text
Girdi:  root = [3, 9, 8, 4, 0, 1, 7, null, null, null, 2, 5]
Çıktı:  [[4], [9, 5], [3, 0, 1], [8, 2], [7]]
```

### Kısıtlar

- Düğüm sayısı `[0, 100]` aralığındadır.
- `-100 <= Node.val <= 100`

## İpuçları

- Her düğümün sütununu ebeveyninden hesaplayabilirsiniz.
- "Yukarıdan aşağıya, aynı satırda soldan sağa" sırası tam olarak **BFS**'in düğümleri ziyaret ettiği sıradır.
- Sütun → değer listesi eşlemesi tutun ve en küçük ile en büyük sütunu takip edin; sonda sütunları sırayla çıktıya ekleyin.

## Çözüm

### Sütun bilgisiyle BFS

Kuyruğa `(düğüm, sütun)` çiftleri koyarız. BFS her düğümü seviye sırasıyla ve her seviyede soldan sağa ziyaret eder; düğümün değeri kendi sütununun listesine eklenir. Sol çocuk `sütun - 1`, sağ çocuk `sütun + 1` ile kuyruğa girer.

En küçük ve en büyük sütun takip edildiği için sonda sözlüğü sıralamaya gerek kalmaz: `minColumn`'dan `maxColumn`'a kadar listeler sırayla eklenir.

DFS ile yapılsaydı aynı sütundaki düğümlerin satır sırası bozulabilirdi; BFS bu sıralamayı bedavaya verir.

```csharp solution
public class Solution
{
    public IList<IList<int>> VerticalOrder(TreeNode root)
    {
        var result = new List<IList<int>>();
        if (root == null)
        {
            return result;
        }

        var columns = new Dictionary<int, List<int>>();
        var queue = new Queue<(TreeNode Node, int Column)>();
        queue.Enqueue((root, 0));
        var minColumn = 0;
        var maxColumn = 0;

        while (queue.Count > 0)
        {
            var (node, column) = queue.Dequeue();
            if (!columns.TryGetValue(column, out var list))
            {
                list = new List<int>();
                columns[column] = list;
            }

            list.Add(node.val);
            minColumn = Math.Min(minColumn, column);
            maxColumn = Math.Max(maxColumn, column);

            if (node.left != null) queue.Enqueue((node.left, column - 1));
            if (node.right != null) queue.Enqueue((node.right, column + 1));
        }

        for (var c = minColumn; c <= maxColumn; c++)
        {
            result.Add(columns[c]);
        }

        return result;
    }
}
```

```typescript solution
function verticalOrder(root: TreeNode | null): number[][] {
  if (root === null) return [];

  const columns = new Map<number, number[]>();
  const queue: [TreeNode, number][] = [[root, 0]];
  let minColumn = 0;
  let maxColumn = 0;

  for (let head = 0; head < queue.length; head++) {
    const [node, column] = queue[head];
    if (!columns.has(column)) columns.set(column, []);
    columns.get(column)!.push(node.val);
    minColumn = Math.min(minColumn, column);
    maxColumn = Math.max(maxColumn, column);

    if (node.left !== null) queue.push([node.left, column - 1]);
    if (node.right !== null) queue.push([node.right, column + 1]);
  }

  const result: number[][] = [];
  for (let c = minColumn; c <= maxColumn; c++) {
    result.push(columns.get(c)!);
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(n).

## Testler

```json
[
  { "args": [[3, 9, 20, null, null, 15, 7]], "expected": [[9], [3, 15], [20], [7]], "sample": true },
  { "args": [[3, 9, 8, 4, 0, 1, 7]], "expected": [[4], [9], [3, 0, 1], [8], [7]], "sample": true },
  { "args": [[3, 9, 8, 4, 0, 1, 7, null, null, null, 2, 5]], "expected": [[4], [9, 5], [3, 0, 1], [8, 2], [7]], "sample": true },
  { "args": [[]], "expected": [] },
  { "args": [[1]], "expected": [[1]] },
  { "args": [[1, 2, null, 3, null, 4]], "expected": [[4], [3], [2], [1]] }
]
```
