---
title: Seyahat Rotasını Oluştur
difficulty: hard
tags: [graf, dfs]
function: findItinerary
params:
  - { name: tickets, type: "List<List<string>>" }
returns: "List<string>"
---

Her biri `[from_i, to_i]` biçiminde bir uçak biletini (kalkış ve varış havalimanlarını) temsil eden `tickets` listesi veriliyor. Bu biletlerin **tamamını birer kez** kullanarak seyahat rotasını yeniden oluşturun ve sırasıyla ziyaret edilen havalimanlarını döndürün.

Tüm seyahatler `"JFK"` havalimanından başlamalıdır. Birden fazla geçerli seyahat rotası varsa, havalimanı kodları yan yana okunduğunda **sözlük sırasına (alfabetik sıraya) göre en küçük** olan rotayı döndürmelisiniz.

- Örneğin `["JFK", "LGA"]` rotası, `"LGA"` kodu `"LGB"` kodundan alfabetik olarak önce geldiği için `["JFK", "LGB"]` rotasından daha küçüktür.

Verilen biletlerle en az bir geçerli seyahat rotası oluşturulabileceği garanti edilmektedir.

### Örnek 1

```text
Girdi:  tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]
Çıktı:  ["JFK","MUC","LHR","SFO","SJC"]
Açıklama: JFK'ten başlayıp tüm biletleri kullanan tek rota JFK -> MUC -> LHR -> SFO -> SJC'dir.
```

### Örnek 2

```text
Girdi:  tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]
Çıktı:  ["JFK","ATL","JFK","SFO","ATL","SFO"]
Açıklama: Bir diğer geçerli rota ["JFK","SFO","ATL","JFK","ATL","SFO"] olsa da alfabetik olarak ["JFK","ATL","JFK","SFO","ATL","SFO"] daha küçüktür.
```

### Kısıtlar

- `1 <= tickets.length <= 300`
- `tickets[i].length == 2`
- `from_i.length == 3`
- `to_i.length == 3`
- `from_i` ve `to_i` büyük İngilizce harflerden oluşur.
- `from_i != to_i`

## İpuçları

- Her bileti yönlü bir kenar olarak düşünürsek, tüm kenarları tam bir kez ziyaret eden bir yol arıyoruz; bu problem graf teorisinde **Euler Yolu (Eulerian Path)** olarak bilinir.
- Alfabetik olarak en küçük rotayı elde etmek için her havalimanından çıkan varış noktalarını sıralamalı ve her zaman mevcut en küçük hedefi önce denemeliyiz.
- En küçük hedefi seçtiğimizde kalan biletleri henüz tüketmeden bir **çıkmaz sokağa** (hiç çıkış bileti kalmayan havalimanına) girebiliriz. Bu çıkmaz havalimanı aslında tüm rotanın **en son** durağı olmalıdır!
- Bir havalimanından gidecek hiçbir bilet kalmadığında o havalimanını sonuca ekleyip (post-order DFS) en sonunda listeyi ters çevirmek (**Hierholzer Algoritması**) geri izleme (backtracking) yapmadan O(E log E) zamanda kesin çözümü verir.

## Çözüm

Problem, yönlü bir grafta `"JFK"` düğümünden başlayan ve tüm kenarları tam birer kez kullanan sözlük sırasına göre en küçük **Euler Yolu**nu bulmaktır. Bunun için **Hierholzer Algoritması** kullanılır.

Önce her kalkış havalimanı için varış noktalarını bir komşuluk listesinde toplarız. Her zaman alfabetik olarak en küçük varış noktasını seçmek istediğimiz ve bir dizinin sonundan eleman silmek (`RemoveAt(Count - 1)` / `pop()`) O(1) sürdüğü için, her komşu listesini **ters alfabetik** sırada sıralarız. Böylece listenin sonundaki eleman her zaman alfabetik olarak en küçük bilet olur.

`"JFK"`'ten başlayarak derinlik öncelikli arama (`Dfs`) yaparız:
1. Bulunduğumuz havalimanından kullanılmamış bilet kaldığı sürece, en küçük varış biletini listeden çıkarıp o havalimanına ilerleriz.
2. Bir havalimanından gidecek hiçbir bilet kalmadığında (çıkmaza girdiğimizde), bu havalimanını `route` listesine ekleriz (post-order).

Geçerli bir Euler yolu garanti edildiğinden, ilk çıkmaza girdiğimiz düğüm aslında tüm yolculuğun **bitiş** havalimanıdır. Geri sararken döngüleri de doğru sırayla eklemiş oluruz. En sonunda `route` listesini ters çevirdiğimizde baştan sona doğru seyahat rotasını elde ederiz.

```csharp solution
public class Solution
{
    public IList<string> FindItinerary(IList<IList<string>> tickets)
    {
        Dictionary<string, List<string>> adj = new Dictionary<string, List<string>>();

        foreach (IList<string> ticket in tickets)
        {
            string from = ticket[0];
            string to = ticket[1];
            if (!adj.TryGetValue(from, out List<string>? list))
            {
                list = new List<string>();
                adj[from] = list;
            }
            list.Add(to);
        }

        // Sondan O(1)'de çekebilmek için hedefleri ters alfabetik sırala.
        foreach (List<string> list in adj.Values)
        {
            list.Sort((a, b) => string.CompareOrdinal(b, a));
        }

        List<string> route = new List<string>();

        void Dfs(string airport)
        {
            if (adj.TryGetValue(airport, out List<string>? dests))
            {
                while (dests.Count > 0)
                {
                    string next = dests[dests.Count - 1];
                    dests.RemoveAt(dests.Count - 1);
                    Dfs(next);
                }
            }
            route.Add(airport);
        }

        Dfs("JFK");
        route.Reverse();
        return route;
    }
}
```

```typescript solution
function findItinerary(tickets: string[][]): string[] {
  const adj = new Map<string, string[]>();

  for (const [from, to] of tickets) {
    let list = adj.get(from);
    if (!list) {
      list = [];
      adj.set(from, list);
    }
    list.push(to);
  }

  for (const list of adj.values()) {
    list.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  }

  const route: string[] = [];

  function dfs(airport: string): void {
    const dests = adj.get(airport);
    while (dests && dests.length > 0) {
      const next = dests.pop()!;
      dfs(next);
    }
    route.push(airport);
  }

  dfs("JFK");
  return route.reverse();
}
```

### Karmaşıklık

- **Zaman:** O(E log E). Burada `E` bilet (kenar) sayısıdır. Komşu listelerinin sıralanması O(E log E) sürer; DFS sırasında her bilet listeden tam bir kez O(1)'de çıkarılır ve ziyaret edilir.
- **Alan:** O(E). Komşuluk listesi, özyineleme çağrı yığını ve sonuç dizisi en fazla `E + 1` eleman tutar.

## Testler

```json
[
  { "args": [[["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]], "expected": ["JFK","MUC","LHR","SFO","SJC"], "sample": true },
  { "args": [[["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]], "expected": ["JFK","ATL","JFK","SFO","ATL","SFO"], "sample": true },
  { "args": [[["JFK","KUL"],["JFK","NRT"],["NRT","JFK"]]], "expected": ["JFK","NRT","JFK","KUL"] },
  { "args": [[["JFK","ATL"]]], "expected": ["JFK","ATL"] },
  { "args": [[["JFK","ATL"],["ATL","JFK"],["JFK","ATL"]]], "expected": ["JFK","ATL","JFK","ATL"] },
  { "args": [[["JFK","AAA"],["AAA","JFK"],["JFK","BBB"],["BBB","JFK"],["JFK","CCC"]]], "expected": ["JFK","AAA","JFK","BBB","JFK","CCC"] },
  { "args": [[["JFK","SFO"],["SFO","ATL"],["ATL","SFO"]]], "expected": ["JFK","SFO","ATL","SFO"] }
]
```
