---
title: Bağlı Liste, Yığın ve Kuyruk
summary: Üç temel doğrusal yapı. Bağlı listede işaretçi teknikleri, yığının (stack) çözdüğü problem türleri, kuyruk ve monoton yığın kalıbı.
minutes: 15
level: intermediate
---

## Bağlı liste

Bağlı listede her düğüm bir değer ve **sonraki düğüme işaretçi** tutar. Elemanlar bellekte yan yana durmaz; bu yüzden indeksle erişim yoktur, ama konumu bilinen bir yere ekleme ve silme sabit zamanlıdır.

| İşlem | Dizi | Bağlı liste |
| --- | --- | --- |
| İndeksle erişim | O(1) | O(n) |
| Başa ekleme / silme | O(n) | O(1) |
| Bilinen düğümden sonra ekleme / silme | O(n) | O(1) |
| Arama | O(n) | O(n) |

Mülakat sorularında liste genellikle şöyle tanımlanır:

```csharp
public class ListNode
{
    public int val;
    public ListNode next;
}
```

Bağlı liste problemleri algoritma bilgisinden çok **işaretçi yönetimi** ölçer. Dört teknik neredeyse hepsini çözer.

### 1. Kukla (dummy) baş düğümü

Listenin başı değişebiliyorsa (silme, birleştirme), başa sahte bir düğüm koymak "liste boşsa", "ilk düğüm siliniyorsa" gibi özel durumları ortadan kaldırır.

```csharp
ListNode MergeSorted(ListNode a, ListNode b)
{
    var dummy = new ListNode();
    var tail = dummy;

    while (a != null && b != null)
    {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }

    tail.next = a ?? b;       // kalan kısmı olduğu gibi bağla
    return dummy.next;
}
```

### 2. Yerinde ters çevirme

Üç işaretçi yeter: önceki, şimdiki, sonraki. Bağlantıyı koparmadan **önce** sonraki düğümü saklamak şarttır.

```typescript
function reverse(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;

  while (current !== null) {
    const next = current.next;   // 1. sonrakini sakla
    current.next = previous;     // 2. bağlantıyı çevir
    previous = current;          // 3. ilerle
    current = next;
  }

  return previous;
}
```

### 3. Hızlı ve yavaş işaretçi

Biri tek, diğeri çift adım atar. Hızlı işaretçi sona vardığında yavaş olan **ortadadır**. Listede **döngü** varsa hızlı işaretçi yavaşı mutlaka yakalar (Floyd algoritması); döngü yoksa hızlı işaretçi `null`'a ulaşır. İkisi de O(1) ek alan kullanır.

### 4. Aralarında sabit mesafe olan iki işaretçi

"Sondan `n`. düğümü sil": ilk işaretçiyi `n` adım öne alın, sonra ikisini birlikte ilerletin. Öndeki sona vardığında arkadaki, silinecek düğümün hemen öncesindedir. Listeyi iki kez gezmek gerekmez.

Bağlı liste sorularında hata yapmamanın en iyi yolu, üç dört düğümlük küçük bir örneği **çizip** işaretçileri adım adım güncellemektir.

## Yığın (stack)

Yığın **son giren ilk çıkar** (LIFO) ilkesiyle çalışır: ekleme (`push`), çıkarma (`pop`) ve tepeye bakma (`peek`) O(1)'dir.

| | Tip | Ekle / çıkar / bak |
| --- | --- | --- |
| C# | `Stack<T>` | `Push` / `Pop` / `Peek` |
| JavaScript | `Array` | `push` / `pop` / `at(-1)` |

Yığını şu durumlarda düşünün:

- **En son açılanın ilk kapanması gereken** her şey: parantez eşleştirme, iç içe yapılar, ifade değerlendirme.
- **Geri alma** ve geçmişe dönme.
- **Özyinelemeyi döngüye çevirme:** derinlik öncelikli arama (DFS) kendi yığınınızla yazılabilir; çok derin girdilerde çağrı yığınının taşmasını önler.

```typescript
function isBalanced(text: string): boolean {
  const closing: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];

  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (ch in closing) {
      if (stack.pop() !== closing[ch]) return false;
    }
  }

  return stack.length === 0;   // açık kalan parantez olmamalı
}
```

### Monoton yığın

"Her eleman için **sağındaki ilk daha büyük** elemanı bul" türü sorular kaba kuvvetle O(n²)'dir. Monoton yığın bunu O(n)'e indirir: yığında, yanıtını henüz bulamamış elemanların indeksleri **azalan** sırada bekler. Yeni gelen eleman, tepedekilerden büyükse onların aradığı yanıttır.

```csharp
// Her gün için, daha sıcak bir güne kaç gün kaldığını döndürür.
int[] DailyTemperatures(int[] temps)
{
    var answer = new int[temps.Length];
    var waiting = new Stack<int>();           // yanıt bekleyen günlerin indeksleri

    for (var day = 0; day < temps.Length; day++)
    {
        while (waiting.Count > 0 && temps[day] > temps[waiting.Peek()])
        {
            var earlier = waiting.Pop();
            answer[earlier] = day - earlier;
        }

        waiting.Push(day);
    }

    return answer;
}
```

Her indeks yığına bir kez girer ve en fazla bir kez çıkar; iç `while` döngüsüne rağmen toplam O(n)'dir.

## Kuyruk (queue)

Kuyruk **ilk giren ilk çıkar** (FIFO) ilkesiyle çalışır. En önemli kullanım yeri **genişlik öncelikli aramadır** (BFS): bir düğümün komşuları kuyruğa eklenir ve düğümler eklendikleri sırayla işlenir; böylece katman katman ilerlenir.

| | Tip | Not |
| --- | --- | --- |
| C# | `Queue<T>` | `Enqueue` / `Dequeue`, ikisi de O(1) |
| JavaScript | `Array` | `shift()` **O(n)**'dir |

JavaScript'te `array.shift()` her çağrıda bütün elemanları kaydırır. Büyük girdilerde kuyruk olarak dizi kullanacaksanız elemanları silmek yerine bir **baş indeksi** tutun:

```typescript
const queue: number[] = [start];
for (let head = 0; head < queue.length; head++) {
  const node = queue[head];
  // ... komşuları queue.push(...) ile ekle
}
```

İki uçtan da ekleme ve çıkarma yapılabilen yapıya **deque** denir (C#'ta `LinkedList<T>` bu iş için kullanılabilir). Kayan pencerede en büyük elemanı O(n)'de bulmak için kullanılan monoton kuyruk bir deque üzerine kurulur.

## Özet

- Bağlı liste: O(1) ekleme/silme, O(n) erişim. Kukla düğüm, ters çevirme, hızlı–yavaş ve aralıklı iki işaretçi tekniklerini bilin.
- Yığın: iç içe yapılar, eşleştirme, DFS. Monoton yığın "sonraki daha büyük eleman" sorularını O(n)'de çözer.
- Kuyruk: BFS ve sırayla işleme. JavaScript'te `shift()` maliyetine dikkat edin.
