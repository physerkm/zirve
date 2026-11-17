---
title: Duvarlar ve Kapılar
difficulty: medium
tags: [graf, bfs, kuyruk, matris]
function: wallsAndGates
params:
  - { name: rooms, type: "int[][]" }
returns: "int[][]"
---
`m x n` boyutlarında bir ızgara (`rooms`) veriliyor. Izgaradaki her hücre şu üç değerden birini alır:

- `-1` — Bir **duvar** veya engeli temsil eder.
- `0` — Bir **kapıyı** temsil eder.
- `2147483647` (`INF`, yani `2^31 - 1`) — **Boş bir odayı** temsil eder.

Her boş odayı, **en yakın kapıya olan uzaklığıyla** doldurun ve güncellenmiş `rooms` matrisini döndürün. Hareket yalnızca yatay ve dikey yönlerde (yukarı, aşağı, sol, sağ) yapılabilir ve duvarlardan geçilemez.

Eğer bir boş odadan hiçbir kapıya ulaşmak mümkün değilse, o hücrenin değeri `2147483647` (`INF`) olarak kalmalıdır.

### Örnek 1

```text
Girdi:  rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]
Çıktı:  [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]
Açıklama: İki kapı (0, 2) ve (3, 0) konumlarındadır. Her boş odaya en yakın kapıdan adım sayısı yazılır.
```

### Örnek 2

```text
Girdi:  rooms = [[-1]]
Çıktı:  [[-1]]
Açıklama: Izgarada yalnızca bir duvar bulunduğundan değişiklik yapılmaz.
```

### Örnek 3

```text
Girdi:  rooms = [[0,-1,2147483647],[2147483647,-1,2147483647]]
Çıktı:  [[0,-1,2147483647],[1,-1,2147483647]]
Açıklama: Sağ sütundaki boş odalar duvarların arkasında kaldığı için hiçbir kapıya ulaşamaz ve INF olarak kalır.
```

### Kısıtlar

- `m == rooms.length`
- `n == rooms[i].length`
- `1 <= m, n <= 250`
- `rooms[i][j]` değeri `-1`, `0` veya `2^31 - 1` (`2147483647`) değerlerinden biridir.

## İpuçları

- Her boş odadan başlayıp en yakın kapıyı ayrı ayrı BFS ile aramak O((m · n)²) zaman alır ve büyük ızgaralarda çok yavaştır.
- Soruyu tersine çevirin: Boş odalardan kapı aramak yerine, **kapılardan boş odalara** doğru yayılın.
- Tüm kapıları (`0`) başlangıçta aynı anda kuyruğa eklerseniz (Çok Kaynaklı BFS / Multi-Source BFS), her katmanda tüm kapılardan 1 adım, 2 adım, 3 adım uzaklıktaki odaları sırayla keşfedersiniz.
- Bir boş odaya (`INF`) ilk kez ulaştığınız an, ona en yakın kapıdan gelmişsiniz demektir; değerini hemen güncellediğinizde başka bir ziyaretçi o odaya tekrar girmez.

## Çözüm

Her boş odadan ayrı bir Genişlik Öncelikli Arama (BFS) başlatmak yerine, **Çok Kaynaklı BFS (Multi-Source BFS)** kullanırız.

Önce matrisi baştan sona tarayarak değeri `0` olan tüm kapıları kuyruğa (`Queue`) ekleriz. Bu kapıların hepsi mesafesi `0` olan başlangıç düğümleridir. Ardından standart BFS döngüsünü çalıştırırız:

1. Kuyruktan bir hücre `(r, c)` çıkarırız.
2. Dört komşusuna (`yukarı, aşağı, sol, sağ`) bakarız.
3. Komşu hücre ızgara sınırları içindeyse ve değeri hâlâ `INF` (`2147483647`) ise, bu odaya daha önce hiçbir kapıdan ulaşılmamış demektir.
4. BFS katman katman ilerlediği için, bir boş odaya ilk ulaşan dalga her zaman **en yakın kapıdan** gelir. Komşunun değerini `rooms[r][c] + 1` yaparız ve onu da kuyruğa ekleriz.

Bir odanın değeri `INF`'den gerçek mesafesine güncellendiği anda, `rooms[nr][nc] != INF` koşulu sayesinde aynı hücre kuyruğa bir daha asla eklenmez. Böylece ayrı bir `visited` dizisine de ihtiyaç kalmaz.

```csharp solution
public class Solution
{
    public int[][] WallsAndGates(int[][] rooms)
    {
        int rows = rooms.Length;
        int cols = rooms[0].Length;
        const int INF = 2147483647;
        Queue<(int r, int c)> queue = new Queue<(int r, int c)>();

        // 1. Tüm kapıları (0) aynı anda kuyruğa ekle.
        for (int r = 0; r < rows; r++)
        {
            for (int c = 0; c < cols; c++)
            {
                if (rooms[r][c] == 0)
                    queue.Enqueue((r, c));
            }
        }

        int[][] dirs = new int[][]
        {
            new int[] { -1, 0 },
            new int[] { 1, 0 },
            new int[] { 0, -1 },
            new int[] { 0, 1 }
        };

        // 2. Çok kaynaklı BFS ile boş odalara en kısa mesafeyi katman katman yay.
        while (queue.Count > 0)
        {
            var (r, c) = queue.Dequeue();

            foreach (int[] d in dirs)
            {
                int nr = r + d[0];
                int nc = c + d[1];

                // Sınır dışıysa, duvarsa veya daha önce ziyaret edilmişse atla.
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || rooms[nr][nc] != INF)
                    continue;

                rooms[nr][nc] = rooms[r][c] + 1;
                queue.Enqueue((nr, nc));
            }
        }

        return rooms;
    }
}
```

```typescript solution
function wallsAndGates(rooms: number[][]): number[][] {
  const rows = rooms.length;
  const cols = rooms[0].length;
  const INF = 2147483647;
  const queue: [number, number][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rooms[r][c] === 0) {
        queue.push([r, c]);
      }
    }
  }

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || rooms[nr][nc] !== INF) {
        continue;
      }

      rooms[nr][nc] = rooms[r][c] + 1;
      queue.push([nr, nc]);
    }
  }

  return rooms;
}
```

### Karmaşıklık

- **Zaman:** O(m · n). Her hücre kuyruğa en fazla bir kez girer ve dört komşusu sabit zamanda kontrol edilir.
- **Alan:** O(m · n). En kötü durumda (tüm hücreler kapıysa veya kuyrukta aynı anda çok sayıda hücre birikirse) kuyruk O(m · n) eleman tutar.

## Testler

```json
[
  {
    "args": [[[2147483647, -1, 0, 2147483647], [2147483647, 2147483647, 2147483647, -1], [2147483647, -1, 2147483647, -1], [0, -1, 2147483647, 2147483647]]],
    "expected": [[3, -1, 0, 1], [2, 2, 1, -1], [1, -1, 2, -1], [0, -1, 3, 4]],
    "sample": true
  },
  {
    "args": [[[-1]]],
    "expected": [[-1]],
    "sample": true
  },
  {
    "args": [[[0, -1, 2147483647], [2147483647, -1, 2147483647]]],
    "expected": [[0, -1, 2147483647], [1, -1, 2147483647]],
    "sample": true
  },
  {
    "args": [[[0, 2147483647, 2147483647, 2147483647, 0]]],
    "expected": [[0, 1, 2, 1, 0]]
  },
  {
    "args": [[[2147483647, 2147483647], [2147483647, -1]]],
    "expected": [[2147483647, 2147483647], [2147483647, -1]]
  },
  {
    "args": [[[0, 0], [0, 0]]],
    "expected": [[0, 0], [0, 0]]
  },
  {
    "args": [[[2147483647, 2147483647, 2147483647], [2147483647, 0, 2147483647], [2147483647, 2147483647, 2147483647]]],
    "expected": [[2, 1, 2], [1, 0, 1], [2, 1, 2]]
  }
]
```
