---
title: Ağaçlar ve Graflar
summary: DFS ve BFS ile dolaşma, ikili arama ağacı, heap ve graf problemlerinin ortak iskeleti. Hangi soruda hangi dolaşmanın seçileceği.
minutes: 18
level: intermediate
---

Ağaç ve graf soruları kalabalık görünür, ama neredeyse hepsi iki dolaşma biçiminin çeşitlemesidir: **derinlik öncelikli** (DFS) ve **genişlik öncelikli** (BFS). Bu ikisini refleks haline getirmek, konunun büyük kısmını çözer.

## İkili ağaç

```csharp
public class TreeNode
{
    public int val;
    public TreeNode left;
    public TreeNode right;
}
```

### DFS: özyinelemeyle düşünmek

Ağaç özyinelemeli bir yapıdır: her alt ağaç da bir ağaçtır. Ağaç sorularının çoğu şu kalıba uyar: **"Sol alt ağacın yanıtını ve sağ alt ağacın yanıtını biliyorsam, bu düğümün yanıtı nedir?"**

```typescript
function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0;                             // temel durum
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

Her düğüm bir kez ziyaret edilir: O(n) zaman. Alan, ağacın yüksekliği kadardır: dengeli ağaçta O(log n), tek dala dönüşmüş ağaçta O(n).

Düğümün işlendiği ana göre üç sıra vardır:

| Sıra | Düzen | Tipik kullanım |
| --- | --- | --- |
| Önce kök (preorder) | kök, sol, sağ | Ağacı kopyalama, serileştirme |
| Ortada kök (inorder) | sol, kök, sağ | İkili arama ağacını **sıralı** dolaşma |
| Sonda kök (postorder) | sol, sağ, kök | Alt ağaçların sonucuna dayanan hesaplar (yükseklik, silme) |

### BFS: katman katman

Kuyruk kullanılır. "Seviye seviye", "en kısa yol", "köke en yakın" ifadelerini görünce BFS düşünün.

```csharp
IList<IList<int>> LevelOrder(TreeNode root)
{
    var levels = new List<IList<int>>();
    if (root == null) return levels;

    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);

    while (queue.Count > 0)
    {
        var size = queue.Count;            // bu katmandaki düğüm sayısı
        var level = new List<int>(size);

        for (var i = 0; i < size; i++)
        {
            var node = queue.Dequeue();
            level.Add(node.val);
            if (node.left != null) queue.Enqueue(node.left);
            if (node.right != null) queue.Enqueue(node.right);
        }

        levels.Add(level);
    }

    return levels;
}
```

Katman başında kuyruğun boyutunu saklamak, katmanları birbirinden ayırmanın standart yoludur.

## İkili arama ağacı (BST)

Her düğüm için: sol alt ağaçtaki **bütün** değerler düğümden küçük, sağ alt ağaçtaki **bütün** değerler büyüktür. Bu sayede arama, ekleme ve silme ağacın yüksekliği kadar sürer: dengeliyse O(log n).

İki sonucu aklınızda tutun:

- **Inorder dolaşma sıralı çıktı verir.** "BST'de k. en küçük eleman" gibi sorular buna dayanır.
- **Geçerlilik denetimi yalnızca çocuklara bakarak yapılamaz.** Bir düğümün sağ alt ağacının derinlerindeki bir değer de o düğümden büyük olmalıdır. Doğru yol, her düğüme izin verilen bir **aralık** taşımaktır:

```typescript
function isValidBst(node: TreeNode | null, low = -Infinity, high = Infinity): boolean {
  if (node === null) return true;
  if (node.val <= low || node.val >= high) return false;
  return isValidBst(node.left, low, node.val) && isValidBst(node.right, node.val, high);
}
```

## Heap (öncelik kuyruğu)

Heap, **en küçük (ya da en büyük) elemana** O(1) erişim, ekleme ve çıkarmayı O(log n) sağlayan bir ağaçtır. Sıralı tutmaz; yalnızca tepeyi garanti eder.

"En büyük `k` eleman", "k. en büyük", "sürekli gelen veride medyan", "`k` sıralı listeyi birleştir" sorularında heap düşünün. En büyük `k` elemanı bulmak için **boyutu k olan bir min-heap** tutulur: heap `k`'yi aşınca en küçük atılır. Sonuç O(n log k) olur; bütün diziyi sıralamaktan (O(n log n)) iyidir.

```csharp
int KthLargest(int[] nums, int k)
{
    var heap = new PriorityQueue<int, int>();     // min-heap: öncelik = değer

    foreach (var n in nums)
    {
        heap.Enqueue(n, n);
        if (heap.Count > k) heap.Dequeue();       // en küçüğü at
    }

    return heap.Peek();
}
```

JavaScript'in standart kitaplığında heap yoktur; mülakatta bunu belirtip basit bir heap yazmanız ya da varsaymanız gerekebilir.

## Graflar

Graf, düğümler ve aralarındaki kenarlardan oluşur. Ağaç, döngüsü olmayan bağlı bir graftır. Graf sorusu her zaman "graf" diye gelmez: ızgara (grid), bağımlılık listesi, arkadaşlık ilişkisi, kelime dönüşümü… "Şeyler ve aralarındaki ilişkiler" gördüğünüzde graf düşünün.

En kullanışlı gösterim **komşuluk listesidir**:

```typescript
function buildGraph(n: number, edges: number[][]): number[][] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [from, to] of edges) {
    graph[from].push(to);
    graph[to].push(from);      // yönsüz graf için
  }
  return graph;
}
```

Ağaçtan tek önemli fark: graflarda **döngü** olabilir. Ziyaret edilen düğümleri işaretlemezseniz sonsuz döngüye girersiniz.

### Izgarada DFS: ada sayma

Izgara soruları örtük graflardır: her hücre bir düğüm, komşu hücreler kenardır.

```csharp
int CountIslands(char[][] grid)
{
    var count = 0;

    for (var r = 0; r < grid.Length; r++)
    {
        for (var c = 0; c < grid[r].Length; c++)
        {
            if (grid[r][c] != '1') continue;
            count++;
            Sink(grid, r, c);              // adanın tamamını ziyaret edildi olarak işaretle
        }
    }

    return count;
}

void Sink(char[][] grid, int r, int c)
{
    if (r < 0 || c < 0 || r >= grid.Length || c >= grid[r].Length || grid[r][c] != '1') return;

    grid[r][c] = '0';
    Sink(grid, r + 1, c);
    Sink(grid, r - 1, c);
    Sink(grid, r, c + 1);
    Sink(grid, r, c - 1);
}
```

Her hücre sabit sayıda kez ziyaret edilir: O(satır × sütun).

### BFS: ağırlıksız en kısa yol

Kenarların ağırlığı yoksa (ya da hepsi eşitse), BFS bir düğüme **ilk ulaştığında** en kısa yoldan ulaşmıştır. Ağırlıklı graflarda Dijkstra algoritması (heap ile) gerekir.

### Topolojik sıralama

Yönlü ve döngüsüz bir grafta (bağımlılıklar, ders ön koşulları) düğümleri "her şey bağımlı olduğu şeyden sonra gelecek" biçimde sıralar. Kahn algoritması: gelen kenarı olmayan düğümleri kuyruğa al; bir düğümü işledikçe komşularının gelen kenar sayısını azalt; sıfıra düşenleri kuyruğa ekle. Sonunda işlenmemiş düğüm kaldıysa grafta **döngü** vardır.

## DFS mi, BFS mi?

| Soru | Seçim |
| --- | --- |
| En kısa yol, en az adım, katmanlar | BFS |
| Bütün yolları ya da olasılıkları gezmek | DFS (geri izleme) |
| Bağlı bileşen saymak, bir şeye ulaşılabiliyor mu | İkisi de olur; DFS daha kısa yazılır |
| Alt ağaçların sonucuna dayanan hesap | DFS (postorder) |
| Çok derin, dar yapı | BFS ya da kendi yığınınızla DFS (çağrı yığını taşmasın) |

Karmaşıklık ikisinde de O(V + E)'dir: her düğüm ve her kenar bir kez işlenir.

## Özet

- Ağaç sorularında "alt ağaçların yanıtından bu düğümün yanıtını üret" diye düşünün.
- BFS katman ve en kısa yol; DFS keşif ve alt ağaç hesapları içindir.
- BST'de inorder sıralıdır; geçerliliği aralık taşıyarak denetleyin.
- "En büyük/küçük k" ve "sürekli en küçüğü çek" gördüğünüzde heap düşünün.
- Graflarda ziyaret edilenleri işaretlemeyi unutmayın; ızgaralar örtük graflardır.
