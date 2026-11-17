---
title: K'lı Gruplar Halinde Ters Çevir
difficulty: hard
tags: [bagli-liste, ozyineleme]
function: reverseKGroup
params:
  - { name: head, type: "ListNode" }
  - { name: k, type: "int" }
returns: "ListNode"
---
Bir bağlı listenin başı `head` ve pozitif bir tam sayı `k` veriliyor. Listenin düğümlerini **`k`'şarlı gruplar halinde** ters çevirin ve değiştirilmiş listeyi döndürün.

Düğüm sayısı `k`'nın katı değilse, sonda kalan `k`'dan az düğüm **olduğu gibi** bırakılır. Düğümlerin değerlerini değiştiremezsiniz; yalnızca düğümlerin kendileri yer değiştirebilir.

### Örnek 1

```text
Girdi:  head = [1, 2, 3, 4, 5], k = 2
Çıktı:  [2, 1, 4, 3, 5]
```

### Örnek 2

```text
Girdi:  head = [1, 2, 3, 4, 5], k = 3
Çıktı:  [3, 2, 1, 4, 5]
```

### Kısıtlar

- Düğüm sayısı `n`, `1 <= k <= n <= 5000`
- `0 <= Node.val <= 1000`

**Devam sorusu:** O(1) ek bellekle çözebilir misiniz?

## İpuçları

- Önce tek bir grubu ters çevirmeyi düşünün: grubun öncesindeki düğüm ve sonrasındaki düğüm neden önemli?
- Her gruba başlamadan önce `k` düğüm olup olmadığını kontrol edin. Yoksa iş bitmiştir.
- Bir `dummy` düğümüyle başlayın. `groupPrev` her zaman ters çevrilecek grubun bir öncesini göstersin; grup çevrildikten sonra eski ilk düğüm grubun yeni son düğümü olur.

## Çözüm

### Grup grup yerinde ters çevirme

Listenin önüne bir `dummy` koyarız ve `groupPrev = dummy` ile başlarız. Her turda:

1. `groupPrev`'den `k` adım ilerleyerek grubun son düğümü `kth` bulunur. `k` düğüm kalmamışsa döngü biter.
2. `groupNext = kth.next` saklanır. Grup, klasik ters çevirmeyle çevrilir; ancak `prev` `null` yerine `groupNext` ile başlar. Böylece grubun yeni son düğümü (eski ilk düğüm) otomatik olarak sonraki parçaya bağlanır.
3. `groupPrev.next = kth` ile önceki parça grubun yeni başına bağlanır ve `groupPrev` grubun yeni son düğümüne taşınır.

```csharp solution
public class Solution
{
    public ListNode ReverseKGroup(ListNode head, int k)
    {
        var dummy = new ListNode(0, head);
        var groupPrev = dummy;

        while (true)
        {
            var kth = groupPrev;
            for (var i = 0; i < k && kth != null; i++)
            {
                kth = kth.next;
            }

            if (kth == null)
            {
                break;
            }

            var groupNext = kth.next;
            var prev = groupNext;
            var current = groupPrev.next;
            while (current != groupNext)
            {
                var next = current.next;
                current.next = prev;
                prev = current;
                current = next;
            }

            var firstOfGroup = groupPrev.next;
            groupPrev.next = kth;
            groupPrev = firstOfGroup;
        }

        return dummy.next;
    }
}
```

```typescript solution
function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let groupPrev: ListNode = dummy;

  while (true) {
    let kth: ListNode | null = groupPrev;
    for (let i = 0; i < k && kth !== null; i++) {
      kth = kth.next;
    }

    if (kth === null) {
      break;
    }

    const groupNext: ListNode | null = kth.next;
    let prev: ListNode | null = groupNext;
    let current: ListNode | null = groupPrev.next;
    while (current !== groupNext) {
      const next: ListNode | null = current!.next;
      current!.next = prev;
      prev = current;
      current = next;
    }

    const firstOfGroup = groupPrev.next!;
    groupPrev.next = kth;
    groupPrev = firstOfGroup;
  }

  return dummy.next;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her düğüm bir kez sayılır ve bir kez ters çevrilir.
- **Alan:** O(1). Özyinelemeli çözüm de mümkündür ama O(n / k) çağrı yığını kullanır.

## Testler

```json
[
  { "args": [[1, 2, 3, 4, 5], 2], "expected": [2, 1, 4, 3, 5], "sample": true },
  { "args": [[1, 2, 3, 4, 5], 3], "expected": [3, 2, 1, 4, 5], "sample": true },
  { "args": [[1, 2, 3, 4, 5], 1], "expected": [1, 2, 3, 4, 5] },
  { "args": [[1], 1], "expected": [1] },
  { "args": [[1, 2, 3, 4, 5, 6], 3], "expected": [3, 2, 1, 6, 5, 4] },
  { "args": [[1, 2, 3, 4], 4], "expected": [4, 3, 2, 1] },
  { "args": [[1, 2, 3, 4, 5, 6, 7], 2], "expected": [2, 1, 4, 3, 6, 5, 7] }
]
```
