---
title: Grafı Kopyala
difficulty: medium
tags: [graf, dfs, bfs, hash-tablosu]
function: cloneGraph
params:
  - { name: adjList, type: "List<List<int>>" }
returns: "List<List<int>>"
---
Bağlantılı ve yönsüz bir grafın komşuluk listesi (`adjList`) veriliyor. Grafın **derin kopyasını (deep copy)** oluşturup kopyalanan grafın komşuluk listesini döndürün.

Graftaki her düğüm bir tam sayı değeri (`val`) ve komşu düğümlerinin listesini (`neighbors`) tutar. Komşuluk listesi 1-tabanlıdır: `adjList[i]`, `i + 1` numaralı düğümün komşularını içerir.

### Örnek 1

```text
Girdi:  adjList = [[2,4],[1,3],[2,4],[1,3]]
Çıktı:  [[2,4],[1,3],[2,4],[1,3]]
Açıklama: Grafta 4 düğüm vardır:
1. düğümün (val = 1) komşuları 2. ve 4. düğümlerdir.
2. düğümün (val = 2) komşuları 1. ve 3. düğümlerdir.
3. düğümün (val = 3) komşuları 2. ve 4. düğümlerdir.
4. düğümün (val = 4) komşuları 1. ve 3. düğümlerdir.
Yeni düğüm nesneleriyle birebir aynı bağlantılara sahip derin kopya oluşturulur.
```

### Örnek 2

```text
Girdi:  adjList = [[]]
Çıktı:  [[]]
Açıklama: Graf yalnızca 1 numaralı düğümden oluşur ve hiç komşusu yoktur.
```

### Örnek 3

```text
Girdi:  adjList = []
Çıktı:  []
Açıklama: Graf boştur, hiç düğüm içermez.
```

### Kısıtlar

- Graftaki düğüm sayısı `[0, 100]` aralığındadır.
- `1 <= Node.val <= 100`
- Her düğümün `Node.val` değeri benzersizdir.
- Tekrarlı kenar ve kendine döngü (self-loop) yoktur.
- Graf bağlantılıdır ve tüm düğümlere 1. düğümden ulaşılabilir.

## İpuçları

- Yönsüz bir grafta `1 — 2` kenarı hem `1`'den `2`'ye hem de `2`'den `1`'e gitmeye izin verir; bu nedenle ziyaret edilen düğümleri takip etmezseniz sonsuz döngüye girersiniz.
- Yalnızca "ziyaret edildi mi?" bilgisi yetmez: daha önce kopyaladığınız bir komşu düğüme tekrar rastladığınızda, o düğümün **önceden oluşturulmuş kopya referansına** ihtiyacınız vardır.
- `Dictionary<Node, Node>` (eski düğüm -> yeni kopya düğüm) eşlemesi kullanarak hem sonsuz döngüyü önleyebilir hem de mevcut kopyalara O(1)'de erişebilirsiniz.
- Bir düğümün komşularını özyinelemeli olarak kopyalamadan **önce** yeni düğümü sözlüğe kaydetmeyi unutmayın.

## Çözüm

Bir grafı derin kopyalarken en kritik sorun **döngülerdir**. Örneğin `1` ve `2` düğümleri birbirine komşuysa, `1`'i kopyalarken komşusu `2`'yi kopyalamaya gideriz; `2` ise kendi komşusu olan `1`'i kopyalamaya çalışır.

Bunu çözmek için `oldToNew` adında bir **hash tablosu (`Dictionary<Node, Node>`)** kullanırız:
1. `Dfs(node)` çağrıldığında önce `node`'un `oldToNew` içinde olup olmadığına bakarız. Varsa daha önce oluşturulmuş kopyasını doğrudan döndürürüz.
2. Yoksa `new Node(node.val)` ile kopya düğümü oluşturur ve **komşularını gezmeden hemen önce** `oldToNew[node] = copy` olarak kaydederiz.
3. Ardından `node.neighbors` içindeki her `nei` için `copy.neighbors.Add(Dfs(nei))` çağrısı yaparak bağlantıları kurarız.

Her düğüm tam bir kez oluşturulur ve her kenar sabit sayıda gezilir.

```csharp solution
public class Solution
{
    private class Node
    {
        public int val;
        public List<Node> neighbors = new List<Node>();
        public Node(int val) { this.val = val; }
    }

    public IList<IList<int>> CloneGraph(IList<IList<int>> adjList)
    {
        int n = adjList.Count;
        if (n == 0)
            return new List<IList<int>>();

        // 1. Komşuluk listesinden orijinal graf düğümlerini oluştur
        var nodes = new Node[n];
        for (int i = 0; i < n; i++)
            nodes[i] = new Node(i + 1);

        for (int i = 0; i < n; i++)
        {
            foreach (int neiVal in adjList[i])
                nodes[i].neighbors.Add(nodes[neiVal - 1]);
        }

        // 2. Hash tablosu + DFS ile derin kopya çıkar
        var oldToNew = new Dictionary<Node, Node>();

        Node Dfs(Node node)
        {
            if (oldToNew.TryGetValue(node, out var existing))
                return existing;

            var copy = new Node(node.val);
            oldToNew[node] = copy;

            foreach (var nei in node.neighbors)
                copy.neighbors.Add(Dfs(nei));

            return copy;
        }

        for (int i = 0; i < n; i++)
        {
            if (!oldToNew.ContainsKey(nodes[i]))
                Dfs(nodes[i]);
        }

        // 3. Kopyalanan grafı komşuluk listesine dönüştür
        var result = new List<IList<int>>(n);
        for (int i = 0; i < n; i++)
        {
            var clonedNode = oldToNew[nodes[i]];
            var neighborVals = new List<int>(clonedNode.neighbors.Count);
            foreach (var nei in clonedNode.neighbors)
                neighborVals.Add(nei.val);
            result.Add(neighborVals);
        }

        return result;
    }
}
```

```typescript solution
class GraphNode {
  val: number;
  neighbors: GraphNode[];
  constructor(val: number) {
    this.val = val;
    this.neighbors = [];
  }
}

function cloneGraph(adjList: number[][]): number[][] {
  const n = adjList.length;
  if (n === 0) return [];

  const nodes: GraphNode[] = Array.from({ length: n }, (_, i) => new GraphNode(i + 1));
  for (let i = 0; i < n; i++) {
    for (const neiVal of adjList[i]) {
      nodes[i].neighbors.push(nodes[neiVal - 1]);
    }
  }

  const oldToNew = new Map<GraphNode, GraphNode>();

  function dfs(node: GraphNode): GraphNode {
    const existing = oldToNew.get(node);
    if (existing !== undefined) return existing;

    const copy = new GraphNode(node.val);
    oldToNew.set(node, copy);

    for (const nei of node.neighbors) {
      copy.neighbors.push(dfs(nei));
    }

    return copy;
  }

  for (let i = 0; i < n; i++) {
    if (!oldToNew.has(nodes[i])) {
      dfs(nodes[i]);
    }
  }

  const result: number[][] = [];
  for (let i = 0; i < n; i++) {
    const clonedNode = oldToNew.get(nodes[i])!;
    result.push(clonedNode.neighbors.map((nei) => nei.val));
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(V + E). `V` düğüm sayısı ve `E` kenar sayısı olmak üzere her düğüm bir kez kopyalanır ve her komşuluk bağlantısı sabit kez ziyaret edilir.
- **Alan:** O(V). `oldToNew` sözlüğü `V` adet düğüm eşlemesi tutar ve DFS özyineleme yığını en fazla O(V) derinliğe ulaşır.

## Testler

```json
[
  {
    "args": [[[2, 4], [1, 3], [2, 4], [1, 3]]],
    "expected": [[2, 4], [1, 3], [2, 4], [1, 3]],
    "sample": true
  },
  {
    "args": [[[]]],
    "expected": [[]],
    "sample": true
  },
  {
    "args": [[]],
    "expected": [],
    "sample": true
  },
  {
    "args": [[[2], [1]]],
    "expected": [[2], [1]]
  },
  {
    "args": [[[2, 3], [1, 3], [1, 2]]],
    "expected": [[2, 3], [1, 3], [1, 2]]
  },
  {
    "args": [[[2, 3, 4], [1], [1], [1]]],
    "expected": [[2, 3, 4], [1], [1], [1]]
  },
  {
    "args": [[[2], [1, 3], [2, 4], [3, 5], [4]]],
    "expected": [[2], [1, 3], [2, 4], [3, 5], [4]]
  }
]
```
