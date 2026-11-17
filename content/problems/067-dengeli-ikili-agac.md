---
title: Dengeli İkili Ağaç
difficulty: easy
tags: [agac, dfs, ozyineleme]
function: isBalanced
params:
  - { name: root, type: "TreeNode" }
returns: "bool"
---
Bir ikili ağacın kökü `root` veriliyor. Ağacın **yüksekliğe göre dengeli** olup olmadığını belirleyin.

Yüksekliğe göre dengeli bir ağaçta **her düğümün** sol ve sağ alt ağaçlarının yükseklikleri arasındaki fark en fazla `1`'dir.

### Örnek 1

```text
Girdi:  root = [3, 9, 20, null, null, 15, 7]
Çıktı:  true
```

### Örnek 2

```text
Girdi:  root = [1, 2, 2, 3, 3, null, null, 4, 4]
Çıktı:  false
Açıklama: Kökün sol alt ağacının yüksekliği 3, sağınınki 1.
```

### Örnek 3

```text
Girdi:  root = []
Çıktı:  true
```

### Kısıtlar

- Düğüm sayısı `[0, 5000]` aralığındadır.
- `-10^4 <= Node.val <= 10^4`

## İpuçları

- Yalnızca kökü kontrol etmek yetmez: koşul her düğümde sağlanmalı.
- Her düğümde yüksekliği ayrı ayrı hesaplamak O(n²) sürer. Yüksekliği aşağıdan yukarı tek geçişte hesaplayabilir misiniz?
- DFS yüksekliği döndürsün; bir alt ağaç dengesizse yükseklik yerine `-1` gibi özel bir değer döndürüp hemen yukarı iletin.

## Çözüm

### Aşağıdan yukarı tek geçiş

`Check(node)` fonksiyonu alt ağaç dengeliyse yüksekliğini, değilse `-1` döndürür:

- Boş düğümün yüksekliği `0`'dır.
- Sol ya da sağ çocuk `-1` döndürürse dengesizlik zaten bulunmuştur; `-1` hemen yukarı iletilir.
- İki yüksekliğin farkı `1`'den büyükse bu düğüm dengesizdir: `-1`.
- Aksi halde yükseklik `1 + max(sol, sağ)` olur.

Kökte `-1` dönmüyorsa ağaç dengelidir.

```csharp solution
public class Solution
{
    public bool IsBalanced(TreeNode root)
    {
        return Check(root) != -1;
    }

    private static int Check(TreeNode node)
    {
        if (node == null)
        {
            return 0;
        }

        var left = Check(node.left);
        if (left == -1)
        {
            return -1;
        }

        var right = Check(node.right);
        if (right == -1 || Math.Abs(left - right) > 1)
        {
            return -1;
        }

        return 1 + Math.Max(left, right);
    }
}
```

```typescript solution
function isBalanced(root: TreeNode | null): boolean {
  const check = (node: TreeNode | null): number => {
    if (node === null) {
      return 0;
    }

    const left = check(node.left);
    if (left === -1) {
      return -1;
    }

    const right = check(node.right);
    if (right === -1 || Math.abs(left - right) > 1) {
      return -1;
    }

    return 1 + Math.max(left, right);
  };

  return check(root) !== -1;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her düğüm bir kez ziyaret edilir.
- **Alan:** O(h) özyineleme yığını.

## Testler

```json
[
  { "args": [[3, 9, 20, null, null, 15, 7]], "expected": true, "sample": true },
  { "args": [[1, 2, 2, 3, 3, null, null, 4, 4]], "expected": false, "sample": true },
  { "args": [[]], "expected": true, "sample": true },
  { "args": [[1]], "expected": true },
  { "args": [[1, 2, null, 3]], "expected": false },
  { "args": [[1, 2, 3, 4, null, null, 5]], "expected": true },
  { "args": [[1, 2, 2, 3, null, null, 3, 4, null, null, 4]], "expected": false }
]
```
