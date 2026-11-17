---
title: İkili Arama Ağacında En Yakın Ortak Ata
difficulty: medium
tags: [agac, ikili-arama-agaci]
function: lowestCommonAncestor
params:
  - { name: root, type: "TreeNode" }
  - { name: p, type: "int" }
  - { name: q, type: "int" }
returns: "int"
---
Tüm düğüm değerleri birbirinden farklı olan bir **ikili arama ağacının** (BST) kökü `root` ve ağaçta bulunduğu garanti edilen iki düğüm değeri `p` ile `q` veriliyor. Bu iki düğümün **en yakın ortak atasının** (Lowest Common Ancestor — LCA) değerini döndürün.

İki düğüm `p` ve `q` için **en yakın ortak ata**, hem `p`'yi hem de `q`'yu alt soyu olarak barındıran **en derin** düğümdür. Tanım gereği bir düğüm **kendi kendisinin de atası** sayılır; yani `p` düğümü `q`'nun üstündeyse en yakın ortak ata doğrudan `p` olur.

### Örnek 1

```text
Girdi:  root = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p = 2, q = 8
Çıktı:  6
Açıklama: 2 sol alt ağaçta, 8 sağ alt ağaçtadır; yolların ayrıldığı ilk düğüm 6'dır.
```

### Örnek 2

```text
Girdi:  root = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p = 2, q = 4
Çıktı:  2
Açıklama: 4 düğümü 2'nin sağ alt ağacındadır. Bir düğüm kendisinin de atası sayıldığı için ortak ata 2'dir.
```

### Örnek 3

```text
Girdi:  root = [2, 1], p = 2, q = 1
Çıktı:  2
```

### Kısıtlar

- Ağaçtaki düğüm sayısı `[2, 10^5]` aralığındadır.
- `-10^9 <= Node.val <= 10^9`
- Tüm `Node.val` değerleri **benzersizdir**.
- `p != q`
- `p` ve `q` değerlerine sahip düğümler ağaçta kesinlikle bulunur.

## İpuçları

- Sıradan bir ikili ağaçta her iki alt dalı da aramak gerekir; ancak bir **İkili Arama Ağacında (BST)** düğümün değerine bakarak `p` ve `q`'nun hangi tarafta olduğunu hemen anlayabilirsiniz.
- Kökten başlayın: eğer hem `p` hem `q` mevcut düğümün değerinden **küçükse**, aradığınız ortak ata yalnızca **sol** alt ağaçta olabilir.
- Eğer hem `p` hem `q` mevcut düğümün değerinden **büyükse**, ortak ata yalnızca **sağ** alt ağaçta olabilir.
- Peki biri küçük biri büyükse (ya da biri mevcut düğüme eşitse)? Yollar tam bu düğümde ayrılıyordur!

## Çözüm

İkili arama ağacının sıralama özelliği sayesinde ağacın tamamını gezmemize gerek yoktur. Kökten (`curr = root`) başlayıp aşağı doğru tek bir yol izleriz:

1. **`p < curr.val && q < curr.val`:** Her iki aranan değer de mevcut düğümden küçüktür. İkisi de sol alt ağaçta yer aldığı için ortak ataları da sol alt ağaçtadır (`curr = curr.left`).
2. **`p > curr.val && q > curr.val`:** Her iki değer de mevcut düğümden büyüktür. İkisi de sağ alt ağaçta yer aldığı için sağa ineriz (`curr = curr.right`).
3. **Aksi durum:** Ya `p` ve `q` mevcut düğümün iki farklı yakasına düşmüştür (`p < curr.val < q` veya tersi) ya da aranan değerlerden biri doğrudan `curr.val`'a eşittir. Her iki durumda da `curr`, iki düğümün yollarının ayrıldığı **ilk** (ve en derin) ortak atadır; `curr.val` değerini döndürürüz.

Özyineleme yerine basit bir `while` döngüsü kullandığımız için çağrı yığını (stack) kullanılmaz ve ek bellek maliyeti **O(1)** olur.

```csharp solution
public class Solution
{
    public int LowestCommonAncestor(TreeNode root, int p, int q)
    {
        TreeNode curr = root;

        while (curr != null)
        {
            // İkisi de küçükse ortak ata sol alt ağaçtadır.
            if (p < curr.val && q < curr.val)
            {
                curr = curr.left;
            }
            // İkisi de büyükse ortak ata sağ alt ağaçtadır.
            else if (p > curr.val && q > curr.val)
            {
                curr = curr.right;
            }
            // Yolların ayrıldığı ilk düğüm (veya düğümlerden birinin kendisi) bulundu.
            else
            {
                return curr.val;
            }
        }

        return root.val;
    }
}
```

```typescript solution
function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number {
  let curr = root;

  while (curr !== null) {
    if (p < curr.val && q < curr.val) {
      curr = curr.left;
    } else if (p > curr.val && q > curr.val) {
      curr = curr.right;
    } else {
      return curr.val;
    }
  }

  return 0;
}
```

### Karmaşıklık

- **Zaman:** O(h). `h` ağacın yüksekliğidir; her adımda bir seviye aşağı inilir. Dengeli bir BST'de O(log n), tek dala dönüşmüş ağaçta en kötü O(n) sürer.
- **Alan:** O(1). İteratif çözüm yalnızca tek bir `curr` işaretçisi tutar.

## Testler

```json
[
  { "args": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], "expected": 6, "sample": true },
  { "args": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], "expected": 2, "sample": true },
  { "args": [[2, 1], 2, 1], "expected": 2, "sample": true },
  { "args": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 5], "expected": 4 },
  { "args": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 0, 5], "expected": 2 },
  { "args": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 7, 9], "expected": 8 },
  { "args": [[10, 5, 15, 2, 7, 12, 20], 12, 15], "expected": 15 },
  { "args": [[5, 3, 6, 2, 4, null, null, 1], 1, 4], "expected": 3 }
]
```
