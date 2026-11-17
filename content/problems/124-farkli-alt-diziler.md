---
title: Farklı Alt Diziler
difficulty: hard
tags: [dinamik-programlama, dizgi]
function: numDistinct
params:
  - { name: s, type: "string" }
  - { name: t, type: "string" }
returns: "int"
---
İki dizgi `s` ve `t` veriliyor. `s`'nin **farklı alt dizileri** (subsequences) arasında `t`'ye eşit olanların sayısını döndürün.

Bir dizginin alt dizisi, özgün dizgiden bazı karakterlerin (hiçbiri de olmayabilir) kalan karakterlerin göreli sırası bozulmadan silinmesiyle elde edilen yeni bir dizgidir. Örneğin `"ACE"`, `"ABCDE"` dizgisinin bir alt dizisidir; ancak `"AEC"` değildir.

Test durumları, cevabın 32-bit işaretli bir tam sayıya (`int`) sığacağı şekilde üretilmiştir.

### Örnek 1

```text
Girdi:  s = "rabbbit", t = "rabbit"
Çıktı:  3
Açıklama:
Aşağıda s içindeki karakterlerden "rabbit" oluşturmanın 3 farklı yolu gösterilmiştir:
rabb[b]it -> parantez içindeki 3. 'b' silinir
rab[b]bit -> parantez içindeki 2. 'b' silinir
ra[b]bbit -> parantez içindeki 1. 'b' silinir
```

### Örnek 2

```text
Girdi:  s = "babgbag", t = "bag"
Çıktı:  5
Açıklama:
s içindeki indekslerle [0, 1, 3], [0, 1, 6], [0, 5, 6], [2, 5, 6] ve [4, 5, 6] seçimleri "bag" dizgisini oluşturur.
```

### Kısıtlar

- `1 <= s.length, t.length <= 1000`
- `s` ve `t` yalnızca İngilizce harflerden oluşur.

## İpuçları

- `s[i..]` soneki içinde `t[j..]` sonekini kaç farklı şekilde oluşturabileceğinizi bir alt problem olarak tanımlayın.
- `s[i]` ile `t[j]` karakterleri aynıysa iki seçeneğiniz vardır: `s[i]` karakterini `t[j]` ile eşleştirip `(i + 1, j + 1)` durumuna geçmek veya `s[i]` karakterini atlayıp `(i + 1, j)` durumuna geçmek.
- Karakterler farklıysa tek seçeneğiniz `s[i]` karakterini atlayıp `(i + 1, j)` durumuna bakmaktır.
- Her satır yalnızca bir sonraki satıra (`i + 1`) bağlı olduğu için 2 boyutlu tabloyu `t.length + 1` uzunluğunda tek boyutlu bir `dp` dizisine indirebilirsiniz.

## Çözüm

Problemi sondan başa doğru dinamik programlama ile çözeriz. `dp[j]` değeri, şu ana kadar işlenen `s[i..]` soneki kullanılarak `t[j..]` sonekinin kaç farklı şekilde oluşturulabileceğini tutar.

Başlangıçta `t`'nin boş soneki (`j = t.Length`) her zaman 1 farklı şekilde (hiçbir karakter seçmeyerek) oluşturulabilir; bu yüzden `dp[n] = 1` olarak başlatılır.

`s` dizgisini sondan başa (`i = m - 1` indeksinden `0`'a) tararken, her `i` adımı için `t` üzerinde `j = 0`'dan `n - 1`'e doğru ilerleriz:
- Eğer `s[i] != t[j]` ise `s[i]` karakterini kullanamayız; `dp[j]` değeri değişmeden kalır (yani `i + 1` adımındaki değerini korur).
- Eğer `s[i] == t[j]` ise hem `s[i]` karakterini atladığımız yolların sayısı (`dp[j]`) hem de `s[i]` ile `t[j]`'yi eşleştirdiğimiz yolların sayısı (`dp[j + 1]`) toplanır: `dp[j] += dp[j + 1]`.

İç döngüde `j` soldan sağa (`0`'dan `n - 1`'e) ilerlediği için `dp[j]` güncellenirken `dp[j + 1]` henüz bu `i` adımında değiştirilmemiştir; yani tam olarak bir önceki satırın (`i + 1`) değerini taşır. Bu sayede ek bir geçici diziye ihtiyaç duymadan **O(n)** alanda çözüm elde edilir.

```csharp solution
public class Solution
{
    public int NumDistinct(string s, string t)
    {
        int m = s.Length;
        int n = t.Length;
        if (m < n)
            return 0;

        // dp[j]: s[i..] içinde t[j..] sonekini oluşturma sayısı.
        long[] dp = new long[n + 1];
        dp[n] = 1;

        for (int i = m - 1; i >= 0; i--)
        {
            for (int j = 0; j < n; j++)
            {
                if (s[i] == t[j])
                {
                    dp[j] += dp[j + 1];
                }
            }
        }

        return (int)dp[0];
    }
}
```

```typescript solution
function numDistinct(s: string, t: string): number {
  const m = s.length;
  const n = t.length;
  if (m < n) return 0;

  const dp = new Array<number>(n + 1).fill(0);
  dp[n] = 1;

  for (let i = m - 1; i >= 0; i--) {
    for (let j = 0; j < n; j++) {
      if (s[i] === t[j]) {
        dp[j] += dp[j + 1];
      }
    }
  }

  return dp[0];
}
```

### Karmaşıklık

- **Zaman:** O(m · n). `s`'nin her karakteri için `t` uzunluğundaki `dp` dizisi taranır.
- **Alan:** O(n). Yalnızca `t.Length + 1` boyutunda tek boyutlu bir `dp` dizisi tutulur.

## Testler

```json
[
  { "args": ["rabbbit", "rabbit"], "expected": 3, "sample": true },
  { "args": ["babgbag", "bag"], "expected": 5, "sample": true },
  { "args": ["a", "a"], "expected": 1 },
  { "args": ["a", "b"], "expected": 0 },
  { "args": ["abc", "abcd"], "expected": 0 },
  { "args": ["aaaa", "aa"], "expected": 6 },
  { "args": ["abcabc", "abc"], "expected": 4 },
  { "args": ["aaaaa", "a"], "expected": 5 }
]
```
