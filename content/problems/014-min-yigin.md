---
title: Min Yığın
difficulty: medium
tags: [yigin, tasarim]
kind: class
class: MinStack
constructor: []
methods:
  - { name: push, params: [{ name: value, type: "int" }], returns: "void" }
  - { name: pop, params: [], returns: "void" }
  - { name: top, params: [], returns: "int" }
  - { name: getMin, params: [], returns: "int" }
---
Ekleme, çıkarma, tepe elemanı okuma ve **en küçük elemanı okuma** işlemlerinin hepsini sabit zamanda yapan bir yığın (stack) tasarlayın.

`MinStack` sınıfını şu metotlarla gerçekleştirin:

- `MinStack()` boş bir yığın oluşturur.
- `push(value)` değeri yığının tepesine ekler.
- `pop()` tepedeki elemanı çıkarır.
- `top()` tepedeki elemanı döndürür.
- `getMin()` yığındaki en küçük elemanı döndürür.

Her metot **O(1)** zamanda çalışmalıdır.

### Örnek

```text
İşlemler:  MinStack, push(-2), push(0), push(-3), getMin, pop, top, getMin
Çıktı:     null,     null,     null,    null,     -3,     null, 0,  -2
```

### Kısıtlar

- `pop`, `top` ve `getMin` yalnızca yığın boş değilken çağrılır.
- En fazla 3 · 10^4 işlem yapılır.

## İpuçları

- En küçük elemanı tek bir değişkende tutmak yetmez: o eleman yığından çıkınca yeni en küçüğü bilemezsiniz.
- Her elemanla birlikte "bu eleman tepedeyken yığının en küçük değeri neydi?" bilgisini de saklamayı düşünün.

## Çözüm

Zorluk `pop` işlemindedir. En küçük elemanı tek bir değişkende tutarsak, o eleman çıkarıldığında bir önceki en küçüğü bulmak için bütün yığını taramak gerekir.

Çözüm, her elemanla birlikte **o ana kadarki en küçük değeri** de saklamaktır. Yığının her katmanı `(değer, o_katmandaki_min)` çiftini tutar. Yeni eleman eklenirken min değeri, yeni değer ile bir alttaki katmanın min değerinin küçüğüdür. Bir eleman çıkarıldığında alttaki katmanın min değeri zaten doğrudur; hiçbir şeyi yeniden hesaplamak gerekmez.

```csharp solution
public class MinStack
{
    private readonly Stack<(int Value, int Min)> _items = new();

    public MinStack()
    {
    }

    public void Push(int value)
    {
        var min = _items.Count == 0 ? value : Math.Min(value, _items.Peek().Min);
        _items.Push((value, min));
    }

    public void Pop()
    {
        _items.Pop();
    }

    public int Top()
    {
        return _items.Peek().Value;
    }

    public int GetMin()
    {
        return _items.Peek().Min;
    }
}
```

```typescript solution
class MinStack {
  private items: { value: number; min: number }[] = [];

  push(value: number): void {
    const min = this.items.length === 0 ? value : Math.min(value, this.items[this.items.length - 1].min);
    this.items.push({ value, min });
  }

  pop(): void {
    this.items.pop();
  }

  top(): number {
    return this.items[this.items.length - 1].value;
  }

  getMin(): number {
    return this.items[this.items.length - 1].min;
  }
}
```

### Karmaşıklık

- **Zaman:** Bütün işlemler O(1).
- **Alan:** O(n). Her eleman için bir ek sayı saklanır.

**Alternatif:** İkinci bir "min yığını" tutup yalnızca yeni değer mevcut minimumdan küçük ya da ona eşitse oraya eklemek, çoğu girdide daha az bellek kullanır. Eşitlik durumunu atlamak klasik bir hatadır: aynı minimum değer iki kez eklenip bir kez çıkarıldığında min yığını yanlışlıkla boşalır.

## Testler

```json
[
  {
    "ops": ["MinStack", "push", "push", "push", "getMin", "pop", "top", "getMin"],
    "args": [[], [-2], [0], [-3], [], [], [], []],
    "expected": [null, null, null, null, -3, null, 0, -2],
    "sample": true
  },
  {
    "ops": ["MinStack", "push", "push", "getMin", "pop", "getMin", "top"],
    "args": [[], [5], [5], [], [], [], []],
    "expected": [null, null, null, 5, null, 5, 5]
  },
  {
    "ops": ["MinStack", "push", "push", "push", "push", "getMin", "pop", "getMin", "pop", "getMin", "pop", "getMin"],
    "args": [[], [3], [1], [2], [0], [], [], [], [], [], [], []],
    "expected": [null, null, null, null, null, 0, null, 1, null, 1, null, 3]
  },
  {
    "ops": ["MinStack", "push", "top", "getMin", "push", "top", "getMin"],
    "args": [[], [2147483647], [], [], [-2147483648], [], []],
    "expected": [null, null, 2147483647, 2147483647, null, -2147483648, -2147483648]
  }
]
```
