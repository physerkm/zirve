---
title: K Sıralı Listeyi Birleştir
difficulty: hard
tags: [bagli-liste, heap, ozyineleme]
function: mergeKLists
params:
  - { name: lists, type: "ListNode[]" }
returns: "ListNode"
---
Her biri kendi içinde artan sırada sıralanmış `k` adet bağlı listenin baş düğümlerini içeren `lists` dizisi veriliyor.

Tüm bağlı listeleri **tek bir sıralı bağlı liste** halinde birleştirin ve bu listenin baş düğümünü (`head`) döndürün.

### Örnek 1

```text
Girdi:  lists = [[1, 4, 5], [1, 3, 4], [2, 6]]
Çıktı:  [1, 1, 2, 3, 4, 4, 5, 6]
Açıklama: Bağlı listeler şunlardır:
  1 -> 4 -> 5
  1 -> 3 -> 4
  2 -> 6
Hepsi tek bir sıralı listede birleştirildiğinde:
  1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6 elde edilir.
```

### Örnek 2

```text
Girdi:  lists = []
Çıktı:  []
Açıklama: Hiç liste verilmediği için sonuç boş listedir.
```

### Örnek 3

```text
Girdi:  lists = [[]]
Çıktı:  []
Açıklama: Tek bir boş liste verildiği için sonuç boş listedir.
```

### Kısıtlar

- `k == lists.length`
- `0 <= k <= 10^4`
- `0 <= lists[i].length <= 500`
- `-10^4 <= lists[i][j] <= 10^4`
- `lists[i]` artan sırada sıralanmıştır.
- Tüm listelerdeki toplam düğüm sayısı `10^4`'ü geçmez.

## İpuçları

- İki sıralı bağlı listeyi O(n + m) zamanda nasıl birleştireceğinizi düşünün (kukla düğüm ve iki işaretçi kullanarak).
- Listeleri sırayla tek tek birleştirmek (`lists[0]` ile `lists[1]`, sonra sonucu `lists[2]` ile...) toplamda O(N · k) zaman alır ve yavaş kalır.
- Bunun yerine **Böl ve Yönet (Divide & Conquer)** yaklaşımıyla listeleri ikişerli eşleştirerek birleştirirseniz her turda liste sayısı yarıya iner.
- Alternatif olarak her listenin o anki en küçük düğümünü bir **Min-Heap (Öncelik Kuyruğu)** içinde tutarak her adımda en küçüğü O(log k) sürede çekebilirsiniz.

## Çözüm

Bu problemi O(N · k) yerine **O(N log k)** zamanda çözmenin en zarif ve ek bellek gerektirmeyen yolu **Böl ve Yönet (İkişerli Birleştirme)** tekniğidir.

Listeleri baştan sona birikimli olarak birleştirdiğimizde, ilk listedeki düğümler neredeyse `k` kez tekrar tekrar taranır. Oysa turnuva ağacı gibi listeleri ikişerli eşleştirirsek:
1. İlk turda `(lists[0], lists[1])`, `(lists[2], lists[3])`, ... çiftlerini birleştiririz.
2. İkinci turda oluşan bu yeni listeleri tekrar ikişerli birleştiririz (`interval = 1, 2, 4, 8, ...`).
3. Toplamda yalnızca `⌈log₂ k⌉` birleştirme turu yapılır ve her turda tüm `N` düğüm üzerinden toplamda yalnızca bir kez geçilir.

İki sıralı listeyi birleştiren yardımcı `MergeTwoLists` fonksiyonu ise yeni düğüm oluşturmak yerine mevcut düğümlerin `next` referanslarını bir `dummy` (kukla) düğüm arkasına bağlayarak O(1) ek alanda çalışır.

```csharp solution
public class Solution
{
    public ListNode MergeKLists(ListNode[] lists)
    {
        if (lists == null || lists.Length == 0)
            return null;

        // Listeleri turnuva usulü ikişerli birleştir: adım aralığı 1, 2, 4, 8... diye katlanır.
        int interval = 1;
        while (interval < lists.Length)
        {
            for (int i = 0; i + interval < lists.Length; i += interval * 2)
            {
                lists[i] = MergeTwoLists(lists[i], lists[i + interval]);
            }

            interval *= 2;
        }

        return lists[0];
    }

    private ListNode MergeTwoLists(ListNode l1, ListNode l2)
    {
        ListNode dummy = new ListNode();
        ListNode tail = dummy;

        while (l1 != null && l2 != null)
        {
            if (l1.val <= l2.val)
            {
                tail.next = l1;
                l1 = l1.next;
            }
            else
            {
                tail.next = l2;
                l2 = l2.next;
            }

            tail = tail.next;
        }

        tail.next = l1 ?? l2;
        return dummy.next;
    }
}
```

```typescript solution
function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
  if (lists.length === 0) return null;

  let interval = 1;
  while (interval < lists.length) {
    for (let i = 0; i + interval < lists.length; i += interval * 2) {
      lists[i] = mergeTwoLists(lists[i], lists[i + interval]);
    }
    interval *= 2;
  }

  return lists[0];
}

function mergeTwoLists(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;

  while (l1 !== null && l2 !== null) {
    if (l1.val <= l2.val) {
      tail.next = l1;
      l1 = l1.next;
    } else {
      tail.next = l2;
      l2 = l2.next;
    }
    tail = tail.next;
  }

  tail.next = l1 ?? l2;
  return dummy.next;
}
```

### Karmaşıklık

- **Zaman:** O(N log k). Burada `k` liste sayısı, `N` ise tüm listelerdeki toplam düğüm sayısıdır. Her `interval` turunda liste sayısı yarıya iner (`log₂ k` tur) ve her turda toplamda en fazla `N` düğüm karşılaştırılır.
- **Alan:** O(1). Var olan düğümlerin `next` işaretçileri yerinde yeniden bağlanır ve özyineleme yığını kullanılmaz.

## Testler

```json
[
  { "args": [[[1, 4, 5], [1, 3, 4], [2, 6]]], "expected": [1, 1, 2, 3, 4, 4, 5, 6], "sample": true },
  { "args": [[]], "expected": [], "sample": true },
  { "args": [[[]]], "expected": [], "sample": true },
  { "args": [[[], [1]]], "expected": [1] },
  { "args": [[[5, 10], [1, 2, 3], [4, 8], [0, 9]]], "expected": [0, 1, 2, 3, 4, 5, 8, 9, 10] },
  { "args": [[[-5, 0, 5], [-10, -2, 3], [-3, 1, 4]]], "expected": [-10, -5, -3, -2, 0, 1, 3, 4, 5] },
  { "args": [[[2, 2], [2], [2, 2, 2]]], "expected": [2, 2, 2, 2, 2, 2] },
  { "args": [[[], [], []]], "expected": [] }
]
```
