---
title: Ardışık Kart Elleri
difficulty: medium
tags: [acgozlu, hash-tablosu, siralama]
function: isNStraightHand
params:
  - { name: hand, type: "int[]" }
  - { name: groupSize, type: "int" }
returns: "bool"
---
Alice'in elinde bazı kartlar var ve bu kartları her biri `groupSize` büyüklüğünde olan ve **ardışık değerlerden** oluşan gruplara ayırmak istiyor.

Kartların üzerindeki tam sayı değerlerini tutan `hand` dizisi ve grup büyüklüğü `groupSize` verildiğinde, kartların tamamını bu kurala uygun gruplara ayırmak mümkünse `true`, değilse `false` döndürün.

### Örnek 1

```text
Girdi:  hand = [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize = 3
Çıktı:  true
Açıklama: Alice'in eli [1, 2, 3], [2, 3, 4] ve [6, 7, 8] olmak üzere üç ardışık gruba ayrılabilir.
```

### Örnek 2

```text
Girdi:  hand = [1, 2, 3, 4, 5], groupSize = 4
Çıktı:  false
Açıklama: 5 kart 4'erli gruplara tam bölünemediği için gruplandırma yapılamaz.
```

### Örnek 3

```text
Girdi:  hand = [1, 1, 2, 2, 3, 4], groupSize = 3
Çıktı:  false
Açıklama: İlk grup [1, 2, 3] oluşturulduktan sonra geriye [1, 2, 4] kalır; bunlar ardışık değildir.
```

### Kısıtlar

- `1 <= hand.length <= 10^4`
- `0 <= hand[i] <= 10^9`
- `1 <= groupSize <= hand.length`

## İpuçları

- Toplam kart sayısı `groupSize` değerine tam bölünmüyorsa gruplama baştan imkânsızdır.
- Henüz kullanılmamış **en küçük** kartı düşünün: Bu karttan daha küçük bir kart olmadığı için, bu kart mecburen yeni bir ardışık grubun **ilk elemanı** olmak zorundadır.
- Kartları küçükten büyüğe sıralayıp her kartın kaç kez geçtiğini bir sözlükte (`Dictionary` / `Map`) tutun.
- Sıralı dizide ilerlerken adedi sıfırdan büyük olan her `card` için `card, card + 1, ..., card + groupSize - 1` kartlarının hepsinden birer adet eksiltin; herhangi biri yoksa `false` döndürün.

## Çözüm

Öncelikle `hand.Length % groupSize != 0` ise kartlar eşit büyüklükte gruplara hiç ayrılamayacağından doğrudan `false` döneriz.

Açgözlü (greedy) gözlemimiz şudur: Elimizde kalan **en küçük** kart değeri `x` olsun. Elimizde `x - 1` olmadığı için `x` hiçbir grubun ortasında veya sonunda yer alamaz; dolayısıyla `x` kesinlikle `[x, x + 1, ..., x + groupSize - 1]` biçimindeki bir grubun **başlangıcı** olmalıdır.

Bu stratejiyi uygulamak için:
1. `hand` dizisini küçükten büyüğe sıralarız ve her kart değerinin frekansını (kaç adet bulunduğunu) bir `Dictionary<int, int>` tablosuna kaydederiz.
2. Sıralanmış `hand` dizisini baştan sona gezeriz:
   - Eğer mevcut `card` değerinin tablodaki adedi `0` ise, bu kart daha önceki bir grubun parçası olarak tüketilmiştir; `continue` ile atlarız.
   - Eğer adedi `0`'dan büyükse, bu kart kalanların en küçüğüdür ve yeni bir grup başlatır. `card` ile `card + groupSize - 1` arasındaki her `nextCard` değerinin tabloda en az 1 adet bulunup bulunmadığını kontrol ederiz.
   - Herhangi bir `nextCard` yoksa veya adedi `0` ise ardışık grup kurulamaz; `false` döneriz. Varsa hepsinin sayacını 1 azaltırız.
3. Döngü başarıyla tamamlanırsa tüm kartlar geçerli gruplara ayrılmış demektir; `true` döneriz.

```csharp solution
public class Solution
{
    public bool IsNStraightHand(int[] hand, int groupSize)
    {
        if (hand.Length % groupSize != 0)
            return false;

        Array.Sort(hand);
        Dictionary<int, int> count = new Dictionary<int, int>();
        foreach (int card in hand)
        {
            count[card] = count.GetValueOrDefault(card, 0) + 1;
        }

        foreach (int card in hand)
        {
            if (count[card] == 0)
                continue;

            for (int i = 0; i < groupSize; i++)
            {
                int nextCard = card + i;
                if (!count.ContainsKey(nextCard) || count[nextCard] == 0)
                    return false;

                count[nextCard]--;
            }
        }

        return true;
    }
}
```

```typescript solution
function isNStraightHand(hand: number[], groupSize: number): boolean {
  if (hand.length % groupSize !== 0) return false;

  hand.sort((a, b) => a - b);
  const count = new Map<number, number>();
  for (const card of hand) {
    count.set(card, (count.get(card) ?? 0) + 1);
  }

  for (const card of hand) {
    if ((count.get(card) ?? 0) === 0) continue;

    for (let i = 0; i < groupSize; i++) {
      const nextCard = card + i;
      const c = count.get(nextCard) ?? 0;
      if (c === 0) return false;
      count.set(nextCard, c - 1);
    }
  }

  return true;
}
```

### Karmaşıklık

- **Zaman:** O(n log n). `n` kartı sıralamak O(n log n) sürer. Ardından her kart sözlüğe bir kez eklenir ve iç döngüde toplamda tam `n` kez sayaç azaltılır; yani gruplama aşaması O(n) zamanda biter.
- **Alan:** O(n), kartların frekanslarını tutan hash tablosu için.

## Testler

```json
[
  { "args": [[1, 2, 3, 6, 2, 3, 4, 7, 8], 3], "expected": true, "sample": true },
  { "args": [[1, 2, 3, 4, 5], 4], "expected": false, "sample": true },
  { "args": [[1, 1, 2, 2, 3, 4], 3], "expected": false, "sample": true },
  { "args": [[8, 10, 12], 3], "expected": false },
  { "args": [[1, 2, 3, 4, 5, 6], 2], "expected": true },
  { "args": [[1, 1, 2, 2, 3, 3], 3], "expected": true },
  { "args": [[5], 1], "expected": true },
  { "args": [[2, 1], 2], "expected": true }
]
```
