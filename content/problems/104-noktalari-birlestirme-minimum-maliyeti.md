---
title: Noktaları Birleştirmenin Minimum Maliyeti
difficulty: medium
tags: [graf, heap]
function: minCostConnectPoints
params:
  - { name: points, type: "int[][]" }
returns: "int"
---

2 boyutlu bir düzlemdeki noktaların tam sayı koordinatlarını temsil eden `points` dizisi veriliyor; burada `points[i] = [x_i, y_i]` şeklindedir.

İki nokta `[x_i, y_i]` ve `[x_j, y_j]` arasındaki bağlantı maliyeti, bu iki nokta arasındaki **Manhattan mesafesidir**: `|x_i - x_j| + |y_i - y_j|`.

Tüm noktaları birbirine bağlamak için gereken **minimum toplam maliyeti** döndürün. Herhangi iki nokta arasında doğrudan veya dolaylı olarak tam olarak bir basit yol bulunuyorsa tüm noktalar birbirine bağlanmış kabul edilir.

### Örnek 1

```text
Girdi:  points = [[0,0],[2,2],[3,10],[5,2],[7,0]]
Çıktı:  20
Açıklama: Noktaları (0,0)-(2,2) [4], (2,2)-(5,2) [3], (5,2)-(7,0) [4] ve (2,2)-(3,10) [9] kenarlarıyla birleştirdiğimizde toplam maliyet 4 + 3 + 4 + 9 = 20 olur.
```

### Örnek 2

```text
Girdi:  points = [[3,12],[-2,5],[-4,1]]
Çıktı:  18
Açıklama: (-4,1) ile (-2,5) arası maliyet 6, (-2,5) ile (3,12) arası maliyet 12 olup toplam 18'dir.
```

### Kısıtlar

- `1 <= points.length <= 1000`
- `-10^6 <= x_i, y_i <= 10^6`
- Tüm `(x_i, y_i)` noktaları birbirinden farklıdır.

## İpuçları

- `N` noktayı döngü oluşturmadan en düşük maliyetle birbirine bağlayan yapı bir **Minimum Kapsayan Ağaçtır (Minimum Spanning Tree - MST)**.
- Her nokta çifti arasında olası bir kenar bulunduğu için graf **tam (yoğun) bir graftır** ve `N · (N - 1) / 2` adet kenar içerir.
- Tüm kenarları bir Min-Heap'e atmak O(N² log N) zaman ve O(N²) bellek gerektirir; bunun yerine her düğümün mevcut ağaca olan en kısa mesafesini `minDist` dizisinde tutan **Prim Algoritması** ile O(N²) zaman ve O(N) bellekte çözüm üretebilirsiniz.
- Her adımda henüz ağaca eklenmemiş düğümler arasından `minDist` değeri en küçük olanı seçip ağaca dahil edin ve kalan düğümlerin `minDist` değerlerini güncelleyin.

## Çözüm

Problem, düzlemdeki `N` noktayı düğüm, aralarındaki Manhattan mesafesini ise kenar ağırlığı kabul eden tam bir grafta **Minimum Kapsayan Ağaç (MST)** bulma problemidir.

Graf yoğun (`E ≈ N²/2`) olduğu için **Prim Algoritması**nın dizi tabanlı versiyonu en verimli seçenektir:
- `inMst[i]`: `i`. noktanın kapsayan ağaca dahil edilip edilmediğini tutar.
- `minDist[i]`: `i`. noktayı şu ana kadar ağaca eklenmiş herhangi bir noktaya bağlayan **en küçük** kenar ağırlığını tutar. Başlangıçta `minDist[0] = 0`, diğer tüm noktalar için `∞` (`int.MaxValue`) atanır.

Toplam `N` adımda her seferinde:
1. Henüz ağaca girmemiş (`!inMst[u]`) noktalar arasından `minDist[u]` değeri en küçük olan `u` noktasını seçeriz.
2. `u` noktasını ağaca ekler (`inMst[u] = true`) ve `minDist[u]` değerini `totalCost`'a ilave ederiz.
3. Henüz ağaçta olmayan her `v` noktası için `u` ile `v` arasındaki Manhattan mesafesini hesaplarız; eğer bu mesafe `minDist[v]` değerinden küçükse `minDist[v]`'yi güncelleriz.

```csharp solution
public class Solution
{
    public int MinCostConnectPoints(int[][] points)
    {
        int n = points.Length;
        bool[] inMst = new bool[n];
        int[] minDist = new int[n];
        Array.Fill(minDist, int.MaxValue);
        minDist[0] = 0;

        int totalCost = 0;

        for (int step = 0; step < n; step++)
        {
            int u = -1;
            for (int i = 0; i < n; i++)
            {
                if (!inMst[i] && (u == -1 || minDist[i] < minDist[u]))
                    u = i;
            }

            inMst[u] = true;
            totalCost += minDist[u];

            for (int v = 0; v < n; v++)
            {
                if (!inMst[v])
                {
                    int dist = Math.Abs(points[u][0] - points[v][0]) +
                               Math.Abs(points[u][1] - points[v][1]);
                    if (dist < minDist[v])
                        minDist[v] = dist;
                }
            }
        }

        return totalCost;
    }
}
```

```typescript solution
function minCostConnectPoints(points: number[][]): number {
  const n = points.length;
  const inMst = new Array<boolean>(n).fill(false);
  const minDist = new Array<number>(n).fill(Infinity);
  minDist[0] = 0;

  let totalCost = 0;

  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inMst[i] && (u === -1 || minDist[i] < minDist[u])) {
        u = i;
      }
    }

    inMst[u] = true;
    totalCost += minDist[u];

    for (let v = 0; v < n; v++) {
      if (!inMst[v]) {
        const dist =
          Math.abs(points[u][0] - points[v][0]) +
          Math.abs(points[u][1] - points[v][1]);
        if (dist < minDist[v]) {
          minDist[v] = dist;
        }
      }
    }
  }

  return totalCost;
}
```

### Karmaşıklık

- **Zaman:** O(N²). Dış döngü `N` kez çalışır; her adımda en yakın düğümü bulmak ve kalan düğümlerin mesafelerini güncellemek O(N) sürer.
- **Alan:** O(N). Yalnızca `inMst` ve `minDist` dizileri için `N` elemanlık bellek kullanılır.

## Testler

```json
[
  { "args": [[[0,0],[2,2],[3,10],[5,2],[7,0]]], "expected": 20, "sample": true },
  { "args": [[[3,12],[-2,5],[-4,1]]], "expected": 18, "sample": true },
  { "args": [[[0,0]]], "expected": 0 },
  { "args": [[[0,0],[1,1],[1,0],[-1,1]]], "expected": 4 },
  { "args": [[[-1000000,-1000000],[1000000,1000000]]], "expected": 4000000 },
  { "args": [[[0,0],[0,5],[5,0],[5,5]]], "expected": 15 },
  { "args": [[[2,-3],[-17,-8],[13,8],[-17,-15]]], "expected": 53 }
]
```
