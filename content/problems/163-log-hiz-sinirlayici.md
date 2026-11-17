---
title: Log Hız Sınırlayıcı
difficulty: easy
tags: [tasarim, hash-tablosu, dizgi]
kind: class
class: Logger
constructor: []
methods:
  - { name: shouldPrintMessage, params: [{ name: timestamp, type: "int" }, { name: message, type: "string" }], returns: "bool" }
---
Mesaj akışını alan ve **aynı mesajın** en fazla **10 saniyede bir** yazdırılmasına izin veren bir log sistemi tasarlayın. `t` anında yazdırılan bir mesaj, `t + 10` anına kadar tekrar yazdırılmamalıdır.

Mesajlar zaman sırasıyla gelir; birden fazla mesaj aynı anda gelebilir.

`Logger` sınıfını gerçekleştirin:

- `Logger()` nesneyi oluşturur.
- `shouldPrintMessage(timestamp, message)` mesaj bu anda yazdırılmalıysa `true`, değilse `false` döndürür.

### Örnek

```text
İşlemler:  Logger, (1, "foo"), (2, "bar"), (3, "foo"), (8, "bar"), (10, "foo"), (11, "foo")
Çıktı:     null,   true,       true,       false,      false,      false,       true
Açıklama:  "foo" 1'de yazıldı; bir sonraki izin 11'de.
```

### Kısıtlar

- `0 <= timestamp <= 10^9`
- Zaman damgaları azalmayan sıradadır.
- `1 <= message.length <= 30`
- En fazla `10^4` çağrı yapılır.

## İpuçları

- Her mesaj için yalnızca bir bilgi gerekir: bir sonraki yazdırılabileceği an.
- Hash tablosunda `mesaj → izin verilen en erken zaman` tutun.

## Çözüm

### Mesaj başına bir sonraki izin zamanı

Sözlük her mesajın bir sonraki **yazdırılabileceği en erken anı** tutar. Gelen mesaj sözlükte yoksa ya da `timestamp` bu ana ulaştıysa mesaj yazdırılır ve izin zamanı `timestamp + 10` olarak güncellenir. Aksi halde `false` döner ve sözlük değişmez; reddedilen mesaj bekleme süresini uzatmaz.

```csharp solution
public class Logger
{
    private readonly Dictionary<string, int> nextAllowed = new();

    public bool ShouldPrintMessage(int timestamp, string message)
    {
        if (nextAllowed.TryGetValue(message, out var allowedAt) && timestamp < allowedAt)
        {
            return false;
        }

        nextAllowed[message] = timestamp + 10;
        return true;
    }
}
```

```typescript solution
class Logger {
  private nextAllowed = new Map<string, number>();

  shouldPrintMessage(timestamp: number, message: string): boolean {
    const allowedAt = this.nextAllowed.get(message);
    if (allowedAt !== undefined && timestamp < allowedAt) {
      return false;
    }

    this.nextAllowed.set(message, timestamp + 10);
    return true;
  }
}
```

### Karmaşıklık

- **Zaman:** O(1) (mesaj uzunluğu kadar özetleme hariç).
- **Alan:** O(farklı mesaj sayısı).

Bellek sınırsız büyümesin istenirse, son 10 saniyede görülmeyen mesajlar bir kuyrukla ya da periyodik temizlikle sözlükten atılabilir; mülakatlarda bu iyileştirme genellikle devam sorusu olarak gelir.

## Testler

```json
[
  {
    "ops": ["Logger", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage"],
    "args": [[], [1, "foo"], [2, "bar"], [3, "foo"], [8, "bar"], [10, "foo"], [11, "foo"]],
    "expected": [null, true, true, false, false, false, true],
    "sample": true
  },
  {
    "ops": ["Logger", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage"],
    "args": [[], [0, "a"], [10, "a"], [19, "a"]],
    "expected": [null, true, true, false]
  },
  {
    "ops": ["Logger", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage", "shouldPrintMessage"],
    "args": [[], [5, "x"], [5, "y"], [5, "x"], [15, "y"]],
    "expected": [null, true, true, false, true]
  }
]
```
