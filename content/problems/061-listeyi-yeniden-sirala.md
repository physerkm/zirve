---
title: Listeyi Yeniden Sırala
difficulty: medium
tags: [bagli-liste, iki-isaretci, ozyineleme]
function: reorderList
params:
  - { name: head, type: "ListNode" }
returns: "ListNode"
---
Tek yönlü bir bağlı listenin başı `head` veriliyor. Liste şöyle görünüyor:

```text
L0 → L1 → … → Ln-1 → Ln
```

Listeyi şu düzene getirin:

```text
L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …
```

Düğümlerin **değerlerini değiştiremezsiniz**; yalnızca düğümlerin bağlantılarını değiştirebilirsiniz. Liste yerinde düzenlenmeli ve testlerin sonucu görebilmesi için baş düğüm döndürülmelidir.

### Örnek 1

```text
Girdi:  head = [1, 2, 3, 4]
Çıktı:  [1, 4, 2, 3]
```

### Örnek 2

```text
Girdi:  head = [1, 2, 3, 4, 5]
Çıktı:  [1, 5, 2, 4, 3]
```

### Kısıtlar

- Düğüm sayısı `[1, 5 * 10^4]` aralığındadır.
- `1 <= Node.val <= 1000`

## İpuçları

- Düğümleri bir diziye koyup iki uçtan örmek O(n) ek alanla çalışır. O(1) alanla yapabilir misiniz?
- İstenen düzen, listenin ilk yarısı ile **ters çevrilmiş** ikinci yarısının sırayla örülmesidir.
- Üç adım: yavaş/hızlı işaretçiyle ortayı bul, ikinci yarıyı ters çevir, iki listeyi dönüşümlü birleştir.

## Çözüm

### Ortayı bul, ters çevir, ör

1. **Ortayı bul.** `slow` bir, `fast` iki adım ilerler. `fast` sona varınca `slow` ilk yarının son düğümündedir.
2. **İkinci yarıyı ayır ve ters çevir.** `second = slow.next`, sonra `slow.next = null` ile iki liste birbirinden koparılır. İkinci yarı klasik üç işaretçili yöntemle ters çevrilir.
3. **Ör.** İlk listeden bir, ikinci listeden bir düğüm alarak bağlantılar yeniden kurulur. İlk yarı ikinci yarıdan en fazla bir düğüm uzun olduğu için örme ikinci liste bitince tamamlanır.

```csharp solution
public class Solution
{
    public ListNode ReorderList(ListNode head)
    {
        var slow = head;
        var fast = head;
        while (fast.next != null && fast.next.next != null)
        {
            slow = slow.next;
            fast = fast.next.next;
        }

        ListNode prev = null;
        var current = slow.next;
        slow.next = null;
        while (current != null)
        {
            var next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }

        var first = head;
        var second = prev;
        while (second != null)
        {
            var firstNext = first.next;
            var secondNext = second.next;
            first.next = second;
            second.next = firstNext;
            first = firstNext;
            second = secondNext;
        }

        return head;
    }
}
```

```typescript solution
function reorderList(head: ListNode | null): ListNode | null {
  if (head === null) return head;

  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next!;
    fast = fast.next.next;
  }

  let prev: ListNode | null = null;
  let current = slow.next;
  slow.next = null;
  while (current !== null) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  let first: ListNode | null = head;
  let second = prev;
  while (second !== null) {
    const firstNext: ListNode | null = first!.next;
    const secondNext: ListNode | null = second.next;
    first!.next = second;
    second.next = firstNext;
    first = firstNext;
    second = secondNext;
  }

  return head;
}
```

### Karmaşıklık

- **Zaman:** O(n). Her aşama listeyi en fazla bir kez gezer.
- **Alan:** O(1).

Bu problem üç temel bağlı liste becerisini (orta nokta, ters çevirme, birleştirme) tek soruda toplar; her birini ayrı bir yardımcı fonksiyon gibi düşünmek kodu sadeleştirir.

## Testler

```json
[
  { "args": [[1, 2, 3, 4]], "expected": [1, 4, 2, 3], "sample": true },
  { "args": [[1, 2, 3, 4, 5]], "expected": [1, 5, 2, 4, 3], "sample": true },
  { "args": [[1]], "expected": [1] },
  { "args": [[1, 2]], "expected": [1, 2] },
  { "args": [[1, 2, 3]], "expected": [1, 3, 2] },
  { "args": [[1, 2, 3, 4, 5, 6]], "expected": [1, 6, 2, 5, 3, 4] },
  { "args": [[10, 10, 20, 20, 30]], "expected": [10, 30, 10, 20, 20] }
]
```
