---
title: Ağacın Sağdan Görünümü
difficulty: medium
tags: [agac, bfs, dfs, kuyruk]
function: rightSideView
params:
  - { name: root, type: "TreeNode" }
returns: "List<int>"
---
Bir ikili ağacın kökü `root` veriliyor. Ağacın **sağ tarafında durduğunuzu** düşünün. Yukarıdan aşağıya doğru görebildiğiniz düğümlerin değerlerini döndürün.

### Örnek 1

```text
Girdi:  root = [1, 2, 3, null, 5, null, 4]
Çıktı:  [1, 3, 4]
```

### Örnek 2

```text
Girdi:  root = [1, 2, 3, 4]
Çıktı:  [1, 3, 4]
Açıklama: 3. seviyede yalnızca 4 vardır; sol tarafta olsa da sağdan görünür.
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

- Sağdan görünen düğüm, her seviyenin **en sağdaki** düğümüdür; her zaman en sağ dalda değildir.
- Ağacı seviye seviye dolaşın (BFS). Her seviyenin son düğümü cevaba girer.
- DFS ile de olur: önce sağ çocuğa inin; bir derinliğe ilk kez ulaştığınızda gördüğünüz düğüm o seviyenin en sağıdır.

## Çözüm

### Seviye sıralı dolaşma

Kuyruğa kökü koyarız. Her turda kuyruğun **o anki boyutu** kadar düğüm çıkarırız; bunlar tam olarak bir seviyeyi oluşturur. Seviyenin son çıkarılan düğümü sağdan görünen düğümdür. Çıkarılan her düğümün çocukları (önce sol, sonra sağ) bir sonraki seviye için kuyruğa eklenir.

```csharp solution
public class Solution
{
    public IList<int> RightSideView(TreeNode root)
    {
        var view = new List<int>();
        if (root == null)
        {
            return view;
        }

        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);

        while (queue.Count > 0)
        {
            var levelSize = queue.Count;
            for (var i = 0; i < levelSize; i++)
            {
                var node = queue.Dequeue();
                if (i == levelSize - 1)
                {
                    view.Add(node.val);
                }

                if (node.left != null) queue.Enqueue(node.left);
                if (node.right != null) queue.Enqueue(node.right);
            }
        }

        return view;
    }
}
```

```typescript solution
function rightSideView(root: TreeNode | null): number[] {
  const view: number[] = [];
  if (root === null) {
    return view;
  }

  let level: TreeNode[] = [root];
  while (level.length > 0) {
    view.push(level[level.length - 1].val);

    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left !== null) next.push(node.left);
      if (node.right !== null) next.push(node.right);
    }

    level = next;
  }

  return view;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(w). `w`, ağacın en geniş seviyesindeki düğüm sayısıdır.

## Testler

```json
[
  { "args": [[1, 2, 3, null, 5, null, 4]], "expected": [1, 3, 4], "sample": true },
  { "args": [[1, 2, 3, 4]], "expected": [1, 3, 4], "sample": true },
  { "args": [[]], "expected": [], "sample": true },
  { "args": [[1, null, 3]], "expected": [1, 3] },
  { "args": [[1, 2]], "expected": [1, 2] },
  { "args": [[1, 2, 3, 4, 5, 6, 7, null, null, null, null, null, null, 8]], "expected": [1, 3, 7, 8] }
]
```
