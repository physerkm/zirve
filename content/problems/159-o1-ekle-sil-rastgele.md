---
title: O(1) Ekle, Sil ve Rastgele Getir
difficulty: medium
tags: [tasarim, hash-tablosu, dizi]
kind: class
class: RandomizedSet
constructor: []
methods:
  - { name: insert, params: [{ name: val, type: "int" }], returns: "bool" }
  - { name: remove, params: [{ name: val, type: "int" }], returns: "bool" }
  - { name: getRandom, params: [], returns: "int" }
---
Bütün işlemleri **ortalama O(1)** zamanda çalışan bir küme tasarlayın.

`RandomizedSet` sınıfını gerçekleştirin:

- `RandomizedSet()` boş bir küme oluşturur.
- `insert(val)` `val` kümede yoksa ekler ve `true` döndürür; varsa `false` döndürür.
- `remove(val)` `val` kümedeyse çıkarır ve `true` döndürür; yoksa `false` döndürür.
- `getRandom()` kümeden **eşit olasılıkla** rastgele bir eleman döndürür. Çağrıldığında kümede en az bir eleman bulunur.

Testlerin belirlenimci olması için `getRandom` yalnızca kümede **tek eleman** varken çağrılır; çözümünüz yine de her durumda eşit olasılıklı seçim yapmalıdır.

### Örnek

```text
İşlemler:  RandomizedSet, insert(1), remove(2), insert(2), remove(1), getRandom(), insert(2), getRandom()
Çıktı:     null,          true,      false,     true,      true,      2,           false,     2
```

### Kısıtlar

- `-2^31 <= val <= 2^31 - 1`
- Toplamda en fazla `2 * 10^5` çağrı yapılır.

## İpuçları

- Hash kümesi ekleme ve silmeyi O(1)'de yapar, ama rastgele bir elemanı O(1)'de veremez.
- Dizi, rastgele indeksle O(1) erişim sağlar; ama ortadan silme O(n)'dir.
- İkisini birlikte kullanın: değerleri bir dizide, her değerin dizideki indeksini bir sözlükte tutun. Silerken elemanı **dizinin son elemanıyla yer değiştirip** sondan silin.

## Çözüm

### Dizi + indeks sözlüğü

- `values`: elemanları tutan dinamik dizi.
- `indexOf`: her değerin `values` içindeki konumu.

`insert`: değer sözlükte yoksa dizinin sonuna eklenir ve indeksi kaydedilir.

`remove`: silinecek değerin indeksi `i` olsun. Dizinin **son** elemanı `i`. konuma taşınır ve sözlükteki indeksi güncellenir; sonra dizinin sonu silinir. Sondan silme O(1)'dir; sıra önemli olmadığı için yer değiştirmek sorun değildir.

`getRandom`: `values[random(0, Count)]`. Dizide boşluk olmadığı için her eleman eşit olasılıklıdır.

```csharp solution
public class RandomizedSet
{
    private readonly List<int> values = new();
    private readonly Dictionary<int, int> indexOf = new();
    private readonly Random random = new();

    public bool Insert(int val)
    {
        if (indexOf.ContainsKey(val))
        {
            return false;
        }

        indexOf[val] = values.Count;
        values.Add(val);
        return true;
    }

    public bool Remove(int val)
    {
        if (!indexOf.TryGetValue(val, out var i))
        {
            return false;
        }

        var last = values[^1];
        values[i] = last;
        indexOf[last] = i;
        values.RemoveAt(values.Count - 1);
        indexOf.Remove(val);
        return true;
    }

    public int GetRandom()
    {
        return values[random.Next(values.Count)];
    }
}
```

```typescript solution
class RandomizedSet {
  private values: number[] = [];
  private indexOf = new Map<number, number>();

  insert(val: number): boolean {
    if (this.indexOf.has(val)) return false;
    this.indexOf.set(val, this.values.length);
    this.values.push(val);
    return true;
  }

  remove(val: number): boolean {
    const i = this.indexOf.get(val);
    if (i === undefined) return false;

    const last = this.values[this.values.length - 1];
    this.values[i] = last;
    this.indexOf.set(last, i);
    this.values.pop();
    this.indexOf.delete(val);
    return true;
  }

  getRandom(): number {
    return this.values[Math.floor(Math.random() * this.values.length)];
  }
}
```

### Karmaşıklık

- **Zaman:** Her işlem ortalama O(1).
- **Alan:** O(n).

`remove`'da sözlükten silme işleminin **en sonda** yapılması önemlidir: silinen değer son elemanın kendisiyse (`last == val`), önce `indexOf[last] = i` yazılır, sonra kayıt silinir ve sözlükte yanlış bir kayıt kalmaz.

## Testler

```json
[
  {
    "ops": ["RandomizedSet", "insert", "remove", "insert", "remove", "getRandom", "insert", "getRandom"],
    "args": [[], [1], [2], [2], [1], [], [2], []],
    "expected": [null, true, false, true, true, 2, false, 2],
    "sample": true
  },
  {
    "ops": ["RandomizedSet", "insert", "insert", "insert", "remove", "remove", "remove", "insert", "getRandom", "remove", "remove"],
    "args": [[], [1], [2], [3], [1], [3], [2], [4], [], [4], [4]],
    "expected": [null, true, true, true, true, true, true, true, 4, true, false]
  },
  {
    "ops": ["RandomizedSet", "insert", "insert", "remove", "getRandom", "insert", "remove", "insert", "remove", "getRandom"],
    "args": [[], [5], [5], [6], [], [-2147483648], [5], [2147483647], [-2147483648], []],
    "expected": [null, true, false, false, 5, true, true, true, true, 2147483647]
  }
]
```
