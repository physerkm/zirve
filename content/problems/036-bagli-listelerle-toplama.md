---
title: Bağlı Listelerle Toplama
difficulty: medium
tags: [bagli-liste, matematik]
function: addTwoNumbers
params:
  - { name: l1, type: "ListNode" }
  - { name: l2, type: "ListNode" }
returns: "ListNode"
---
Negatif olmayan iki tam sayı, boş olmayan iki bağlı listeyle veriliyor. Basamaklar **ters sırada** saklanır: listenin başı birler basamağıdır ve her düğüm tek bir basamak tutar.

İki sayıyı toplayın ve toplamı aynı biçimde (ters sırada, her düğümde bir basamak) bir bağlı liste olarak döndürün.

Sayılar, 0'ın kendisi dışında başta sıfır içermez.

### Örnek 1

```text
Girdi:  l1 = [2, 4, 3], l2 = [5, 6, 4]
Çıktı:  [7, 0, 8]
Açıklama: 342 + 465 = 807
```

### Örnek 2

```text
Girdi:  l1 = [0], l2 = [0]
Çıktı:  [0]
```

### Örnek 3

```text
Girdi:  l1 = [9, 9, 9, 9, 9, 9, 9], l2 = [9, 9, 9, 9]
Çıktı:  [8, 9, 9, 9, 0, 0, 0, 1]
```

### Kısıtlar

- Her listedeki düğüm sayısı `[1, 100]` aralığındadır.
- `0 <= Node.val <= 9`

## İpuçları

- Listeler birler basamağından başlıyor. Kâğıt üzerinde toplama yaparken de sağdan, yani birler basamağından başlarsınız.
- Her adımda iki basamağı ve bir önceki adımdan gelen **eldeyi** toplayın. Toplamın birler basamağı yeni düğüme yazılır, onlar basamağı yeni elde olur.
- Listelerden biri erken biterse onun basamağını 0 sayın. İki liste de bittiğinde elde hâlâ 1 ise bir düğüm daha gerekir.
- Sonuç listesinin ilk düğümünü özel durum yapmamak için başa geçici bir "kukla" düğüm koyabilirsiniz.

## Çözüm

Listeler birler basamağından başladığı için onları baştan sona gezmek, alt alta toplamayı sağdan sola yapmakla aynıdır.

Her adımda üç şeyi toplarız: `l1`'in basamağı, `l2`'nin basamağı ve bir önceki adımdan kalan elde. Toplam en fazla 9 + 9 + 1 = 19 olabilir; birler basamağı (`sum % 10`) yeni düğüme yazılır, geri kalanı (`sum / 10`, yani 0 ya da 1) sonraki adıma elde olarak taşınır.

Döngü koşulu üç durumu birlikte kapsar: listelerden birinde basamak kaldıysa **ya da** yazılmamış bir elde varsa devam ederiz. Biten liste toplama hiçbir şey katmaz; basamağı 0 sayılmış olur. Son eldeyi unutmak (örneğin 5 + 5 = 10) bu sorudaki en yaygın hatadır; koşuldaki `carry != 0` bunu kendiliğinden çözer.

`dummy` düğümü sonucun önünde duran bir yer tutucudur. Onun sayesinde ilk basamağı eklerken "liste boş mu?" diye ayrıca bakmak gerekmez; sonunda `dummy.next` döndürülür.

```csharp solution
public class Solution
{
    public ListNode AddTwoNumbers(ListNode l1, ListNode l2)
    {
        // Listeler birler basamağından başlar; baştan sona gezmek alt alta toplamayı sağdan sola yapmaktır.
        ListNode dummy = new ListNode(); // sonucun önündeki yer tutucu: ilk basamak özel durum olmaz
        ListNode tail = dummy;           // sonucun şimdilik son düğümü
        int carry = 0;

        // Bir listede basamak kaldıkça ya da yazılacak bir elde oldukça devam et.
        while (l1 != null || l2 != null || carry != 0)
        {
            int sum = carry;

            // Biten liste toplama bir şey katmaz; basamağı 0 sayılır.
            if (l1 != null)
            {
                sum += l1.val;
                l1 = l1.next;
            }

            if (l2 != null)
            {
                sum += l2.val;
                l2 = l2.next;
            }

            // sum en fazla 9 + 9 + 1 = 19: birler basamağını yaz, kalanını (0 ya da 1) elde tut.
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
            carry = sum / 10;
        }

        return dummy.next;
    }
}
```

```typescript solution
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  let carry = 0;

  while (l1 !== null || l2 !== null || carry !== 0) {
    let sum = carry;

    if (l1 !== null) {
      sum += l1.val;
      l1 = l1.next;
    }

    if (l2 !== null) {
      sum += l2.val;
      l2 = l2.next;
    }

    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    carry = Math.floor(sum / 10);
  }

  return dummy.next;
}
```

### Karmaşıklık

- **Zaman:** O(max(m, n)). Uzun olan listenin her düğümü bir kez işlenir.
- **Alan:** Döndürülen liste hariç O(1).

Listeleri önce sayıya çevirip toplamak işe yaramaz: 100 basamaklı bir sayı hiçbir tam sayı tipine sığmaz. Basamak basamak toplamak hem taşmayı önler hem de tek geçişte biter.

## Testler

```json
[
  { "args": [[2, 4, 3], [5, 6, 4]], "expected": [7, 0, 8], "sample": true },
  { "args": [[0], [0]], "expected": [0], "sample": true },
  { "args": [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], "expected": [8, 9, 9, 9, 0, 0, 0, 1], "sample": true },
  { "args": [[5], [5]], "expected": [0, 1] },
  { "args": [[1], [9, 9, 9]], "expected": [0, 0, 0, 1] },
  { "args": [[0], [7, 3]], "expected": [7, 3] },
  { "args": [[1, 8], [0]], "expected": [1, 8] },
  { "args": [[2, 4, 9], [5, 6, 4, 9]], "expected": [7, 0, 4, 0, 1] }
]
```
