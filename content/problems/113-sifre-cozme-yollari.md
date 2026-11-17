---
title: Şifre Çözme Yolları
difficulty: medium
tags: [dinamik-programlama, dizgi]
function: numDecodings
params:
  - { name: s, type: "string" }
returns: "int"
---

`'A'`'dan `'Z'`'ye kadar olan harfler `1`'den `26`'ya kadar olan sayılarla eşlenerek şifrelenmiştir:

- `'A' -> "1"`
- `'B' -> "2"`
- `...`
- `'Z' -> "26"`

Şifrelenmiş bir mesajı çözmek (decode etmek) için rakamlar geçerli harf karşılıklarına göre gruplanmalı ve ardından harflere dönüştürülmelidir; çoğu zaman aynı rakam dizisi birden fazla şekilde gruplanabilir. Örneğin `"11106"` dizgisi şu iki biçimde çözülebilir:

- `"AAJF"` olarak (`(1, 1, 10, 6)` gruplamasıyla)
- `"KJF"` olarak (`(11, 10, 6)` gruplamasıyla)

`(1, 11, 06)` gruplamasının **geçersiz** olduğuna dikkat edin; çünkü `"06"` başında sıfır içerdiği için hiçbir harfe karşılık gelmez (`"6"` ile `"06"` farklıdır).

Yalnızca rakamlardan oluşan bir `s` dizgisi verildiğinde, bu mesajı çözmenin **toplam yol sayısını** döndürün. Mesaj hiçbir geçerli yolla çözülemiyorsa `0` döndürün.

Test verileri, cevabın 32-bitlik işaretli bir tam sayıya (`int`) sığacağı şekilde üretilmiştir.

### Örnek 1

```text
Girdi:  s = "12"
Çıktı:  2
Açıklama: "12" dizgisi "AB" (1 2) veya "L" (12) olarak 2 farklı şekilde çözülebilir.
```

### Örnek 2

```text
Girdi:  s = "226"
Çıktı:  3
Açıklama: "226" dizgisi "BZ" (2 26), "VF" (22 6) veya "BBF" (2 2 6) olarak 3 farklı şekilde çözülebilir.
```

### Örnek 3

```text
Girdi:  s = "06"
Çıktı:  0
Açıklama: "06" başında sıfır içerdiği için "F" olarak çözülemez ("6" ile "06" aynı değildir). '0' tek başına da geçerli bir harf değildir.
```

### Kısıtlar

- `1 <= s.length <= 100`
- `s` yalnızca rakamlardan oluşur ve başında sıfırlar içerebilir.

## İpuçları

- `i` konumundan başlayan `s[i..]` alt dizgisinin kaç farklı şekilde çözülebileceğini `dp[i]` olarak düşünün.
- Eğer `s[i] == '0'` ise bu konumdan başlayan hiçbir geçerli harf olamaz (`dp[i] = 0`).
- `s[i]` karakteri `'1'` ile `'9'` arasındaysa tek basamaklı bir harf olarak ayrılabilir ve geriye `s[i+1..]` kalır (`dp[i + 1]` yol).
- Ayrıca `s[i..i+2]` iki basamaklı sayısı `10` ile `26` arasındaysa iki basamaklı bir harf olarak da ayrılabilir ve geriye `s[i+2..]` kalır (`dp[i + 2]` yol). Her adımda yalnızca son iki değere ihtiyaç duyulduğu için çözümü O(1) bellekle yazabilirsiniz.

## Çözüm

Problemi sağdan sola doğru dinamik programlama ile çözeriz. `dp[i]`, `s` dizgisinin `i` indisinden sona kadar olan `s[i..]` sonekinin kaç farklı şekilde çözülebileceğini göstersin. Baz durumu olarak boş sonek tek bir geçerli tamamlanmayı temsil ettiği için `dp[n] = 1` kabul edilir.

Her `i` (`n - 1`'den `0`'a doğru) konumunda iki seçeneğimiz vardır:

1. **Tek basamaklı seçim:** `s[i] == '0'` ise `'0'` tek başına veya iki basamaklı bir sayının başında çözülemez; bu durumda `dp[i] = 0` olur. Eğer `s[i]` rakamı `'1'..'9'` arasındaysa tek bir harfe dönüşür ve kalan `s[i+1..]` kısmı `dp[i + 1]` farklı yolla çözülür.
2. **İki basamaklı seçim:** `i + 1 < n` ise ve `s[i]` ile `s[i + 1]` yan yana geldiğinde `"10"` ile `"26"` arasında bir sayı oluşturuyorsa (`s[i] == '1'` veya `s[i] == '2' && s[i + 1] <= '6'`), bu iki basamak birlikte tek bir harfe dönüşebilir ve kalan `s[i+2..]` kısmı `dp[i + 2]` farklı yolla çözülür. Bu değeri de toplama ekleriz.

`dp[i]` yalnızca `dp[i + 1]` ve `dp[i + 2]` değerlerine bağlı olduğundan tüm diziyi tutmak yerine yalnızca `next1` (`dp[i + 1]`) ve `next2` (`dp[i + 2]`) adlı iki değişken kullanarak alanı O(1)'e indiririz.

```csharp solution
public class Solution
{
    public int NumDecodings(string s)
    {
        int next1 = 1; // dp[i + 1]: s[i+1..] sonekinin çözülme sayısı
        int next2 = 0; // dp[i + 2]: s[i+2..] sonekinin çözülme sayısı

        for (int i = s.Length - 1; i >= 0; i--)
        {
            int current = 0;

            if (s[i] != '0')
            {
                current = next1;

                if (i + 1 < s.Length && (s[i] == '1' || (s[i] == '2' && s[i + 1] <= '6')))
                    current += next2;
            }

            next2 = next1;
            next1 = current;
        }

        return next1;
    }
}
```

```typescript solution
function numDecodings(s: string): number {
  let next1 = 1;
  let next2 = 0;

  for (let i = s.length - 1; i >= 0; i--) {
    let current = 0;

    if (s[i] !== "0") {
      current = next1;

      if (
        i + 1 < s.length &&
        (s[i] === "1" || (s[i] === "2" && s[i + 1] <= "6"))
      ) {
        current += next2;
      }
    }

    next2 = next1;
    next1 = current;
  }

  return next1;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizgi sağdan sola tek bir geçişte taranır ve her karakter için sabit zamanlı işlem yapılır.
- **Alan:** O(1). Tüm `dp` dizisi yerine yalnızca son iki durumu tutan `next1` ve `next2` değişkenleri kullanılır.

## Testler

```json
[
  { "args": ["12"], "expected": 2, "sample": true },
  { "args": ["226"], "expected": 3, "sample": true },
  { "args": ["06"], "expected": 0, "sample": true },
  { "args": ["10"], "expected": 1 },
  { "args": ["27"], "expected": 1 },
  { "args": ["11106"], "expected": 2 },
  { "args": ["2101"], "expected": 1 },
  { "args": ["100"], "expected": 0 }
]
```
