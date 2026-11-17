---
title: Sondan N. Düğümü Sil
difficulty: medium
tags: [bagli-liste, iki-isaretci]
function: removeNthFromEnd
params:
  - { name: head, type: "ListNode" }
  - { name: n, type: "int" }
returns: "ListNode"
---
Bir bağlı listenin başı `head` veriliyor. Listenin **sonundan** `n`. düğümü silin ve listenin başını döndürün.

### Örnek 1

```text
Girdi:  head = [1, 2, 3, 4, 5], n = 2
Çıktı:  [1, 2, 3, 5]
Açıklama: Sondan 2. düğüm 4'tür.
```

### Örnek 2

```text
Girdi:  head = [1], n = 1
Çıktı:  []
```

### Örnek 3

```text
Girdi:  head = [1, 2], n = 1
Çıktı:  [1]
```

### Kısıtlar

- Düğüm sayısı `sz`, `1 <= sz <= 30`
- `0 <= Node.val <= 100`
- `1 <= n <= sz`

**Devam sorusu:** Listeyi tek geçişte işleyebilir misiniz?

## İpuçları

- İki geçişle kolay: önce uzunluğu bulun, sonra baştan `uzunluk - n`. düğüme gidin.
- Tek geçiş için iki işaretçi arasında **sabit bir mesafe** bırakın. Öndeki sona vardığında arkadaki nerede olur?
- Baş düğümün silinmesi özel bir durum gibi görünür. Listenin önüne sahte bir düğüm (dummy) koyarsanız bu durum ortadan kalkar.

## Çözüm

### Arada n boşluk olan iki işaretçi

Listenin başına bir `dummy` düğümü ekleriz; böylece silinecek düğüm baş düğüm olsa bile "silinecek düğümün bir öncesi" her zaman vardır.

`fast` işaretçisi önce `n + 1` adım öne geçer. Sonra `slow` ve `fast` birlikte ilerler. `fast` listenin sonunu (`null`) geçtiğinde, `slow` silinecek düğümün **hemen öncesindedir**: aralarında tam `n` düğüm vardır. `slow.next = slow.next.next` ile düğüm atlanır.

```csharp solution
public class Solution
{
    public ListNode RemoveNthFromEnd(ListNode head, int n)
    {
        var dummy = new ListNode(0, head);
        var slow = dummy;
        var fast = dummy;

        for (var i = 0; i <= n; i++)
        {
            fast = fast.next;
        }

        while (fast != null)
        {
            slow = slow.next;
            fast = fast.next;
        }

        slow.next = slow.next.next;
        return dummy.next;
    }
}
```

```typescript solution
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let slow: ListNode = dummy;
  let fast: ListNode | null = dummy;

  for (let i = 0; i <= n; i++) {
    fast = fast!.next;
  }

  while (fast !== null) {
    slow = slow.next!;
    fast = fast.next;
  }

  slow.next = slow.next!.next;
  return dummy.next;
}
```

### Karmaşıklık

- **Zaman:** O(sz). Liste bir kez gezilir.
- **Alan:** O(1).

`dummy` düğümü bağlı liste problemlerinde baş düğümü değiştirebilen her işlemde (silme, ekleme, birleştirme) özel durumları ortadan kaldırmanın standart yoludur.

## Testler

```json
[
  { "args": [[1, 2, 3, 4, 5], 2], "expected": [1, 2, 3, 5], "sample": true },
  { "args": [[1], 1], "expected": [], "sample": true },
  { "args": [[1, 2], 1], "expected": [1], "sample": true },
  { "args": [[1, 2], 2], "expected": [2] },
  { "args": [[1, 2, 3], 3], "expected": [2, 3] },
  { "args": [[10, 20, 30, 40], 1], "expected": [10, 20, 30] },
  { "args": [[5, 6, 7, 8, 9], 3], "expected": [5, 6, 8, 9] }
]
```
