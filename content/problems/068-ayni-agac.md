---
title: Aynı Ağaç
difficulty: easy
tags: [agac, dfs, ozyineleme]
function: isSameTree
params:
  - { name: p, type: "TreeNode" }
  - { name: q, type: "TreeNode" }
returns: "bool"
---
İki ikili ağacın kökleri `p` ve `q` veriliyor. İki ağacın **aynı** olup olmadığını belirleyin.

İki ağaç, yapı olarak birebir aynıysa ve karşılıklı düğümlerin değerleri eşitse aynıdır.

### Örnek 1

```text
Girdi:  p = [1, 2, 3], q = [1, 2, 3]
Çıktı:  true
```

### Örnek 2

```text
Girdi:  p = [1, 2], q = [1, null, 2]
Çıktı:  false
```

### Örnek 3

```text
Girdi:  p = [1, 2, 1], q = [1, 1, 2]
Çıktı:  false
```

### Kısıtlar

- İki ağaçtaki düğüm sayısı da `[0, 100]` aralığındadır.
- `-10^4 <= Node.val <= 10^4`

## İpuçları

- İki boş ağaç aynıdır. Biri boş, öbürü dolu ise aynı değildir.
- İki kökün değeri eşitse, sol alt ağaçlar ve sağ alt ağaçlar da aynı olmalıdır.

## Çözüm

### Eşzamanlı DFS

İki ağacı aynı anda dolaşırız:

- İkisi de `null` ise bu dal eşleşir.
- Yalnızca biri `null` ise ya da değerler farklıysa ağaçlar farklıdır.
- Değilse sol çocuklar ve sağ çocuklar aynı fonksiyonla karşılaştırılır; ikisi de aynı olmalıdır.

`&&` operatörü kısa devre yaptığı için ilk farkta karşılaştırma durur.

```csharp solution
public class Solution
{
    public bool IsSameTree(TreeNode p, TreeNode q)
    {
        if (p == null && q == null)
        {
            return true;
        }

        if (p == null || q == null || p.val != q.val)
        {
            return false;
        }

        return IsSameTree(p.left, q.left) && IsSameTree(p.right, q.right);
    }
}
```

```typescript solution
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (p === null && q === null) {
    return true;
  }

  if (p === null || q === null || p.val !== q.val) {
    return false;
  }

  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

### Karmaşıklık

- **Zaman:** O(min(n, m)). İlk farkta durulur; en kötü durumda küçük ağacın bütün düğümleri gezilir.
- **Alan:** O(h) özyineleme yığını.

Bu karşılaştırma, "Başka Bir Ağacın Alt Ağacı" probleminin yapı taşıdır.

## Testler

```json
[
  { "args": [[1, 2, 3], [1, 2, 3]], "expected": true, "sample": true },
  { "args": [[1, 2], [1, null, 2]], "expected": false, "sample": true },
  { "args": [[1, 2, 1], [1, 1, 2]], "expected": false, "sample": true },
  { "args": [[], []], "expected": true },
  { "args": [[1], []], "expected": false },
  { "args": [[5, 4, null, 3], [5, 4, null, 3]], "expected": true },
  { "args": [[1, 2, 3, 4], [1, 2, 3, null, 4]], "expected": false }
]
```
