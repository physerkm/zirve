---
title: Geçerli İkili Arama Ağacı
difficulty: medium
tags: [agac, ikili-arama-agaci, dfs]
function: isValidBST
params:
  - { name: root, type: "TreeNode" }
returns: "bool"
---
Bir ikili ağacın kökü `root` veriliyor. Ağacın **geçerli bir ikili arama ağacı** (BST) olup olmadığını döndürün.

Geçerli bir BST'de her düğüm için:

- Sol alt ağaçtaki **bütün** değerler düğümün değerinden **küçüktür**.
- Sağ alt ağaçtaki **bütün** değerler düğümün değerinden **büyüktür**.
- Sol ve sağ alt ağaçların kendileri de geçerli BST'dir.

### Örnek 1

```text
Girdi:  root = [2, 1, 3]
Çıktı:  true
```

### Örnek 2

```text
Girdi:  root = [5, 1, 4, null, null, 3, 6]
Çıktı:  false
Açıklama: Kökün sağ çocuğu 4'tür; 5'ten küçük olduğu için kural bozulur.
```

### Kısıtlar

- Düğüm sayısı `[1, 10^4]` aralığındadır.
- `-2^31 <= Node.val <= 2^31 - 1`

## İpuçları

- Her düğümü yalnızca kendi çocuklarıyla karşılaştırmak **yetmez**. `[5, 4, 6, null, null, 3, 7]` ağacını düşünün: 3, 6'nın sol çocuğu olarak yerel kuralı sağlar ama kökün (5) sağ alt ağacında olduğu için geçersizdir.
- Her düğümün uyması gereken bir **alt ve üst sınır** vardır. Aşağı inerken bu sınırları daraltın.
- Alternatif: geçerli bir BST'nin ortada-kök (inorder) dolaşması kesin artan bir sıra verir.

## Çözüm

Her düğüme izin verilen bir değer aralığı `(low, high)` taşırız. Kök için aralık sınırsızdır. Sola inerken üst sınır düğümün değeri olur (sol alt ağaçtaki her şey ondan küçük olmalı); sağa inerken alt sınır düğümün değeri olur.

Düğüm değerleri `int` sınırlarına eşit olabildiği için sınırları `long` tutarız; aksi halde `int.MinValue` değerindeki geçerli bir düğüm, başlangıç sınırına eşit olduğu için yanlışlıkla reddedilir.

```csharp solution
public class Solution
{
    public bool IsValidBST(TreeNode root)
    {
        return IsValid(root, long.MinValue, long.MaxValue);
    }

    private bool IsValid(TreeNode node, long low, long high)
    {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;

        return IsValid(node.left, low, node.val) && IsValid(node.right, node.val, high);
    }
}
```

```typescript solution
function isValidBST(root: TreeNode | null): boolean {
  const isValid = (node: TreeNode | null, low: number, high: number): boolean => {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;

    return isValid(node.left, low, node.val) && isValid(node.right, node.val, high);
  };

  return isValid(root, -Infinity, Infinity);
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(h); `h` ağacın yüksekliğidir.

Eşit değerlere dikkat edin: tanım **kesin** küçük ve büyük ister, bu yüzden karşılaştırmalar `<=` ve `>=` ile yapılır. `[1, 1]` geçerli bir BST değildir.

## Testler

```json
[
  { "args": [[2, 1, 3]], "expected": true, "sample": true },
  { "args": [[5, 1, 4, null, null, 3, 6]], "expected": false, "sample": true },
  { "args": [[1]], "expected": true },
  { "args": [[1, 1]], "expected": false },
  { "args": [[5, 4, 6, null, null, 3, 7]], "expected": false },
  { "args": [[2147483647]], "expected": true },
  { "args": [[-2147483648, null, 2147483647]], "expected": true },
  { "args": [[10, 5, 15, 3, 7, 12, 20]], "expected": true },
  { "args": [[10, 5, 15, 3, 11, 12, 20]], "expected": false },
  { "args": [[3, 2, null, 1]], "expected": true }
]
```
