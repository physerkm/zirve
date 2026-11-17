---
title: En Fazla K Aktarmalı En Ucuz Uçuş
difficulty: medium
tags: [graf, dinamik-programlama, bfs]
function: findCheapestPrice
params:
  - { name: n, type: "int" }
  - { name: flights, type: "int[][]" }
  - { name: src, type: "int" }
  - { name: dst, type: "int" }
  - { name: k, type: "int" }
returns: "int"
---

`n` adet şehir bazı uçuşlarla birbirine bağlıdır. Size `flights[i] = [from_i, to_i, price_i]` biçiminde bir dizi veriliyor; bu ifade `from_i` şehrinden `to_i` şehrine `price_i` maliyetle yönlü bir uçuş olduğunu gösterir.

Ayrıca başlangıç şehri `src`, varış şehri `dst` ve en fazla yapılabilecek aktarma sayısı `k` veriliyor. `src` şehrinden `dst` şehrine **en fazla `k` aktarma** (yani en fazla `k + 1` uçuş) kullanarak ulaşılabilecek **en ucuz fiyatı** döndürün. Eğer böyle bir rota yoksa `-1` döndürün.

### Örnek 1

```text
Girdi:  n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1
Çıktı:  700
Açıklama: En fazla 1 aktarma ile 0 -> 1 -> 3 rotası izlenir ve toplam maliyet 100 + 600 = 700 olur. (0 -> 1 -> 2 -> 3 rotası 400 tutar ama 2 aktarma gerektirir.)
```

### Örnek 2

```text
Girdi:  n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1
Çıktı:  200
Açıklama: 1 aktarma ile 0 -> 1 -> 2 rotası toplam 100 + 100 = 200 maliyetlidir.
```

### Örnek 3

```text
Girdi:  n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0
Çıktı:  500
Açıklama: Aktarmasız (k = 0) yalnızca doğrudan 0 -> 2 uçuşu kullanılabilir ve maliyeti 500'dür.
```

### Kısıtlar

- `1 <= n <= 100`
- `0 <= flights.length <= (n * (n - 1) / 2)`
- `flights[i].length == 3`
- `0 <= from_i, to_i < n`
- `from_i != to_i`
- `1 <= price_i <= 10^4`
- İki şehir arasında aynı yönde en fazla bir uçuş bulunur.
- `0 <= src, dst, k < n`
- `src != dst`

## İpuçları

- En fazla `k` aktarma yapmak, başlangıçtan varışa en fazla `k + 1` kenar (uçuş) kullanmak demektir.
- Kenar sayısı kısıtlı en kısa yol problemleri için **Bellman-Ford** algoritması çok doğal bir seçimdir: algoritmanın her turu (iterasyonu), kullanılan uçuş sayısını 1 artırır.
- Aynı tur içinde yeni güncellenen bir şehir fiyatının aynı turdaki başka bir uçuşu etkilememesi için (aksi halde tek turda birden fazla aktarma yapılmış olur), her tur başında mevcut fiyatların bir kopyasını (`tempPrices`) oluşturun.
- `k + 1` tur sonunda `prices[dst]` hala başlangıçtaki sonsuz değerindeyse hedefe ulaşılamamıştır; `-1` döndürün.

## Çözüm

Bu problem, ağırlıklı ve yönlü bir grafta **en fazla `k + 1` kenar** kullanarak `src` düğümünden `dst` düğümüne en kısa yolu bulma problemidir. Standart Dijkstra algoritması yalnızca maliyeti küçültmeye odaklandığı için daha az maliyetli ama çok aktarmalı bir yolu seçip aktarma sınırını aşabilir. Bunun yerine **Bellman-Ford** algoritmasının `k + 1` adımlık versiyonunu kullanırız.

Başlangıçta `src` dışındaki tüm şehirlerin maliyetini sonsuz (`int.MaxValue`), `prices[src]` değerini ise `0` yaparız. Toplam `k + 1` kez (0'dan `k`'ye kadar) tüm uçuşları tararız:

1. Her turun başında `prices` dizisinin bir kopyası olan `tempPrices` dizisini oluştururuz.
2. Her `[u, v, w]` uçuşu için, eğer bir önceki tur sonunda `u` şehrine ulaşmak mümkünse (`prices[u] != int.MaxValue`) ve `prices[u] + w < tempPrices[v]` ise `tempPrices[v]` değerini güncelleriz.
3. Tur bittiğinde `prices = tempPrices` ataması yaparız.

Kopya dizi (`tempPrices`) kullanmak kritik önemdedir: okuma işlemini bir önceki turun `prices` dizisinden, yazma işlemini ise `tempPrices` dizisine yaptığımız için `i`. tur sonunda elde edilen maliyetler **en fazla `i + 1` uçuşla** ulaşılabilecek en ucuz maliyetleri garanti eder.

```csharp solution
public class Solution
{
    public int FindCheapestPrice(int n, int[][] flights, int src, int dst, int k)
    {
        int[] prices = new int[n];
        Array.Fill(prices, int.MaxValue);
        prices[src] = 0;

        for (int i = 0; i <= k; i++)
        {
            int[] tempPrices = (int[])prices.Clone();

            foreach (int[] flight in flights)
            {
                int u = flight[0];
                int v = flight[1];
                int price = flight[2];

                if (prices[u] == int.MaxValue)
                    continue;

                if (prices[u] + price < tempPrices[v])
                    tempPrices[v] = prices[u] + price;
            }

            prices = tempPrices;
        }

        return prices[dst] == int.MaxValue ? -1 : prices[dst];
    }
}
```

```typescript solution
function findCheapestPrice(
  n: number,
  flights: number[][],
  src: number,
  dst: number,
  k: number
): number {
  let prices = new Array<number>(n).fill(Infinity);
  prices[src] = 0;

  for (let i = 0; i <= k; i++) {
    const tempPrices = [...prices];

    for (const [u, v, price] of flights) {
      if (prices[u] === Infinity) continue;

      if (prices[u] + price < tempPrices[v]) {
        tempPrices[v] = prices[u] + price;
      }
    }

    prices = tempPrices;
  }

  return prices[dst] === Infinity ? -1 : prices[dst];
}
```

### Karmaşıklık

- **Zaman:** O((k + 1) · E). Burada `E`, `flights` dizisindeki uçuş sayısıdır. Her biri tüm uçuşları gezen `k + 1` tur çalıştırılır.
- **Alan:** O(n). Şehirlerin maliyetlerini tutan `prices` ve `tempPrices` dizileri için.

## Testler

```json
[
  {
    "args": [4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1],
    "expected": 700,
    "sample": true
  },
  {
    "args": [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1],
    "expected": 200,
    "sample": true
  },
  {
    "args": [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0],
    "expected": 500,
    "sample": true
  },
  {
    "args": [4, [[0, 1, 1], [0, 2, 5], [1, 2, 1], [2, 3, 1]], 0, 3, 1],
    "expected": 6
  },
  {
    "args": [3, [[0, 1, 100], [1, 2, 100]], 0, 2, 0],
    "expected": -1
  },
  {
    "args": [5, [[0, 1, 50], [1, 2, 50], [2, 3, 50], [3, 4, 50], [0, 4, 250]], 0, 4, 2],
    "expected": 250
  },
  {
    "args": [5, [[0, 1, 50], [1, 2, 50], [2, 3, 50], [3, 4, 50], [0, 4, 250]], 0, 4, 3],
    "expected": 200
  }
]
```
