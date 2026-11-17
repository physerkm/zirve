---
title: İkili Ağaçta Maksimum Yol Toplamı
difficulty: hard
tags: [agac, dfs, ozyineleme]
function: maxPathSum
params:
  - { name: root, type: "TreeNode" }
returns: "int"
---
Bir ikili ağaçta **yol**, ardışık her düğüm çifti arasında bir kenar bulunan ve hiçbir düğümün birden fazla kez geçmediği düğüm dizisidir. Yolun **kökten geçmesi zorunlu değildir** ve en az bir düğüm içermelidir.

Bir yolun **yol toplamı**, üzerindeki tüm düğümlerin değerlerinin toplamıdır. Boş olmayan bir ikili ağacın kökü `root` verildiğinde, ağaçtaki herhangi bir boş olmayan yolun alabileceği **maksimum yol toplamını** döndürün.

### Örnek 1

```text
Girdi:  root = [1, 2, 3]
Çıktı:  6
Açıklama: En yüksek toplamlı yol 2 -> 1 -> 3 yoludur ve toplamı 2 + 1 + 3 = 6'dır.
```

### Örnek 2

```text
Girdi:  root = [-10, 9, 20, null, null, 15, 7]
Çıktı:  42
Açıklama: En yüksek toplamlı yol 15 -> 20 -> 7 yoludur ve toplamı 15 + 20 + 7 = 42'dir.
```

### Kısıtlar

- Ağaçtaki düğüm sayısı `[1, 3 * 10^4]` aralığındadır.
- `-1000 <= Node.val <= 1000`

## İpuçları

- Herhangi bir yolu, o yoldaki **en üst düğüm** (bükülme noktası) üzerinden düşünün: yol bu düğümün sol alt ağacından yukarı çıkar, düğümden geçer ve sağ alt ağacından aşağı iner.
- Bir alt ağaçtan gelen en büyük katkı negatifse, o dalı yola dahil etmek toplamı yalnızca küçültür. Bu durumda o dalı hiç seçmemek (`0` kabul etmek) daha iyidir.
- Bir düğüm kendi üzerindeki "kemer" yolunu (`node.val + left + right`) global maksimum için aday yapabilir; ancak **ebeveynine** dönerken hem sol hem sağ dalı aynı anda veremez (aksi halde yol çatallanır).
- Ebeveyne yalnızca tek bir dal (`node.val + Math.Max(left, right)`) döndüren bir derinlik öncelikli arama (DFS) yazın.

## Çözüm

Ağaçtaki her geçerli yolun **en yüksek seviyede bulunan tek bir tepe düğümü** vardır. Yol bu tepe düğümünde bükülür: sol alt ağaçtan gelen düz bir kol ile sağ alt ağaçtan gelen düz bir kol bu düğümde birleşir.

Bu gözlemle problemi aşağıdan yukarıya (postorder) bir DFS ile tek geçişte çözebiliriz. Her `node` için alt ağaçlardan gelebilecek en iyi tek dal kazançlarını hesaplarız:

1. Sol ve sağ çocuklardan gelen maksimum dal toplamlarını özyinelemeli olarak alırız. Eğer bir dalın katkısı negatifse, o dalı yola hiç katmamak daha kârlı olduğu için katkısını `Math.Max(0, Dfs(child))` ile sıfırlarız.
2. `node`'un tepe noktası olduğu en iyi yolun toplamı `node.val + left + right` olur. Global cevabımız olan `_maxSum` değişkenini bu değerle güncelleriz.
3. Fonksiyonun `node`'un **ebeveynine** döndüreceği değer ise `node.val + left + right` **olamaz**; çünkü bir yol çatallanamaz. Ebeveyn üzerinden devam edecek bir yol, `node`'un yalnızca bir alt dalını seçebilir. Bu yüzden yukarıya `node.val + Math.Max(left, right)` döndürürüz.

Tüm düğümler negatif olabileceğinden `_maxSum` başlangıçta `0` değil, `int.MinValue` (`-Infinity`) olarak başlatılmalıdır.

```csharp solution
public class Solution
{
    private int _maxSum;

    public int MaxPathSum(TreeNode root)
    {
        _maxSum = int.MinValue;
        Dfs(root);
        return _maxSum;
    }

    private int Dfs(TreeNode node)
    {
        if (node == null)
            return 0;

        // Negatif katkı yapan alt dalları 0 ile keserek yola dahil etmiyoruz.
        int left = Math.Max(0, Dfs(node.left));
        int right = Math.Max(0, Dfs(node.right));

        // Bu düğümün bükülme noktası (tepe) olduğu yol toplamıyla global maksimumu güncelle.
        _maxSum = Math.Max(_maxSum, node.val + left + right);

        // Yukarıdaki ebeveyne çatallanmayan tek bir dal döndür.
        return node.val + Math.Max(left, right);
    }
}
```

```typescript solution
function maxPathSum(root: TreeNode | null): number {
  let maxSum = -Infinity;

  function dfs(node: TreeNode | null): number {
    if (node === null) return 0;

    const left = Math.max(0, dfs(node.left));
    const right = Math.max(0, dfs(node.right));

    maxSum = Math.max(maxSum, node.val + left + right);

    return node.val + Math.max(left, right);
  }

  dfs(root);
  return maxSum;
}
```

### Karmaşıklık

- **Zaman:** O(n). Ağaçtaki her düğüm tam olarak bir kez ziyaret edilir ve her düğümde O(1) işlem yapılır.
- **Alan:** O(h). Özyineleme çağrı yığını ağacın yüksekliği `h` kadar yer kaplar; dengeli ağaçta O(log n), tek dala dönüşmüş ağaçta O(n).

## Testler

```json
[
  { "args": [[1, 2, 3]], "expected": 6, "sample": true },
  { "args": [[-10, 9, 20, null, null, 15, 7]], "expected": 42, "sample": true },
  { "args": [[-3]], "expected": -3, "sample": true },
  { "args": [[2, -1]], "expected": 2 },
  { "args": [[-2, -1]], "expected": -1 },
  { "args": [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], "expected": 48 },
  { "args": [[1, -2, -3, 1, 3, -2, null, -1]], "expected": 3 },
  { "args": [[10, 2, 10, 20, 1, null, -25, null, null, null, null, 3, 4]], "expected": 42 }
]
```
