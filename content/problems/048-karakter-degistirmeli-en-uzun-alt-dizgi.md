---
title: Karakter Değiştirmeli En Uzun Alt Dizgi
difficulty: medium
tags: [dizgi, kayan-pencere]
function: characterReplacement
params:
  - { name: s, type: "string" }
  - { name: k, type: "int" }
returns: "int"
---
Yalnızca büyük İngilizce harflerden oluşan bir `s` dizgisi ve bir `k` tam sayısı veriliyor. Dizgideki herhangi bir karakteri seçip başka bir büyük İngilizce harfle değiştirme işlemini **en fazla `k` kez** yapabilirsiniz.

Bu işlemler sonucunda elde edebileceğiniz, **yalnızca aynı harften oluşan en uzun alt dizginin (substring)** uzunluğunu döndürün.

### Örnek 1

```text
Girdi:  s = "ABAB", k = 2
Çıktı:  4
Açıklama: İki 'A' harfini 'B' ile (veya iki 'B' harfini 'A' ile) değiştirerek "BBBB" (veya "AAAA") elde edilir.
```

### Örnek 2

```text
Girdi:  s = "AABABBA", k = 1
Çıktı:  4
Açıklama: Ortadaki 'B' harfini 'A' ile değiştirerek "AAAA" alt dizgisini içeren "AAAAABBA" veya 2..5 aralığında "BBBB" elde edilebilir; en uzun aynı harfli alt dizgi 4 uzunluğundadır.
```

### Kısıtlar

- `1 <= s.length <= 10^5`
- `s` yalnızca büyük İngilizce harflerden (`A-Z`) oluşur.
- `0 <= k <= s.length`

## İpuçları

- Bir alt dizginin tamamını aynı harfe dönüştürmek için kaç değişiklik gerekir? Alt dizginin uzunluğundan, içindeki **en sık geçen harfin** sayısını çıkararak bulabilirsiniz.
- Kayan pencere (`[left..right]`) kullanın ve pencere içindeki harf frekanslarını 26 elemanlı bir dizide tutun.
- Pencere içindeki en yüksek frekansı `maxFreq` değişkeninde takip edin. `pencereBoyutu - maxFreq > k` olduğunda pencere geçersizdir; `left` işaretçisini bir sağa kaydırarak pencereyi daraltın.
- `maxFreq` değerini pencere daralırken azaltmanıza gerek yoktur; çünkü daha büyük bir sonuç bulmak için zaten önceki `maxFreq` değerinden daha büyük bir frekansa ihtiyacımız vardır.

## Çözüm

Bir `[left..right]` penceresinin tamamını tek bir harfe dönüştürmenin en ucuz yolu, pencere içinde **en çok tekrar eden** harfi sabit tutup geri kalan tüm harfleri ona dönüştürmektir. Dolayısıyla gereken değiştirme sayısı:

`değiştirmeSayısı = (right - left + 1) - maxFreq`

Burada `maxFreq`, pencere içindeki en sık harfin frekansıdır. Eğer bu fark `k`'yı aşarsa (`(right - left + 1) - maxFreq > k`), mevcut pencereyi `k` değiştirmeyle tek harfli yapmak imkânsızdır. Bu durumda `s[left]` karakterini pencereden çıkarıp `left++` yaparak pencereyi bir birim kaydırırız.

Önemli bir gözlem: `left` ilerlediğinde `maxFreq` değerini yeniden hesaplamamıza veya azaltmamıza gerek yoktur. Amacımız şimdiye kadar bulduğumuz en büyük pencereden **daha uzun** bir pencere bulmaktır; bu da ancak `maxFreq` arttığında mümkün olur. Böylece her adımda O(1) iş yaparak tüm dizgiyi tek geçişte tararız.

```csharp solution
public class Solution
{
    public int CharacterReplacement(string s, int k)
    {
        int[] count = new int[26];
        int left = 0;
        int maxFreq = 0;
        int best = 0;

        for (int right = 0; right < s.Length; right++)
        {
            int idx = s[right] - 'A';
            count[idx]++;
            maxFreq = Math.Max(maxFreq, count[idx]);

            // Değiştirilmesi gereken karakter sayısı k'yı aşarsa pencereyi soldan daralt.
            if ((right - left + 1) - maxFreq > k)
            {
                count[s[left] - 'A']--;
                left++;
            }

            best = Math.Max(best, right - left + 1);
        }

        return best;
    }
}
```

```typescript solution
function characterReplacement(s: string, k: number): number {
  const count = new Array<number>(26).fill(0);
  let left = 0;
  let maxFreq = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const idx = s.charCodeAt(right) - 65;
    count[idx]++;
    maxFreq = Math.max(maxFreq, count[idx]);

    if (right - left + 1 - maxFreq > k) {
      count[s.charCodeAt(left) - 65]--;
      left++;
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

### Karmaşıklık

- **Zaman:** O(n). `right` ve `left` işaretçileri dizgi boyunca en fazla birer kez ilerler; her adım O(1) sürer.
- **Alan:** O(1). Yalnızca 26 büyük İngilizce harfin frekansını tutan sabit boyutlu bir dizi kullanılır.

## Testler

```json
[
  { "args": ["ABAB", 2], "expected": 4, "sample": true },
  { "args": ["AABABBA", 1], "expected": 4, "sample": true },
  { "args": ["AAAA", 2], "expected": 4 },
  { "args": ["ABCD", 0], "expected": 1 },
  { "args": ["ABCD", 2], "expected": 3 },
  { "args": ["ABBB", 2], "expected": 4 },
  { "args": ["BAAAB", 2], "expected": 5 },
  { "args": ["A", 0], "expected": 1 }
]
```
