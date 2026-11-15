---
title: Sıralı İki Listeyi Birleştir
difficulty: easy
tags: [bagli-liste]
function: mergeTwoLists
params:
  - { name: list1, type: "ListNode" }
  - { name: list2, type: "ListNode" }
returns: "ListNode"
---
Artan sırada sıralanmış iki bağlı listenin başları `list1` ve `list2` veriliyor. İki listeyi, düğümlerini birbirine bağlayarak **tek bir sıralı liste** halinde birleştirin ve başını döndürün.

### Örnek 1

```text
Girdi:  list1 = [1, 2, 4], list2 = [1, 3, 4]
Çıktı:  [1, 1, 2, 3, 4, 4]
```

### Örnek 2

```text
Girdi:  list1 = [], list2 = [0]
Çıktı:  [0]
```

### Kısıtlar

- Her listedeki düğüm sayısı `[0, 50]` aralığındadır.
- İki liste de artan sıradadır.

## İpuçları

- İki listenin başındaki düğümleri karşılaştırın; küçük olan sonuç listesine eklenir.
- Sonuç listesinin başını özel durum olarak ele almamak için sahte bir **kukla düğümle** başlayın.
- Listelerden biri bittiğinde diğerinin kalanı zaten sıralıdır; olduğu gibi bağlayabilirsiniz.

## Çözüm

Sonuç listesini bir kukla düğümün arkasına kurarız; `tail` her zaman sonuç listesinin son düğümünü gösterir. Her adımda iki listenin başındaki düğümlerden küçüğünü `tail`'in arkasına bağlar ve o listede bir adım ilerleriz.

Listelerden biri tükendiğinde diğerinin kalan kısmı tek bir atamayla bağlanır: zaten sıralıdır ve bütün elemanları sonuçtakilerden büyük ya da onlara eşittir.

```csharp solution
public class Solution
{
    public ListNode MergeTwoLists(ListNode list1, ListNode list2)
    {
        var dummy = new ListNode();
        var tail = dummy;

        while (list1 != null && list2 != null)
        {
            if (list1.val <= list2.val)
            {
                tail.next = list1;
                list1 = list1.next;
            }
            else
            {
                tail.next = list2;
                list2 = list2.next;
            }

            tail = tail.next;
        }

        tail.next = list1 ?? list2;
        return dummy.next;
    }
}
```

```typescript solution
function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }

    tail = tail.next;
  }

  tail.next = list1 ?? list2;
  return dummy.next;
}
```

### Karmaşıklık

- **Zaman:** O(n + m). Her düğüm bir kez ziyaret edilir.
- **Alan:** O(1). Yeni düğüm oluşturulmaz; var olan düğümler yeniden bağlanır.

Kukla düğüm tekniği, başı değişebilen bütün bağlı liste problemlerinde "sonuç listesi boşsa" özel durumunu ortadan kaldırır.

## Testler

```json
[
  { "args": [[1, 2, 4], [1, 3, 4]], "expected": [1, 1, 2, 3, 4, 4], "sample": true },
  { "args": [[], []], "expected": [], "sample": true },
  { "args": [[], [0]], "expected": [0], "sample": true },
  { "args": [[5], [1, 2, 3]], "expected": [1, 2, 3, 5] },
  { "args": [[1, 2, 3], [4, 5, 6]], "expected": [1, 2, 3, 4, 5, 6] },
  { "args": [[-5, 0, 5], [-10, 10]], "expected": [-10, -5, 0, 5, 10] },
  { "args": [[2, 2], [2]], "expected": [2, 2, 2] }
]
```
