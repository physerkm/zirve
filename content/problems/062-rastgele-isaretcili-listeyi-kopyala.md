---
title: Rastgele İşaretçili Listeyi Kopyala
difficulty: medium
tags: [bagli-liste, hash-tablosu]
function: copyRandomList
params:
  - { name: nodes, type: "int[][]" }
returns: "int[][]"
---
Her düğümünde `next` işaretçisine ek olarak listedeki herhangi bir düğümü ya da `null`'ı gösterebilen bir `random` işaretçisi bulunan bir bağlı liste veriliyor. Listenin **derin kopyasını (deep copy)** oluşturun: kopya tamamen yeni düğümlerden oluşmalı, `next` ve `random` işaretçileri de **kopyadaki** düğümleri göstermelidir. Kopyadaki hiçbir işaretçi özgün listeye bakmamalıdır.

Liste, düğüm başına bir `[val, randomIndex]` çiftiyle verilir: `randomIndex`, `random`'ın gösterdiği düğümün 0 tabanlı konumudur; `random` `null` ise `-1`'dir. Bu diziden özgün düğümleri kurun, derin kopyayı çıkarın ve **kopyayı aynı biçimde** döndürün.

### Örnek 1

```text
Girdi:  nodes = [[7,-1],[13,0],[11,4],[10,2],[1,0]]
Çıktı:  [[7,-1],[13,0],[11,4],[10,2],[1,0]]
Açıklama: 13'ün random'ı 7'yi (0. düğüm), 11'inki 1'i (4. düğüm) gösterir.
```

### Örnek 2

```text
Girdi:  nodes = [[1,1],[2,1]]
Çıktı:  [[1,1],[2,1]]
```

### Örnek 3

```text
Girdi:  nodes = [[3,-1],[3,0],[3,-1]]
Çıktı:  [[3,-1],[3,0],[3,-1]]
```

### Kısıtlar

- `0 <= n <= 1000`
- `-10^4 <= Node.val <= 10^4`
- `randomIndex`, `-1` ya da `[0, n - 1]` aralığındadır.

## İpuçları

- `next` işaretçilerini kopyalamak kolay. Zorluk, `random`'ın henüz oluşturulmamış bir düğümü gösterebilmesidir.
- "Özgün düğüm → kopyası" eşlemesini tutan bir hash tablosu kullanın. İlk geçişte bütün kopyaları oluşturun, ikinci geçişte işaretçileri bağlayın.
- O(1) ek alan için: her kopyayı özgün düğümün hemen arkasına örün, `random`'ları `orijinal.random.next` ile ayarlayın, sonra iki listeyi ayırın.

## Çözüm

### İki geçiş ve hash tablosu

Önce verilen çiftlerden özgün listeyi kurarız. Ardından:

1. **Birinci geçiş:** Her özgün düğüm için aynı değerli yeni bir düğüm oluşturup `eski → yeni` eşlemesine yazarız.
2. **İkinci geçiş:** Her özgün düğüm için `kopya.next = map[eski.next]` ve `kopya.random = map[eski.random]` atanır. Bütün kopyalar artık var olduğu için `random` hangi düğümü gösterirse göstersin karşılığı bulunur.

Son olarak kopyayı baştan gezip her düğümün `random`'ının kopyada kaçıncı düğüm olduğunu bulmak için bir `düğüm → indeks` eşlemesiyle çıktıyı üretiriz.

```csharp solution
public class Solution
{
    private class Node
    {
        public int val;
        public Node next;
        public Node random;
        public Node(int val) { this.val = val; }
    }

    public int[][] CopyRandomList(int[][] nodes)
    {
        // Verilen çiftlerden özgün listeyi kur.
        var original = new Node[nodes.Length];
        for (var i = 0; i < nodes.Length; i++)
        {
            original[i] = new Node(nodes[i][0]);
        }

        for (var i = 0; i < nodes.Length; i++)
        {
            if (i + 1 < nodes.Length) original[i].next = original[i + 1];
            if (nodes[i][1] >= 0) original[i].random = original[nodes[i][1]];
        }

        var head = nodes.Length > 0 ? original[0] : null;
        var copy = Copy(head);

        // Kopyayı [val, randomIndex] biçimine çevir.
        var indexOf = new Dictionary<Node, int>();
        var list = new List<Node>();
        for (var node = copy; node != null; node = node.next)
        {
            indexOf[node] = list.Count;
            list.Add(node);
        }

        return list.Select(node => new[] { node.val, node.random == null ? -1 : indexOf[node.random] }).ToArray();
    }

    private static Node Copy(Node head)
    {
        var map = new Dictionary<Node, Node>();
        for (var node = head; node != null; node = node.next)
        {
            map[node] = new Node(node.val);
        }

        for (var node = head; node != null; node = node.next)
        {
            map[node].next = node.next == null ? null : map[node.next];
            map[node].random = node.random == null ? null : map[node.random];
        }

        return head == null ? null : map[head];
    }
}
```

```typescript solution
class RandomNode {
  val: number;
  next: RandomNode | null = null;
  random: RandomNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function copy(head: RandomNode | null): RandomNode | null {
  const map = new Map<RandomNode, RandomNode>();
  for (let node = head; node !== null; node = node.next) {
    map.set(node, new RandomNode(node.val));
  }

  for (let node = head; node !== null; node = node.next) {
    const clone = map.get(node)!;
    clone.next = node.next === null ? null : map.get(node.next)!;
    clone.random = node.random === null ? null : map.get(node.random)!;
  }

  return head === null ? null : map.get(head)!;
}

function copyRandomList(nodes: number[][]): number[][] {
  const original = nodes.map(([val]) => new RandomNode(val));
  nodes.forEach(([, randomIndex], i) => {
    if (i + 1 < nodes.length) original[i].next = original[i + 1];
    if (randomIndex >= 0) original[i].random = original[randomIndex];
  });

  const clone = copy(original.length > 0 ? original[0] : null);

  const list: RandomNode[] = [];
  const indexOf = new Map<RandomNode, number>();
  for (let node = clone; node !== null; node = node.next) {
    indexOf.set(node, list.length);
    list.push(node);
  }

  return list.map((node) => [node.val, node.random === null ? -1 : indexOf.get(node.random)!]);
}
```

### Karmaşıklık

- **Zaman:** O(n). Liste sabit sayıda geçişle işlenir.
- **Alan:** O(n). Eşleme tablosu her düğüm için bir kayıt tutar.

Örme yöntemiyle (`A → A' → B → B' → …`) ek alan O(1)'e iner: `A'.random = A.random.next` atanır, sonra iki liste birbirinden ayrılır. Mülakatta önce hash tablosu çözümünü, ardından bu iyileştirmeyi anlatmak iyi bir akıştır.

## Testler

```json
[
  { "args": [[[7, -1], [13, 0], [11, 4], [10, 2], [1, 0]]], "expected": [[7, -1], [13, 0], [11, 4], [10, 2], [1, 0]], "sample": true },
  { "args": [[[1, 1], [2, 1]]], "expected": [[1, 1], [2, 1]], "sample": true },
  { "args": [[[3, -1], [3, 0], [3, -1]]], "expected": [[3, -1], [3, 0], [3, -1]], "sample": true },
  { "args": [[]], "expected": [] },
  { "args": [[[5, 0]]], "expected": [[5, 0]] },
  { "args": [[[1, 3], [2, 3], [3, 3], [4, 3]]], "expected": [[1, 3], [2, 3], [3, 3], [4, 3]] },
  { "args": [[[-10000, 2], [0, -1], [10000, 0]]], "expected": [[-10000, 2], [0, -1], [10000, 0]] }
]
```
