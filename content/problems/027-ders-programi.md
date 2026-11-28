---
title: Ders Programı
difficulty: medium
tags: [graf, topolojik-siralama, bfs, dfs]
function: canFinish
params:
  - { name: numCourses, type: "int" }
  - { name: prerequisites, type: "int[][]" }
returns: "bool"
---
Toplam `numCourses` adet ders almanız gerekiyor; dersler `0`'dan `numCourses - 1`'e kadar numaralandırılmıştır.

Size bir ön koşul dizisi `prerequisites` veriliyor: `prerequisites[i] = [a, b]` ifadesi, `a` dersini alabilmek için önce `b` dersini tamamlamanız gerektiğini (`b → a`) belirtir.

Örneğin `[0, 1]` çifti, `0` numaralı dersi alabilmek için önce `1` numaralı dersi bitirmeniz gerektiği anlamına gelir.

Tüm dersleri tamamlamanız mümkünse `true`, aksi halde `false` döndürün.

### Örnek 1

```text
Girdi:  numCourses = 2, prerequisites = [[1, 0]]
Çıktı:  true
Açıklama: Toplam 2 ders var. 1. dersi almak için önce 0. dersi bitirmelisiniz; bu mümkündür (0 → 1).
```

### Örnek 2

```text
Girdi:  numCourses = 2, prerequisites = [[1, 0], [0, 1]]
Çıktı:  false
Açıklama: 1. ders için 0. ders, 0. ders için ise 1. ders gereklidir. Döngüsel bağımlılık olduğundan ikisi de alınamaz.
```

### Örnek 3

```text
Girdi:  numCourses = 4, prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]
Çıktı:  true
Açıklama: Önce 0. ders alınır, ardından 1 ve 2, en son 3. ders tamamlanabilir.
```

### Kısıtlar

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= 5000`
- `prerequisites[i].length == 2`
- `0 <= a, b < numCourses`
- Tüm `prerequisites[i]` çiftleri birbirinden farklıdır.

## İpuçları

- Bu problemi yönlü bir graf (directed graph) olarak modelleyin: her ders bir düğüm, her `[a, b]` ön koşulu ise `b → a` yönünde bir kenardır.
- Tüm derslerin bitirilebilmesi, bu yönlü grafta **hiçbir döngü (cycle) bulunmaması** ile eşdeğerdir.
- Hiç ön koşulu olmayan (giriş derecesi `indegree == 0` olan) dersleri hemen alabilirsiniz.
- Aldığınız her dersin kilidini açtığı sonraki derslerin `indegree` değerini 1 azaltın; `0`'a düşenleri de kuyruğa ekleyin (Kahn Algoritması).

## Çözüm

Problem, yönlü bir grafta **döngü tespiti (cycle detection)** ya da eşdeğer olarak **topolojik sıralama (topological sort)** yapılabilir mi sorusudur. En temiz ve özyineleme yığını taşması riski taşımayan yöntem **Kahn Algoritması (Indegree BFS)** kullanmaktır.

1. **Grafı ve giriş derecelerini kur:** Her `[course, pre]` çifti için `pre → course` kenarını komşuluk listesine (`adj[pre]`) ekler ve `indegree[course]` (bu dersin kalan ön koşul sayısı) değerini 1 artırırız.
2. **Ön koşulsuz derslerden başla:** Başlangıçta `indegree[i] == 0` olan tüm dersleri kuyruğa (`Queue`) koyarız; çünkü bu dersler hiçbir derse bağımlı değildir, hemen alınabilir.
3. **Kilitleri açarak ilerle:** Kuyruktan çıkan her `cur` dersi tamamlanmış sayılır (`completed++`). Bu derse bağlı olan her `next` dersinin `indegree[next]` değerini 1 azaltırız. Eğer `indegree[next] == 0` olursa, `next` dersinin tüm ön koşulları tamamlanmış demektir; onu da kuyruğa ekleriz.
4. **Döngü kontrolü:** Eğer grafta bir döngü varsa, o döngüdeki hiçbir düğümün `indegree` değeri `0`'a düşmez ve kuyruğa giremez. Döngü bittiğinde `completed == numCourses` ise tüm dersler alınabilmiştir (`true`), değilse bir döngü vardır (`false`).

```csharp solution
public class Solution
{
    public bool CanFinish(int numCourses, int[][] prerequisites)
    {
        List<int>[] adj = new List<int>[numCourses];
        for (int i = 0; i < numCourses; i++)
            adj[i] = new List<int>();

        int[] indegree = new int[numCourses];

        // 1. Komşuluk listesini ve her dersin ön koşul sayısını (indegree) oluştur.
        foreach (int[] edge in prerequisites)
        {
            int course = edge[0];
            int pre = edge[1];
            adj[pre].Add(course);
            indegree[course]++;
        }

        // 2. Hiç ön koşulu olmayan (indegree == 0) dersleri kuyruğa ekle.
        Queue<int> queue = new Queue<int>();
        for (int i = 0; i < numCourses; i++)
        {
            if (indegree[i] == 0)
                queue.Enqueue(i);
        }

        // 3. Dersleri sırayla tamamla ve bağımlı derslerin ön koşul sayısını düşür.
        int completed = 0;
        while (queue.Count > 0)
        {
            int cur = queue.Dequeue();
            completed++;

            foreach (int next in adj[cur])
            {
                indegree[next]--;
                if (indegree[next] == 0)
                    queue.Enqueue(next);
            }
        }

        return completed == numCourses;
    }
}
```

```typescript solution
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  const indegree = new Array<number>(numCourses).fill(0);

  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    indegree[course]++;
  }

  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (indegree[i] === 0) {
      queue.push(i);
    }
  }

  let completed = 0;
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    completed++;

    for (const next of adj[cur]) {
      indegree[next]--;
      if (indegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return completed === numCourses;
}
```

### Karmaşıklık

- **Zaman:** O(V + E). Burada `V = numCourses` (ders sayısı) ve `E = prerequisites.length` (ön koşul sayısı). Her ders kuyruğa en fazla bir kez girer ve her kenar tam olarak bir kez işlenir.
- **Alan:** O(V + E). Komşuluk listesi O(V + E), `indegree` dizisi ve BFS kuyruğu O(V) bellek kullanır.

## Testler

```json
[
  { "args": [2, [[1, 0]]], "expected": true, "sample": true },
  { "args": [2, [[1, 0], [0, 1]]], "expected": false, "sample": true },
  { "args": [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], "expected": true, "sample": true },
  { "args": [1, []], "expected": true },
  { "args": [3, [[0, 1], [1, 2], [2, 0]]], "expected": false },
  { "args": [4, [[1, 0], [2, 1], [3, 2], [1, 3]]], "expected": false },
  { "args": [5, []], "expected": true },
  { "args": [5, [[1, 4], [2, 4], [3, 1], [3, 2]]], "expected": true }
]
```
