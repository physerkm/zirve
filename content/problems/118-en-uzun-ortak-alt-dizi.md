---
title: En Uzun Ortak Alt Dizi
difficulty: medium
tags: [dinamik-programlama, dizgi]
function: longestCommonSubsequence
params:
  - { name: text1, type: "string" }
  - { name: text2, type: "string" }
returns: "int"
---
İki dizgi `text1` ve `text2` veriliyor. Bu iki dizginin **en uzun ortak alt dizisinin** (longest common subsequence) uzunluğunu döndürün. Ortak bir alt dizi yoksa `0` döndürün.

Bir dizginin **alt dizisi**, orijinal dizgiden bazı karakterlerin (veya hiçbirinin) kalan karakterlerin göreli sırası değiştirilmeden silinmesiyle elde edilen yeni bir dizgidir. Örneğin `"ace"`, `"abcde"` dizgisinin bir alt dizisidir.

İki dizginin **ortak alt dizisi**, her iki dizginin de alt dizisi olan bir dizgidir.

### Örnek 1

```text
Girdi:  text1 = "abcde", text2 = "ace"
Çıktı:  3
Açıklama: En uzun ortak alt dizi "ace" olup uzunluğu 3'tür.
```

### Örnek 2

```text
Girdi:  text1 = "abc", text2 = "abc"
Çıktı:  3
Açıklama: En uzun ortak alt dizi "abc" olup uzunluğu 3'tür.
```

### Örnek 3

```text
Girdi:  text1 = "abc", text2 = "def"
Çıktı:  0
Açıklama: Ortak alt dizi yoktur, sonuç 0'dır.
```

### Kısıtlar

- `1 <= text1.length, text2.length <= 1000`
- `text1` ve `text2` yalnızca küçük İngilizce harflerden oluşur.

## İpuçları

- İki dizginin ilk karakterlerini (`text1[i]` ve `text2[j]`) karşılaştırdığınızı düşünün. Eşitlerse bu karakter kesinlikle en uzun ortak alt diziye dahil edilebilir mi?
- `text1[i] == text2[j]` olduğunda her iki dizgide de birer adım ilerleyip (`i + 1`, `j + 1`) sonuca `1` ekleyebilirsiniz.
- Karakterler eşit değilse iki seçeneğiniz vardır: ya `text1[i]` karakterini atlayıp `(i + 1, j)` alt problemine bakmak ya da `text2[j]` karakterini atlayıp `(i, j + 1)` alt problemine bakmak.
- Aynı `(i, j)` çiftlerini tekrar tekrar hesaplamamak için `(m + 1) x (n + 1)` boyutunda bir dinamik programlama tablosu (`dp`) kullanın.

## Çözüm

Problemi sondan başa doğru iki boyutlu bir dinamik programlama tablosu (`dp`) ile çözeriz. `dp[i, j]`, `text1[i..]` soneki ile `text2[j..]` sonekinin en uzun ortak alt dizi uzunluğunu temsil etsin.

Tablo boyutunu `(m + 1) x (n + 1)` olarak seçeriz. Son satır (`dp[m, *]`) ve son sütun (`dp[*, n]`), dizgilerden birinin boş olduğu temel durumlara karşılık gelir ve doğal olarak `0` değerindedir.

Sondan başa doğru her `(i, j)` hücresi için iki durum vardır:
1. **Karakterler eşleşirse (`text1[i] == text2[j]`):** Bu karakteri ortak alt diziye alırız ve her iki dizgide de kalan kısımların cevabına `1` ekleriz: `dp[i, j] = 1 + dp[i + 1, j + 1]`.
2. **Karakterler eşleşmezse (`text1[i] != text2[j]`):** İki karakter aynı anda ortak alt dizide yer alamaz. Birini dışarıda bırakıp oluşan iki alt problemden daha büyük olanı seçeriz: `dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j + 1])`.

Tüm tablo doldurulduğunda `dp[0, 0]`, iki dizginin tamamı için en uzun ortak alt dizi uzunluğunu verir.

```csharp solution
public class Solution
{
    public int LongestCommonSubsequence(string text1, string text2)
    {
        int m = text1.Length;
        int n = text2.Length;
        // dp[i, j]: text1[i..] ve text2[j..] soneklerinin LCS uzunluğu.
        int[,] dp = new int[m + 1, n + 1];

        for (int i = m - 1; i >= 0; i--)
        {
            for (int j = n - 1; j >= 0; j--)
            {
                if (text1[i] == text2[j])
                    dp[i, j] = 1 + dp[i + 1, j + 1];
                else
                    dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j + 1]);
            }
        }

        return dp[0, 0];
    }
}
```

```typescript solution
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (text1[i] === text2[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  return dp[0][0];
}
```

### Karmaşıklık

- **Zaman:** O(m · n). Boyutları `m` ve `n` olan iki dizgi için `m · n` hücrenin her biri O(1) zamanda hesaplanır.
- **Alan:** O(m · n), `(m + 1) x (n + 1)` boyutundaki `dp` tablosu için.

## Testler

```json
[
  { "args": ["abcde", "ace"], "expected": 3, "sample": true },
  { "args": ["abc", "abc"], "expected": 3, "sample": true },
  { "args": ["abc", "def"], "expected": 0, "sample": true },
  { "args": ["a", "a"], "expected": 1 },
  { "args": ["a", "b"], "expected": 0 },
  { "args": ["aggtab", "gxtxayb"], "expected": 4 },
  { "args": ["ezupkr", "ubmrapg"], "expected": 2 },
  { "args": ["bl", "yby"], "expected": 1 },
  { "args": ["abcba", "abcbcba"], "expected": 5 }
]
```
