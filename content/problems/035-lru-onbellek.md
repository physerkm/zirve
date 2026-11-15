---
title: LRU Önbellek
difficulty: medium
tags: [tasarim, hash-tablosu, bagli-liste]
kind: class
class: LRUCache
constructor:
  - { name: capacity, type: "int" }
methods:
  - { name: get, params: [{ name: key, type: "int" }], returns: "int" }
  - { name: put, params: [{ name: key, type: "int" }, { name: value, type: "int" }], returns: "void" }
---
**En uzun süredir kullanılmayanı** (Least Recently Used, LRU) çıkaran, sabit kapasiteli bir önbellek tasarlayın.

`LRUCache` sınıfını şu metotlarla gerçekleştirin:

- `LRUCache(capacity)` önbelleği pozitif bir kapasiteyle oluşturur.
- `get(key)` anahtar varsa değerini, yoksa `-1` döndürür.
- `put(key, value)` anahtar varsa değerini günceller; yoksa çifti ekler. Ekleme sonucunda eleman sayısı kapasiteyi aşarsa, **en uzun süredir kullanılmayan** anahtar çıkarılır.

Hem `get` hem `put` bir anahtarı "kullanılmış" sayar. İki metot da ortalama **O(1)** zamanda çalışmalıdır.

### Örnek

```text
İşlemler:  LRUCache(2), put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4)
Çıktı:     null,        null,      null,      1,      null,      -1,     null,      -1,     3,      4

Açıklama:
  put(3, 3)  -> kapasite doldu; en eski kullanılan 2 çıkarılır (1 az önce okunmuştu).
  put(4, 4)  -> en eski kullanılan 1 çıkarılır.
```

### Kısıtlar

- `1 <= capacity <= 3000`
- En fazla 2 · 10^5 işlem yapılır.

## İpuçları

- Anahtara göre O(1) erişim için hash tablosu gerekir. Ama hash tablosu "en eski kullanılan hangisi?" sorusunu yanıtlayamaz.
- Kullanım sırasını tutan ve bir elemanı **ortadan çıkarıp başa taşımayı** O(1)'de yapan veri yapısı hangisidir?
- Hash tablosu + çift yönlü bağlı liste: tablo, anahtardan liste düğümüne gider; liste kullanım sırasını tutar.

## Çözüm

İki gereksinim vardır ve tek bir veri yapısı ikisini birden karşılamaz:

1. **Anahtara göre O(1) erişim** → hash tablosu.
2. **Kullanım sırasını O(1)'de güncellemek** (bir elemanı en yeniye taşımak, en eskiyi çıkarmak) → çift yönlü bağlı liste.

İkisini birleştiririz: liste, elemanları en yeni kullanılandan en eskiye doğru tutar; hash tablosu her anahtarı listedeki **düğümüne** eşler. Düğüme doğrudan eriştiğimiz için onu listeden koparıp başa taşımak sabit zamanlıdır.

- `get`: düğümü bul, başa taşı, değeri döndür.
- `put`: anahtar varsa değeri güncelle ve başa taşı. Yoksa başa yeni düğüm ekle; kapasite aşıldıysa listenin **sonundaki** düğümü hem listeden hem tablodan çıkar.

C# çözümü hazır `LinkedList<T>` sınıfını kullanır. TypeScript çözümü, `Map`'in **ekleme sırasını koruma** özelliğinden yararlanır: bir anahtarı silip yeniden eklemek onu sıranın sonuna (en yeni) taşır; `keys().next()` ise en eski anahtarı verir.

```csharp solution
public class LRUCache
{
    private readonly int _capacity;
    private readonly Dictionary<int, LinkedListNode<(int Key, int Value)>> _nodes = new();
    private readonly LinkedList<(int Key, int Value)> _order = new();   // baş: en yeni, son: en eski

    public LRUCache(int capacity)
    {
        _capacity = capacity;
    }

    public int Get(int key)
    {
        if (!_nodes.TryGetValue(key, out var node)) return -1;

        _order.Remove(node);
        _order.AddFirst(node);
        return node.Value.Value;
    }

    public void Put(int key, int value)
    {
        if (_nodes.TryGetValue(key, out var existing))
        {
            _order.Remove(existing);
        }
        else if (_nodes.Count == _capacity)
        {
            var oldest = _order.Last;
            _order.RemoveLast();
            _nodes.Remove(oldest.Value.Key);
        }

        _nodes[key] = _order.AddFirst((key, value));
    }
}
```

```typescript solution
class LRUCache {
  private readonly capacity: number;
  private readonly entries = new Map<number, number>();   // ekleme sırası: en eski -> en yeni

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    const value = this.entries.get(key);
    if (value === undefined) return -1;

    // Silip yeniden eklemek anahtarı "en yeni" konumuna taşır.
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  put(key: number, value: number): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size === this.capacity) {
      const oldest = this.entries.keys().next().value as number;
      this.entries.delete(oldest);
    }

    this.entries.set(key, value);
  }
}
```

### Karmaşıklık

- **Zaman:** `get` ve `put` O(1).
- **Alan:** O(capacity).

Mülakatta çoğu zaman hazır `LinkedList` ya da `Map` hilesi yerine çift yönlü bağlı listeyi **kendiniz** yazmanız istenir. O durumda başa ve sona birer kukla düğüm koymak, "liste boş" ve "tek eleman" özel durumlarını ortadan kaldırır.

## Testler

```json
[
  {
    "ops": ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"],
    "args": [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]],
    "expected": [null, null, null, 1, null, -1, null, -1, 3, 4],
    "sample": true
  },
  {
    "ops": ["LRUCache", "put", "get", "put", "get", "get"],
    "args": [[1], [2, 1], [2], [3, 2], [2], [3]],
    "expected": [null, null, 1, null, -1, 2]
  },
  {
    "ops": ["LRUCache", "put", "put", "put", "get", "put", "get", "get"],
    "args": [[2], [1, 1], [2, 2], [1, 10], [1], [3, 3], [2], [1]],
    "expected": [null, null, null, null, 10, null, -1, 10]
  },
  {
    "ops": ["LRUCache", "get", "put", "get", "put", "put", "get", "get"],
    "args": [[2], [2], [2, 6], [1], [1, 5], [1, 2], [1], [2]],
    "expected": [null, -1, null, -1, null, null, 2, 6]
  },
  {
    "ops": ["LRUCache", "put", "put", "put", "put", "get", "get", "get", "get"],
    "args": [[3], [1, 1], [2, 2], [3, 3], [4, 4], [4], [3], [2], [1]],
    "expected": [null, null, null, null, null, 4, 3, 2, -1]
  }
]
```
