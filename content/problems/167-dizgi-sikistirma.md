---
title: Dizgi Sıkıştırma
difficulty: medium
tags: [iki-isaretci, dizgi]
function: compress
params:
  - { name: chars, type: "char[]" }
returns: "char[]"
---
Bir karakter dizisi `chars` veriliyor. Aşağıdaki algoritmayı kullanarak diziyi sıkıştırın:

Boş bir dizgi `s` ile başlayın. `chars` içindeki **ardışık tekrar eden her karakter grubu** için:
- Grubun uzunluğu `1` ise `s`'ye yalnızca karakteri ekleyin.
- Aksi halde karakterin ardından grubun uzunluğunu ekleyin (`10` veya daha uzun grup uzunlukları, `"1"`, `"2"` gibi birden fazla basamak karakterine bölünerek yazılır).

Sıkıştırılmış karakterleri yeni bir dizi açmak yerine giriş dizisi `chars` üzerine **yerinde (in-place)** yazın ve yalnızca **O(1)** ek bellek kullanın. Yazma işlemi tamamlandığında `chars` dizisinin sıkıştırılmış ilk bölümünü (`chars[..write]`) döndürün.

### Örnek 1

```text
Girdi:  chars = ["a","a","b","b","c","c","c"]
Çıktı:  ["a","2","b","2","c","3"]
Açıklama: Ardışık gruplar "aa", "bb" ve "ccc" şeklindedir. Sıkıştırıldığında "a2b2c3" elde edilir.
```

### Örnek 2

```text
Girdi:  chars = ["a"]
Çıktı:  ["a"]
Açıklama: Tek karakterli "a" grubu uzunluk sayısı eklenmeden ["a"] olarak kalır.
```

### Örnek 3

```text
Girdi:  chars = ["a","b","b","b","b","b","b","b","b","b","b","b","b"]
Çıktı:  ["a","b","1","2"]
Açıklama: Gruplar "a" ve 12 adet "b" içeren "bbbbbbbbbbbb" grubudur; 12 sayısı "1" ve "2" olarak iki ayrı karaktere bölünür.
```

### Kısıtlar

- `1 <= chars.length <= 2000`
- `chars[i]` küçük İngilizce harf, büyük İngilizce harf, rakam veya semboldür.

## İpuçları

- Dizi üzerinde hem okuma hem de yerinde yazma yapmak için `read` ve `write` adında iki işaretçi kullanın.
- Sıkıştırılmış çıktı hiçbir zaman orijinal gruptan daha uzun olamaz (uzunluk `1` ise `1` karakter, uzunluk `>= 2` ise en az `2` karakterin yerine karakter + basamaklar yazılır). Bu sayede `write` işaretçisi asla `read` işaretçisini geçmez ve henüz okunmamış verinin üzerine yazmaz.
- Bir grubun başındaki karakteri saklayın, aynı karakter devam ettiği sürece `read` ve `count` değerlerini artırın.
- Grup bittiğinde önce karakteri `chars[write++]` konumuna yazın; `count > 1` ise `count.ToString()` içindeki her basamak karakterini sırayla `chars[write++]` konumuna yazın.

## Çözüm

Diziyi ek bellek kullanmadan yerinde sıkıştırmak için **iki işaretçi** (`read` ve `write`) kullanırız:
- `read`, sıradaki ardışık karakter grubunu tarar ve kaç kez tekrarlandığını sayar.
- `write`, sıkıştırılmış sonucun `chars` dizisi içinde nereye yazılacağını gösterir.

Her adımda `current = chars[read]` ile mevcut grubun karakterini alırız. İçteki `while` döngüsü `chars[read] == current` olduğu sürece `read` ve `count` değişkenlerini birer artırır. Böylece grup sonuna ulaştığımızda `count` grup uzunluğunu tutar ve `read` bir sonraki grubun ilk elemanına konumlanmış olur.

Ardından önce `chars[write++] = current` ile grubun karakterini yazarız. Eğer `count > 1` ise sayının basamaklarını soldan sağa doğru tek tek `chars[write++]` konumuna yazarız.

Sıkıştırılmış bir grubun uzunluğu her zaman orijinal grup uzunluğuna eşit veya ondan küçüktür (`1 -> 1`, `2 -> 2`, `3 -> 2`, `12 -> 3`). Dolayısıyla `write <= read` eşitsizliği her zaman korunur ve henüz okunmamış hiçbir karakter ezilmez.

```csharp solution
public class Solution
{
    public char[] Compress(char[] chars)
    {
        int write = 0;
        int read = 0;

        while (read < chars.Length)
        {
            char current = chars[read];
            int count = 0;

            // Aynı karakterden oluşan ardışık grubun uzunluğunu say.
            while (read < chars.Length && chars[read] == current)
            {
                read++;
                count++;
            }

            // Önce karakterin kendisini yaz.
            chars[write++] = current;

            // Uzunluk 1'den büyükse basamakları sırayla yaz.
            if (count > 1)
            {
                foreach (char digit in count.ToString())
                {
                    chars[write++] = digit;
                }
            }
        }

        return chars[..write];
    }
}
```

```typescript solution
function compress(chars: string[]): string[] {
  let write = 0;
  let read = 0;

  while (read < chars.length) {
    const current = chars[read];
    let count = 0;

    while (read < chars.length && chars[read] === current) {
      read++;
      count++;
    }

    chars[write++] = current;

    if (count > 1) {
      for (const digit of String(count)) {
        chars[write++] = digit;
      }
    }
  }

  return chars.slice(0, write);
}
```

### Karmaşıklık

- **Zaman:** O(n). `read` işaretçisi dizideki her elemanı yalnızca bir kez ziyaret eder, `write` işaretçisi de en fazla `n` kez yazma yapar.
- **Alan:** O(1) ek çalışma alanı. Sıkıştırma işlemi doğrudan giriş dizisi `chars` üzerinde yerinde gerçekleştirilir.

## Testler

```json
[
  { "args": [["a","a","b","b","c","c","c"]], "expected": ["a","2","b","2","c","3"], "sample": true },
  { "args": [["a"]], "expected": ["a"], "sample": true },
  { "args": [["a","b","b","b","b","b","b","b","b","b","b","b","b"]], "expected": ["a","b","1","2"], "sample": true },
  { "args": [["a","a","a","b","b","a","a"]], "expected": ["a","3","b","2","a","2"] },
  { "args": [["a","b","c"]], "expected": ["a","b","c"] },
  { "args": [["z","z","z","z","z","z","z","z","z","z"]], "expected": ["z","1","0"] },
  { "args": [["x","x","y","z","z","z"]], "expected": ["x","2","y","z","3"] }
]
```
