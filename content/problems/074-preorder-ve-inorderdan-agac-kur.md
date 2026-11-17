---
title: Preorder ve Inorder Dizilerinden Ağaç Kur
difficulty: medium
tags: [agac, dizi, hash-tablosu, ozyineleme]
function: buildTree
params:
  - { name: preorder, type: "int[]" }
  - { name: inorder, type: "int[]" }
returns: "TreeNode"
---
Bir ikili ağacın **preorder** (kök, sol, sağ) ve **inorder** (sol, kök, sağ) dolaşım dizileri `preorder` ve `inorder` veriliyor. Ağacı kurup kökünü döndürün.

Ağaçtaki bütün değerler birbirinden farklıdır.

### Örnek 1

```text
Girdi:  preorder = [3, 9, 20, 15, 7], inorder = [9, 3, 15, 20, 7]
Çıktı:  [3, 9, 20, null, null, 15, 7]
```

### Örnek 2

```text
Girdi:  preorder = [-1], inorder = [-1]
Çıktı:  [-1]
```

### Kısıtlar

- `1 <= preorder.length <= 3000`
- `inorder.length == preorder.length`
- `-3000 <= preorder[i], inorder[i] <= 3000`
- Değerler birbirinden farklıdır ve iki dizi aynı ağaca aittir.

## İpuçları

- Preorder dizisinin ilk elemanı her zaman köktür.
- Kökün inorder dizisindeki konumu, solunda kalanların sol alt ağacı, sağında kalanların sağ alt ağacı oluşturduğunu söyler.
- Kökün inorder konumunu her seferinde aramak yerine `değer → indeks` hash tablosu kullanın; preorder'ı da tek bir artan indeksle tüketin.

## Çözüm

### Özyinelemeli bölme

Preorder'da kökler sırayla gelir: önce ağacın kökü, sonra sol alt ağacın bütün preorder'ı, sonra sağınki. Bu yüzden preorder'ı soldan sağa tek bir `preIndex` ile tüketiriz.

`Build(lo, hi)`, inorder dizisinin `[lo, hi]` aralığındaki değerlerden alt ağaç kurar:

1. Aralık boşsa (`lo > hi`) `null` döner.
2. `preorder[preIndex++]` bu alt ağacın köküdür. Kökün inorder konumu `mid`, hash tablosundan O(1)'de bulunur.
3. Önce **sol** alt ağaç `[lo, mid - 1]` ile, sonra sağ alt ağaç `[mid + 1, hi]` ile kurulur. Sıra önemlidir: preorder önce sol alt ağacın köklerini verir.

```csharp solution
public class Solution
{
    private int[] preorder;
    private Dictionary<int, int> inorderIndex;
    private int preIndex;

    public TreeNode BuildTree(int[] preorder, int[] inorder)
    {
        this.preorder = preorder;
        preIndex = 0;
        inorderIndex = new Dictionary<int, int>();
        for (var i = 0; i < inorder.Length; i++)
        {
            inorderIndex[inorder[i]] = i;
        }

        return Build(0, inorder.Length - 1);
    }

    private TreeNode Build(int lo, int hi)
    {
        if (lo > hi)
        {
            return null;
        }

        var root = new TreeNode(preorder[preIndex++]);
        var mid = inorderIndex[root.val];
        root.left = Build(lo, mid - 1);
        root.right = Build(mid + 1, hi);
        return root;
    }
}
```

```typescript solution
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  const inorderIndex = new Map<number, number>();
  inorder.forEach((value, i) => inorderIndex.set(value, i));
  let preIndex = 0;

  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) {
      return null;
    }

    const root = new TreeNode(preorder[preIndex++]);
    const mid = inorderIndex.get(root.val)!;
    root.left = build(lo, mid - 1);
    root.right = build(mid + 1, hi);
    return root;
  };

  return build(0, inorder.length - 1);
}
```

### Karmaşıklık

- **Zaman:** O(n). Her düğüm bir kez oluşturulur; kök konumu hash tablosundan sabit zamanda bulunur.
- **Alan:** O(n). Hash tablosu ve en kötü durumda O(n) derinliğinde özyineleme.

## Testler

```json
[
  { "args": [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], "expected": [3, 9, 20, null, null, 15, 7], "sample": true },
  { "args": [[-1], [-1]], "expected": [-1], "sample": true },
  { "args": [[1, 2], [2, 1]], "expected": [1, 2] },
  { "args": [[1, 2], [1, 2]], "expected": [1, null, 2] },
  { "args": [[1, 2, 4, 5, 3, 6, 7], [4, 2, 5, 1, 6, 3, 7]], "expected": [1, 2, 3, 4, 5, 6, 7] },
  { "args": [[3, 1, 2, 4], [1, 2, 3, 4]], "expected": [3, 1, 4, null, 2] }
]
```
