---
title: İkili Ağaçta En Yakın Ortak Ata
difficulty: medium
tags: [agac, dfs, ozyineleme]
function: lowestCommonAncestor
params:
  - { name: root, type: "TreeNode" }
  - { name: p, type: "int" }
  - { name: q, type: "int" }
returns: "int"
---
Bir ikili ağacın kökü `root` ve ağaçta bulunduğu garanti edilen iki farklı düğümün değerleri `p` ile `q` veriliyor. Ağaçtaki tüm düğüm değerleri birbirinden farklıdır. Bu iki düğümün **en yakın ortak atasının** (Lowest Common Ancestor — LCA) değerini döndürün.

İkili ağaçta iki düğüm `p` ve `q`'nun en yakın ortak atası, hem `p`'yi hem de `q`'yu alt ağacında barındıran **en derin** düğüm olarak tanımlanır. Bu tanımda **bir düğüm kendi kendisinin atası (veya soyu) sayılabilir**; yani `q` düğümü `p`'nin alt ağacındaysa ortak ata doğrudan `p` olur.

### Örnek 1

```text
Girdi:  root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 5, q = 1
Çıktı:  3
Açıklama: 5 ve 1 düğümlerinin en yakın ortak atası kök düğüm olan 3'tür.
```

### Örnek 2

```text
Girdi:  root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 5, q = 4
Çıktı:  5
Açıklama: 4 düğümü 5 düğümünün alt ağacında yer alır. Bir düğüm kendi atası sayılabildiği için en yakın ortak ata 5'tir.
```

### Örnek 3

```text
Girdi:  root = [1, 2], p = 1, q = 2
Çıktı:  1
Açıklama: 2 düğümü 1'in sol çocuğudur; ortak ata 1'dir.
```

### Kısıtlar

- Ağaçtaki düğüm sayısı `[2, 10^5]` aralığındadır.
- `-10^9 <= Node.val <= 10^9`
- Tüm `Node.val` değerleri **benzersizdir**.
- `p != q`
- `p` ve `q` değerlerine sahip düğümler ağaçta kesinlikle mevcuttur.

## İpuçları

- Bu ağaç bir İkili Arama Ağacı (BST) **değildir**; düğüm değerlerinin büyüklük-küçüklük ilişkisine bakarak yön seçemezsiniz.
- Her düğümün kendi üst düğümüne "benim alt ağacımda `p` veya `q` bulundu mu?" bilgisini döndürdüğü aşağıdan yukarıya (postorder) bir DFS düşünün.
- Bir düğümün değeri `p` veya `q`'ya eşitse daha derine inmenize gerek var mı? Diğer aranan düğüm bu düğümün altındaysa bile cevap zaten bu düğüm olacaktır.
- Bir düğümün hem sol hem sağ alt ağacından `null` olmayan birer sonuç dönerse, iki hedef ilk kez bu düğümde birleşiyor demektir.

## Çözüm

Ağaç bir ikili arama ağacı olmadığı için kök düğümden başlayarak hem sol hem sağ alt ağacı derinlik öncelikli aramayla (DFS) tararız. Yardımcı `FindLca(node, p, q)` fonksiyonu her düğümde şu soruyu yanıtlar: *"Bu alt ağaçta `p`, `q` veya ikisinin ortak atası var mı?"*

1. **Taban durum:** `node == null` ise `null` döneriz. Eğer `node.val == p` veya `node.val == q` ise aradığımız düğümlerden birine ulaştık demektir; daha aşağı inmeye gerek kalmadan doğrudan `node` döndürürüz (çünkü diğer düğüm bunun altındaysa bile ortak ata yine bu `node` olacaktır).
2. **Özyineleme:** Sol (`left`) ve sağ (`right`) alt ağaçları özyinelemeli olarak ararız.
3. **Birleştirme (Postorder):**
   - Hem `left` hem `right` `null` değilse, hedeflerden biri solda diğeri sağda bulunmuştur. İkisinin ilk birleştiği yer mevcut `node` olduğundan `node`'u döndürürüz.
   - Yalnızca biri `null` değilse, bulunan düğümü (veya daha aşağıda bulunmuş ortak atayı) yukarıya iletmek için `left ?? right` döndürürüz.

```csharp solution
public class Solution
{
    public int LowestCommonAncestor(TreeNode root, int p, int q)
    {
        return FindLca(root, p, q).val;
    }

    private TreeNode FindLca(TreeNode node, int p, int q)
    {
        // Boş düğümse veya hedeflerden birine ulaştıysak doğrudan döndür.
        if (node == null || node.val == p || node.val == q)
            return node;

        TreeNode left = FindLca(node.left, p, q);
        TreeNode right = FindLca(node.right, p, q);

        // Sol ve sağ alt ağaçların ikisinden de hedef döndüyse ortak ata bu düğümdür.
        if (left != null && right != null)
            return node;

        // Tek taraftan sonuç geldiyse onu yukarıya taşı.
        return left ?? right;
    }
}
```

```typescript solution
function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number {
  function findLca(node: TreeNode | null): TreeNode | null {
    if (node === null || node.val === p || node.val === q) {
      return node;
    }

    const left = findLca(node.left);
    const right = findLca(node.right);

    if (left !== null && right !== null) {
      return node;
    }

    return left ?? right;
  }

  return findLca(root)!.val;
}
```

### Karmaşıklık

- **Zaman:** O(n). En kötü durumda ağaçtaki her düğüm en fazla bir kez ziyaret edilir.
- **Alan:** O(h), burada `h` ağacın yüksekliğidir. Özyineleme çağrı yığını dengeli bir ağaçta O(log n), tek bir çizgi halindeki dengesiz ağaçta en fazla O(n) yer kaplar.

## Testler

```json
[
  { "args": [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1], "expected": 3, "sample": true },
  { "args": [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 4], "expected": 5, "sample": true },
  { "args": [[1, 2], 1, 2], "expected": 1, "sample": true },
  { "args": [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 6, 4], "expected": 5 },
  { "args": [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 8], "expected": 3 },
  { "args": [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 4], "expected": 2 },
  { "args": [[10, 20, 30, 40, null, null, 50], 40, 20], "expected": 20 }
]
```
