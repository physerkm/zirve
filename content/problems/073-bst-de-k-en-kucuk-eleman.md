---
title: BST'de K. En Küçük Eleman
difficulty: medium
tags: [agac, ikili-arama-agaci, dfs, yigin]
function: kthSmallest
params:
  - { name: root, type: "TreeNode" }
  - { name: k, type: "int" }
returns: "int"
---
Bir ikili arama ağacının (BST) kökü `root` ve bir tam sayı `k` veriliyor. Ağaçtaki değerler arasında **`k`. en küçük** değeri döndürün (`k` 1 tabanlıdır).

### Örnek 1

```text
Girdi:  root = [3, 1, 4, null, 2], k = 1
Çıktı:  1
```

### Örnek 2

```text
Girdi:  root = [5, 3, 6, 2, 4, null, null, 1], k = 3
Çıktı:  3
```

### Kısıtlar

- Düğüm sayısı `n`, `1 <= k <= n <= 10^4`
- `0 <= Node.val <= 10^4`

**Devam sorusu:** BST sık sık değiştiriliyor ve k. en küçük eleman sık sık soruluyorsa nasıl iyileştirirdiniz?

## İpuçları

- BST'yi **in-order** (sol, kök, sağ) dolaşmak değerleri küçükten büyüğe verir.
- Bütün değerleri listeye toplamak gerekmez: in-order dolaşırken bir sayaç tutun ve `k`. düğümde durun.
- Yinelemeli in-order için bir yığın kullanın: önce gidebildiğiniz kadar sola inin.

## Çözüm

### Yığınla yinelemeli in-order

`current` kökten başlar. Her turda:

1. `current` `null` olana kadar sola inilir ve geçilen düğümler yığına atılır.
2. Yığının tepesi çıkarılır: bu, henüz işlenmemiş **en küçük** değerdir. Sayaç bir artar; `k`'ya ulaştıysa cevap bu düğümdür.
3. `current` bu düğümün sağ çocuğu olur; sağ alt ağaçtaki değerler sıradaki küçük değerlerdir.

Erken durduğumuz için yalnızca `k` düğüm (ve onların sol zinciri) işlenir.

```csharp solution
public class Solution
{
    public int KthSmallest(TreeNode root, int k)
    {
        var stack = new Stack<TreeNode>();
        var current = root;

        while (current != null || stack.Count > 0)
        {
            while (current != null)
            {
                stack.Push(current);
                current = current.left;
            }

            current = stack.Pop();
            k--;
            if (k == 0)
            {
                return current.val;
            }

            current = current.right;
        }

        return -1;
    }
}
```

```typescript solution
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let current = root;

  while (current !== null || stack.length > 0) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop()!;
    k--;
    if (k === 0) {
      return current.val;
    }

    current = current.right;
  }

  return -1;
}
```

### Karmaşıklık

- **Zaman:** O(h + k). Önce yükseklik kadar sola inilir, sonra `k` düğüm çıkarılır.
- **Alan:** O(h). Yığın en fazla bir kökten-yaprağa yol kadar düğüm tutar.

Devam sorusu için her düğümde **alt ağaç boyutu** tutulur: sol alt ağaçta `k - 1` düğüm varsa cevap köktür, fazlaysa sola, azsa sağa (k'yı azaltarak) inilir. Güncellemeler ve sorgular O(h) olur.

## Testler

```json
[
  { "args": [[3, 1, 4, null, 2], 1], "expected": 1, "sample": true },
  { "args": [[5, 3, 6, 2, 4, null, null, 1], 3], "expected": 3, "sample": true },
  { "args": [[1], 1], "expected": 1 },
  { "args": [[2, 1, 3], 3], "expected": 3 },
  { "args": [[5, 3, 6, 2, 4, null, null, 1], 6], "expected": 6 },
  { "args": [[4, 2, 6, 1, 3, 5, 7], 4], "expected": 4 }
]
```
