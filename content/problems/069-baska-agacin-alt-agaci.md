---
title: Başka Bir Ağacın Alt Ağacı
difficulty: easy
tags: [agac, dfs, ozyineleme]
function: isSubtree
params:
  - { name: root, type: "TreeNode" }
  - { name: subRoot, type: "TreeNode" }
returns: "bool"
---
İki ikili ağacın kökleri `root` ve `subRoot` veriliyor. `root` ağacının içinde, `subRoot` ile **aynı yapıya ve aynı düğüm değerlerine** sahip bir alt ağaç bulunup bulunmadığını döndürün.

Bir ağacın `node` düğümünden başlayan **alt ağacı**, `node` düğümünü ve onun soyundan gelen **tüm** düğümleri içerir. Yani `root` içindeki eşleşen kısmın altında fazladan yaprak veya dal kalmamalıdır; ağacın kendisi de kendi alt ağacı sayılır.

### Örnek 1

```text
Girdi:  root = [3, 4, 5, 1, 2], subRoot = [4, 1, 2]
Çıktı:  true
Açıklama: root içindeki 4 düğümü ve onun tüm alt soyu [4, 1, 2], subRoot ile birebir aynıdır.
```

### Örnek 2

```text
Girdi:  root = [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot = [4, 1, 2]
Çıktı:  false
Açıklama: root içindeki 4 düğümünün alt ağacında 2'nin sol çocuğu olarak 0 vardır; subRoot'ta ise 2 yapraktır.
```

### Örnek 3

```text
Girdi:  root = [1, 1], subRoot = [1]
Çıktı:  true
Açıklama: Kök olan 1 düğümünün sol çocuğu vardır ama sol yapraktaki 1 düğümü subRoot ile birebir eşleşir.
```

### Kısıtlar

- `root` ağacındaki düğüm sayısı `[1, 2000]` aralığındadır.
- `subRoot` ağacındaki düğüm sayısı `[1, 1000]` aralığındadır.
- `-10^4 <= root.val <= 10^4`
- `-10^4 <= subRoot.val <= 10^4`

## İpuçları

- Önce daha basit bir soruyu çözün: iki ağacın **birebir aynı** olup olmadığını (`IsSameTree`) özyinelemeyle nasıl kontrol edersiniz?
- İki ağacın aynı olması için kök değerleri eşit olmalı, sol alt ağaçları aynı olmalı ve sağ alt ağaçları aynı olmalıdır.
- Şimdi `root` ağacındaki her düğümü potansiyel bir başlangıç noktası olarak düşünün: ya mevcut düğümden başlayan alt ağaç `subRoot` ile aynıdır ya da aradığımız alt ağaç sol veya sağ dalda gizlidir.
- Yalnızca değer eşitliğine bakıp durmayın; `[1, 1]` içinde `[1]` ararken kökteki `1` eşleşmez ama onun sol çocuğundaki `1` eşleşir.

## Çözüm

Problemi iki net parçaya ayırırız:

1. **`IsSameTree(a, b)`:** Verilen iki kök düğümden başlayan ağaçların yapıca ve değerce birebir aynı olup olmadığını denetler. İkisi de `null` ise `true`, yalnız biri `null` ise veya değerleri farklıysa `false` döner; aksi halde sol çocukları ve sağ çocukları karşılıklı karşılaştırır.
2. **`IsSubtree(root, subRoot)`:** Ana ağacı gezer. Her düğümde önce `IsSameTree(root, subRoot)` çağrısıyla "aradığımız alt ağaç tam buradan mı başlıyor?" diye bakar. Eşleşme varsa `true` döner; yoksa aramayı `root.left` ve `root.right` alt ağaçlarında sürdürür.

Bu yaklaşım aynı değere sahip birden fazla düğüm bulunduğunda da (örneğin `root = [1, 1]`, `subRoot = [1]`) ilk başarısız denemeden sonra alt dalları kontrol etmeye devam ettiği için hiçbir olası eşleşmeyi kaçırmaz.

```csharp solution
public class Solution
{
    public bool IsSubtree(TreeNode root, TreeNode subRoot)
    {
        if (subRoot == null) return true;
        if (root == null) return false;

        // Mevcut düğümden başlayan alt ağaç subRoot ile birebir aynı mı?
        if (IsSameTree(root, subRoot))
            return true;

        // Değilse sol veya sağ alt ağaçta aramaya devam et.
        return IsSubtree(root.left, subRoot) || IsSubtree(root.right, subRoot);
    }

    private bool IsSameTree(TreeNode a, TreeNode b)
    {
        if (a == null && b == null) return true;
        if (a == null || b == null || a.val != b.val) return false;

        return IsSameTree(a.left, b.left) && IsSameTree(a.right, b.right);
    }
}
```

```typescript solution
function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
  if (subRoot === null) return true;
  if (root === null) return false;

  if (isSameTree(root, subRoot)) return true;

  return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}

function isSameTree(a: TreeNode | null, b: TreeNode | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null || a.val !== b.val) return false;

  return isSameTree(a.left, b.left) && isSameTree(a.right, b.right);
}
```

### Karmaşıklık

- **Zaman:** O(n · m). `n` ana ağaçtaki, `m` ise `subRoot` ağacındaki düğüm sayısıdır. En kötü durumda her düğümde `O(m)` süren `IsSameTree` kontrolü yapılır.
- **Alan:** O(h_n + h_m). Özyineleme çağrı yığınının derinliği ana ağacın yüksekliği ile alt ağacın yüksekliğinin toplamı kadardır; en kötü durumda O(n + m).

## Testler

```json
[
  { "args": [[3, 4, 5, 1, 2], [4, 1, 2]], "expected": true, "sample": true },
  { "args": [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], "expected": false, "sample": true },
  { "args": [[1, 1], [1]], "expected": true, "sample": true },
  { "args": [[1], [1]], "expected": true },
  { "args": [[1, 2, 3], [2, 3]], "expected": false },
  { "args": [[1, null, 1, null, 1, null, 1, 2], [1, null, 1, 2]], "expected": true },
  { "args": [[4, 2, 6, 1, 3, 5, 7], [6, 5, 7]], "expected": true },
  { "args": [[4, 2, 6, 1, 3, 5, 7], [6, 5]], "expected": false }
]
```
