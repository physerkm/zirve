---
title: Kelime Ayırma
difficulty: medium
tags: [dinamik-programlama, dizgi, hash-tablosu]
function: wordBreak
params:
  - { name: s, type: "string" }
  - { name: wordDict, type: "List<string>" }
returns: "bool"
---

Bir `s` dizgisi ve sözlükteki kelimelerin listesini içeren `wordDict` veriliyor. `s` dizgisi, sözlükte yer alan bir veya daha fazla kelimenin boşluklarla ayrılmış ardışık bir dizisi olarak bölünebiliyorsa `true`, aksi halde `false` döndürün.

Sözlükteki aynı kelimenin bölme işleminde **birden fazla kez** kullanılabileceğine dikkat edin.

### Örnek 1

```text
Girdi:  s = "leetcode", wordDict = ["leet", "code"]
Çıktı:  true
Açıklama: "leetcode" dizgisi "leet code" olarak ayrılabilir.
```

### Örnek 2

```text
Girdi:  s = "applepenapple", wordDict = ["apple", "pen"]
Çıktı:  true
Açıklama: "applepenapple" dizgisi "apple pen apple" olarak ayrılabilir. Sözlük kelimeleri tekrar kullanılabilir.
```

### Örnek 3

```text
Girdi:  s = "catsandog", wordDict = ["cats", "dog", "sand", "and", "cat"]
Çıktı:  false
Açıklama: Hangi kelime seçilirse seçilsin dizginin tamamı sözlükteki kelimelerle eksiksiz bölünemez.
```

### Kısıtlar

- `1 <= s.length <= 300`
- `1 <= wordDict.length <= 1000`
- `1 <= wordDict[i].length <= 20`
- `s` ve `wordDict[i]` yalnızca küçük İngilizce harflerden oluşur.
- `wordDict` içindeki tüm kelimeler **benzersizdir**.

## İpuçları

- Baştan ilk eşleşen kelimeyi açgözlü (greedy) biçimde seçmek her zaman işe yaramaz: örneğin `s = "cars"` ve `wordDict = ["car", "ca", "rs"]` olduğunda `"car"` seçilirse geriye `"s"` kalır, oysa `"ca" + "rs"` geçerlidir.
- `dp[i]` değerini "`s[i..]` soneki sözlükteki kelimelerle tamamen bölünebilir mi?" sorusunun yanıtı olarak tanımlayın.
- Baz durumu olarak boş sonek (`dp[s.Length] = true`) her zaman geçerlidir.
- `i` indisini sondan başa (`s.Length - 1`'den `0`'a) yürütürken sözlükteki her `w` kelimesi için `s`'nin `i` konumundan başlayan alt dizgisi `w` ile eşleşiyor ve `dp[i + w.Length]` doğruysa `dp[i] = true` yapın.

## Çözüm

Problemi sağdan sola (sondan başa) 1 boyutlu dinamik programlama ile çözeriz. Uzunluğu `n + 1` olan bir `bool[] dp` dizisi tanımlarız:

- `dp[i]`: `s` dizgisinin `i` indisinden sona kadar olan `s[i..]` sonekinin sözlükteki kelimelerle bölünüp bölünemeyeceğini belirtir.
- **Baz durumu:** `dp[n] = true` (boş dizgi sıfır kelimeyle bölünmüş kabul edilir).

`i = n - 1`'den `0`'a kadar geriye doğru ilerlerken sözlükteki her `w` kelimesini deneriz. Eğer:

1. Kelime `i` konumundan itibaren dizginin dışına taşmıyorsa (`i + w.Length <= n`),
2. Kelimenin bittiği yerden başlayan kalan sonek zaten bölünebiliyorsa (`dp[i + w.Length] == true`),
3. Ve `s` dizgisinin `i` konumundaki `w.Length` uzunluklu parçası `w` kelimesine eşitse (`s.Substring(i, w.Length) == w`),

o zaman `i` konumundan başlayan sonek de bölünebilir demektir: `dp[i] = true` atayıp iç döngüden `break` ile çıkarız. Döngü tamamlandığında tüm dizgiyi temsil eden `dp[0]` değerini döndürürüz.

```csharp solution
public class Solution
{
    public bool WordBreak(string s, IList<string> wordDict)
    {
        bool[] dp = new bool[s.Length + 1];
        dp[s.Length] = true;

        for (int i = s.Length - 1; i >= 0; i--)
        {
            foreach (string w in wordDict)
            {
                if (i + w.Length <= s.Length && dp[i + w.Length] && s.Substring(i, w.Length) == w)
                {
                    dp[i] = true;
                    break;
                }
            }
        }

        return dp[0];
    }
}
```

```typescript solution
function wordBreak(s: string, wordDict: string[]): boolean {
  const dp = new Array<boolean>(s.length + 1).fill(false);
  dp[s.length] = true;

  for (let i = s.length - 1; i >= 0; i--) {
    for (const w of wordDict) {
      if (
        i + w.length <= s.length &&
        dp[i + w.length] &&
        s.slice(i, i + w.length) === w
      ) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[0];
}
```

### Karmaşıklık

- **Zaman:** O(n · m · k). Burada `n` dizginin uzunluğu, `m` sözlükteki kelime sayısı ve `k` bir kelimenin ortalama/maksimum uzunluğudur (`k <= 20`). Her `i` konumu için sözlükteki kelimeler kontrol edilir ve en fazla `k` karakter karşılaştırılır.
- **Alan:** O(n), `n + 1` elemanlı `dp` dizisi için.

## Testler

```json
[
  { "args": ["leetcode", ["leet", "code"]], "expected": true, "sample": true },
  { "args": ["applepenapple", ["apple", "pen"]], "expected": true, "sample": true },
  { "args": ["catsandog", ["cats", "dog", "sand", "and", "cat"]], "expected": false, "sample": true },
  { "args": ["cars", ["car", "ca", "rs"]], "expected": true },
  { "args": ["aaaaaaa", ["aaaa", "aaa"]], "expected": true },
  { "args": ["aaaaaaa", ["aaaa", "aa"]], "expected": false },
  { "args": ["bb", ["a", "b", "bbb", "bbbb"]], "expected": true }
]
```
