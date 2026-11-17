---
title: Zamana Dayalı Anahtar-Değer Deposu
difficulty: medium
tags: [tasarim, hash-tablosu, ikili-arama, dizgi]
kind: class
class: TimeMap
constructor: []
methods:
  - { name: set, params: [{ name: key, type: "string" }, { name: value, type: "string" }, { name: timestamp, type: "int" }], returns: "void" }
  - { name: get, params: [{ name: key, type: "string" }, { name: timestamp, type: "int" }], returns: "string" }
---
Aynı anahtar için farklı zamanlarda birden fazla değer saklayabilen ve belirli bir andaki değeri okuyabilen bir anahtar-değer deposu tasarlayın.

`TimeMap` sınıfını gerçekleştirin:

- `TimeMap()` boş bir depo oluşturur.
- `set(key, value, timestamp)` anahtarı, verilen zaman damgasındaki değeriyle birlikte saklar.
- `get(key, timestamp)` daha önce `set` ile `timestamp_prev <= timestamp` olacak şekilde saklanmış değerlerden **zaman damgası en büyük olanı** döndürür. Böyle bir değer yoksa `""` döndürür.

`set` çağrılarındaki zaman damgaları **kesin artan** sıradadır.

### Örnek

```text
İşlemler:  TimeMap, set("foo", "bar", 1), get("foo", 1), get("foo", 3), set("foo", "bar2", 4), get("foo", 4), get("foo", 5)
Çıktı:     null,    null,               "bar",         "bar",         null,                 "bar2",        "bar2"
Açıklama:  3 anında "foo" için saklanmış en son değer 1 anındaki "bar"dır.
```

### Kısıtlar

- `1 <= key.length, value.length <= 100`
- `key` ve `value` küçük harf ve rakamlardan oluşur.
- `1 <= timestamp <= 10^7`
- `set` çağrılarındaki zaman damgaları kesin artan sıradadır.
- `set` ve `get` toplamda en fazla `2 * 10^5` kez çağrılır.

## İpuçları

- Her anahtar için `(zaman, değer)` çiftlerinden oluşan bir liste tutun.
- Zaman damgaları artan sırada geldiği için bu liste **kendiliğinden sıralıdır**.
- `get` için listede `timestamp`'ten büyük olmayan en büyük zamanı ikili aramayla bulun.

## Çözüm

### Anahtar başına sıralı liste ve ikili arama

Hash tablosu her anahtarı kendi `(zaman, değer)` listesine eşler. `set` yalnızca listenin sonuna ekler: zaman damgaları artan geldiği için liste sıralı kalır ve ekleme O(1) olur.

`get(key, t)` için listede `zaman <= t` koşulunu sağlayan **son** elemanı ararız. İkili aramada `lo = 0`, `hi = n - 1`; `zaman[mid] <= t` ise `mid` bir aday olur ve daha sağa bakılır, değilse sola gidilir. Hiç aday bulunmazsa (bütün kayıtlar `t`'den sonraysa ya da anahtar hiç yoksa) `""` döner.

```csharp solution
public class TimeMap
{
    private readonly Dictionary<string, List<(int Time, string Value)>> store = new();

    public void Set(string key, string value, int timestamp)
    {
        if (!store.TryGetValue(key, out var list))
        {
            list = new List<(int Time, string Value)>();
            store[key] = list;
        }

        list.Add((timestamp, value));
    }

    public string Get(string key, int timestamp)
    {
        if (!store.TryGetValue(key, out var list))
        {
            return "";
        }

        var lo = 0;
        var hi = list.Count - 1;
        var answer = "";

        while (lo <= hi)
        {
            var mid = lo + (hi - lo) / 2;
            if (list[mid].Time <= timestamp)
            {
                answer = list[mid].Value;
                lo = mid + 1;
            }
            else
            {
                hi = mid - 1;
            }
        }

        return answer;
    }
}
```

```typescript solution
class TimeMap {
  private store = new Map<string, [number, string][]>();

  set(key: string, value: string, timestamp: number): void {
    let list = this.store.get(key);
    if (list === undefined) {
      list = [];
      this.store.set(key, list);
    }

    list.push([timestamp, value]);
  }

  get(key: string, timestamp: number): string {
    const list = this.store.get(key);
    if (list === undefined) {
      return "";
    }

    let lo = 0;
    let hi = list.length - 1;
    let answer = "";

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (list[mid][0] <= timestamp) {
        answer = list[mid][1];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return answer;
  }
}
```

### Karmaşıklık

- **Zaman:** `set` O(1), `get` O(log m); `m` o anahtarın kayıt sayısıdır.
- **Alan:** O(toplam `set` sayısı).

Zaman damgaları sıralı gelmeseydi `set` için sıralı bir yapı (örneğin C#'ta `SortedList`) gerekirdi. Mülakatta bu varsayımın nereden geldiğini söylemek iyi bir sinyaldir.

## Testler

```json
[
  {
    "ops": ["TimeMap", "set", "get", "get", "set", "get", "get"],
    "args": [[], ["foo", "bar", 1], ["foo", 1], ["foo", 3], ["foo", "bar2", 4], ["foo", 4], ["foo", 5]],
    "expected": [null, null, "bar", "bar", null, "bar2", "bar2"],
    "sample": true
  },
  {
    "ops": ["TimeMap", "get", "set", "get", "get"],
    "args": [[], ["a", 1], ["a", "x", 5], ["a", 4], ["a", 5]],
    "expected": [null, "", null, "", "x"]
  },
  {
    "ops": ["TimeMap", "set", "set", "set", "get", "get", "get", "get", "get"],
    "args": [[], ["love", "high", 10], ["love", "low", 20], ["k", "v", 15], ["love", 5], ["love", 10], ["love", 15], ["k", 100], ["love", 25]],
    "expected": [null, null, null, null, "", "high", "high", "v", "low"]
  },
  {
    "ops": ["TimeMap", "set", "set", "set", "set", "get", "get", "get", "get", "get"],
    "args": [[], ["s", "a", 1], ["s", "b", 2], ["s", "c", 3], ["s", "d", 4], ["s", 1], ["s", 2], ["s", 3], ["s", 10000000], ["t", 3]],
    "expected": [null, null, null, null, null, "a", "b", "c", "d", ""]
  }
]
```
