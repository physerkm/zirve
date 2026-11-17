---
title: Ders Programı II
difficulty: medium
tags: [graf, topolojik-siralama, bfs]
function: findOrder
params:
  - { name: numCourses, type: "int" }
  - { name: prerequisites, type: "int[][]" }
returns: "int[]"
---
Toplam `numCourses` adet ders almanız gerekiyor; dersler `0`'dan `numCourses - 1`'e kadar numaralandırılmıştır.

Size bir ön koşul dizisi `prerequisites` veriliyor: `prerequisites[i] = [a, b]` ifadesi, `a` dersini alabilmek için önce `b` dersini tamamlamanız gerektiğini (`b → a`) belirtir.

Tüm dersleri bitirmek için izlemeniz gereken **ders sırasını** döndürün. Birden fazla geçerli sıralama varsa herhangi birini döndürebilirsiniz. Eğer tüm dersleri tamamlamak imkânsızsa (döngü varsa) **boş bir dizi** (`[]`) döndürün.

### Örnek 1

```text
Girdi:  numCourses = 2, prerequisites = [[1, 0]]
Çıktı:  [0, 1]
Açıklama: Toplam 2 ders var. 1. dersi almak için önce 0. dersi bitirmelisiniz. Dolayısıyla doğru sıra [0, 1] olur.
```

### Örnek 2

```text
Girdi:  numCourses = 4, prerequisites = [[1, 0], [2, 1], [3, 2], [3, 0]]
Çıktı:  [0, 1, 2, 3]
Açıklama: 0. dersten sonra 1, 1'den sonra 2 ve en son 3. ders alınarak tüm ön koşullar sağlanır.
```

### Örnek 3

```text
Girdi:  numCourses = 1, prerequisites = []
Çıktı:  [0]
Açıklama: Tek bir ders var ve ön koşulu yok.
```

### Kısıtlar

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= numCourses * (numCourses - 1)`
- `prerequisites[i].length == 2`
- `0 <= a, b < numCourses`
- `a != b`
- Tüm `[a, b]` çiftleri birbirinden farklıdır.

## İpuçları

- Bu problem, yönlü bir grafın **topolojik sıralamasını (topological sort)** üretmenizi ister.
- Kahn Algoritması (Indegree BFS) ile her dersin kalan ön koşul sayısını (`indegree`) tutun.
- Kuyruktan çıkardığınız her dersi sonuç dizisine (`order`) sırayla ekleyin.
- Kuyruk boşaldığında sonuç dizisine eklenen ders sayısı `numCourses`'tan azsa grafta bir döngü vardır; bu durumda boş dizi `[]` döndürün.

## Çözüm

**Ders Programı I** probleminde yalnızca tüm derslerin tamamlanıp tamamlanamayacağını saymıştık. Bu problemde ise kuyruktan çıkan dersleri sırasıyla bir `order` dizisine kaydederek geçerli bir **Topolojik Sıralama** elde ederiz.

1. Her `[course, pre]` ön koşulu için `pre → course` yönlü kenarını komşuluk listesine (`adj[pre]`) ekler ve `indegree[course]` değerini 1 artırırız.
2. Başlangıçta hiç ön koşulu olmayan (`indegree[i] == 0`) dersleri kuyruğa (`Queue`) ekleriz.
3. Kuyruk boşalana kadar:
   - Kuyruktan bir `cur` dersi çıkarıp `order[idx++] = cur` ile sonuç dizisine yazarız.
   - `cur` dersinin kilidini açtığı her `next` dersi için `indegree[next]` değerini 1 azaltırız; `0`'a düşenleri kuyruğa ekleriz.
4. Döngü sonunda `idx == numCourses` ise tüm dersler geçerli bir sırayla dizilmiştir ve `order` dizisini döndürürüz. Aksi halde bir döngü bazı derslerin alınmasını engellemiştir; boş dizi (`Array.Empty<int>()`) döndürürüz.

```csharp solution
public class Solution
{
    public int[] FindOrder(int numCourses, int[][] prerequisites)
    {
        List<int>[] adj = new List<int>[numCourses];
        for (int i = 0; i < numCourses; i++)
            adj[i] = new List<int>();

        int[] indegree = new int[numCourses];

        foreach (int[] edge in prerequisites)
        {
            int course = edge[0];
            int pre = edge[1];
            adj[pre].Add(course);
            indegree[course]++;
        }

        Queue<int> queue = new Queue<int>();
        for (int i = 0; i < numCourses; i++)
        {
            if (indegree[i] == 0)
                queue.Enqueue(i);
        }

        int[] order = new int[numCourses];
        int idx = 0;

        while (queue.Count > 0)
        {
            int cur = queue.Dequeue();
            order[idx++] = cur;

            foreach (int next in adj[cur])
            {
                indegree[next]--;
                if (indegree[next] == 0)
                    queue.Enqueue(next);
            }
        }

        return idx == numCourses ? order : Array.Empty<int>();
    }
}
```

```typescript solution
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
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

  const order: number[] = [];
  let head = 0;

  while (head < queue.length) {
    const cur = queue[head++];
    order.push(cur);

    for (const next of adj[cur]) {
      indegree[next]--;
      if (indegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return order.length === numCourses ? order : [];
}
```

### Karmaşıklık

- **Zaman:** O(V + E). Burada `V = numCourses` ve `E = prerequisites.length`. Her düğüm kuyruğa ve sonuç dizisine en fazla bir kez girer, her kenar tam bir kez incelenir.
- **Alan:** O(V + E). Komşuluk listesi O(V + E), `indegree` dizisi, kuyruk ve sonuç dizisi O(V) alan kullanır.

## Testler

```json
[
  { "args": [2, [[1, 0]]], "expected": [0, 1], "sample": true },
  { "args": [4, [[1, 0], [2, 1], [3, 2], [3, 0]]], "expected": [0, 1, 2, 3], "sample": true },
  { "args": [1, []], "expected": [0], "sample": true },
  { "args": [2, [[1, 0], [0, 1]]], "expected": [] },
  { "args": [3, [[0, 2], [1, 0], [2, 1]]], "expected": [] },
  { "args": [4, [[0, 2], [1, 0], [3, 1]]], "expected": [2, 0, 1, 3] },
  { "args": [5, [[3, 4], [1, 3], [0, 1], [2, 0], [2, 4]]], "expected": [4, 3, 1, 0, 2] },
  { "args": [4, [[1, 0], [2, 1], [3, 2], [1, 3]]], "expected": [] }
]
```
