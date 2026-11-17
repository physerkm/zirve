---
title: Bağlı Listede Döngü
difficulty: easy
tags: [bagli-liste, iki-isaretci, hash-tablosu]
function: hasCycle
params:
  - { name: head, type: "ListNode" }
returns: "bool"
---
Bir bağlı listenin başı `head` veriliyor. Listede bir **döngü** olup olmadığını belirleyin.

Bir düğümün `next` işaretçisini izleyerek aynı düğüme tekrar ulaşılabiliyorsa listede döngü vardır. Testlerde döngü, son düğümün bağlandığı düğümün 0 tabanlı konumu `pos` ile gösterilir (`pos = -1` döngü yok demektir). `pos` fonksiyona parametre olarak **verilmez**.

Döngü varsa `true`, yoksa `false` döndürün.

### Örnek 1

```text
Girdi:  head = [3, 2, 0, -4], pos = 1
Çıktı:  true
Açıklama: Son düğüm (-4), 1. konumdaki düğüme (2) bağlanıyor.
```

### Örnek 2

```text
Girdi:  head = [1, 2], pos = 0
Çıktı:  true
```

### Örnek 3

```text
Girdi:  head = [1], pos = -1
Çıktı:  false
```

### Kısıtlar

- Düğüm sayısı `[0, 10^4]` aralığındadır.
- `-10^5 <= Node.val <= 10^5`
- `pos`, `-1` ya da listede geçerli bir konumdur.

**Devam sorusu:** O(1) ek bellekle çözebilir misiniz?

## İpuçları

- Ziyaret ettiğiniz düğümleri bir kümede saklarsanız, aynı düğüme ikinci kez geldiğinizi anlarsınız. Bu O(n) bellek ister.
- Biri yavaş, biri hızlı iki koşucu düşünün. Döngüsel bir pistte hızlı olan yavaşa ne olur?
- `slow` her adımda bir, `fast` iki düğüm ilerlesin. Döngü varsa buluşurlar; yoksa `fast` listenin sonuna ulaşır.

## Çözüm

### Floyd'un kaplumbağa ve tavşan algoritması

İki işaretçi listenin başından yola çıkar: `slow` her adımda bir, `fast` iki düğüm ilerler.

- Döngü **yoksa** `fast` (ya da `fast.next`) `null`'a ulaşır ve cevap `false` olur.
- Döngü **varsa** iki işaretçi de sonunda döngüye girer. Döngünün içinde `fast`, `slow`'a her adımda bir düğüm yaklaşır; aradaki mesafe her adımda bir azaldığı için atlayıp geçemez ve **mutlaka buluşurlar**.

Karşılaştırma değerlerle değil, düğüm referanslarıyla yapılır: aynı değeri taşıyan farklı düğümler olabilir.

```csharp solution
public class Solution
{
    public bool HasCycle(ListNode head)
    {
        var slow = head;
        var fast = head;

        while (fast != null && fast.next != null)
        {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast)
            {
                return true;
            }
        }

        return false;
    }
}
```

```typescript solution
function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
}
```

### Karmaşıklık

- **Zaman:** O(n). Döngü yoksa `fast` n/2 adımda sona ulaşır; varsa `slow` döngüye girdikten sonra en fazla döngü uzunluğu kadar adımda yakalanır.
- **Alan:** O(1).

Aynı iki işaretçi tekniği "döngünün başladığı düğüm" ve "tekrar eden sayıyı bul" gibi problemlerin de temelidir.

## Testler

```json
[
  { "args": [{ "values": [3, 2, 0, -4], "pos": 1 }], "expected": true, "sample": true },
  { "args": [{ "values": [1, 2], "pos": 0 }], "expected": true, "sample": true },
  { "args": [{ "values": [1], "pos": -1 }], "expected": false, "sample": true },
  { "args": [[]], "expected": false },
  { "args": [[1, 2, 3, 4, 5]], "expected": false },
  { "args": [{ "values": [1], "pos": 0 }], "expected": true },
  { "args": [{ "values": [1, 2, 3, 4, 5, 6], "pos": 5 }], "expected": true },
  { "args": [{ "values": [1, 1, 1, 1], "pos": -1 }], "expected": false },
  { "args": [{ "values": [7, 7, 7, 7, 7, 7, 7], "pos": 2 }], "expected": true }
]
```
