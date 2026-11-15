---
title: Bağlı Listeyi Ters Çevir
difficulty: easy
tags: [bagli-liste, ozyineleme]
function: reverseList
params:
  - { name: head, type: "ListNode" }
returns: "ListNode"
---
Tek yönlü bir bağlı listenin başı `head` veriliyor. Listeyi ters çevirin ve yeni başını döndürün.

### Örnek 1

```text
Girdi:  head = [1, 2, 3, 4, 5]
Çıktı:  [5, 4, 3, 2, 1]
```

### Örnek 2

```text
Girdi:  head = []
Çıktı:  []
```

### Kısıtlar

- Düğüm sayısı `[0, 5000]` aralığındadır.

**Devam sorusu:** Hem döngüyle hem özyinelemeyle çözebilir misiniz?

## İpuçları

- Her düğümün `next` işaretçisini bir önceki düğüme çevirmeniz gerekiyor.
- `next` işaretçisini değiştirdiğiniz anda listenin geri kalanına erişimi kaybedersiniz. Önce onu bir değişkende saklayın.
- Üç işaretçi yeterlidir: önceki, şimdiki ve sonraki.

## Çözüm

Listeyi baştan sona gezerken her düğümün bağlantısını geriye çeviririz. Sıra önemlidir:

1. Sonraki düğümü sakla (bağlantıyı koparmadan önce).
2. Şimdiki düğümün `next` işaretçisini önceki düğüme çevir.
3. Önceki ve şimdiki işaretçileri bir adım ilerlet.

Döngü bittiğinde `previous`, eski listenin son düğümünü, yani yeni listenin başını gösterir.

```csharp solution
public class Solution
{
    public ListNode ReverseList(ListNode head)
    {
        ListNode previous = null;
        var current = head;

        while (current != null)
        {
            var next = current.next;
            current.next = previous;
            previous = current;
            current = next;
        }

        return previous;
    }
}
```

```typescript solution
function reverseList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;

  while (current !== null) {
    const next: ListNode | null = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }

  return previous;
}
```

### Karmaşıklık

- **Zaman:** O(n).
- **Alan:** O(1).

**Özyinelemeli çözüm:** "Listenin geri kalanını ters çevir, sonra bu düğümü sonuna bağla" diye düşünülür: `head.next.next = head; head.next = null`. Zamanı O(n)'dir ama çağrı yığını nedeniyle O(n) alan kullanır; çok uzun listelerde yığın taşmasına yol açabilir. Döngülü çözüm bu yüzden tercih edilir.

## Testler

```json
[
  { "args": [[1, 2, 3, 4, 5]], "expected": [5, 4, 3, 2, 1], "sample": true },
  { "args": [[1, 2]], "expected": [2, 1], "sample": true },
  { "args": [[]], "expected": [], "sample": true },
  { "args": [[7]], "expected": [7] },
  { "args": [[1, 1, 2, 2]], "expected": [2, 2, 1, 1] },
  { "args": [[-3, 0, 3]], "expected": [3, 0, -3] }
]
```
