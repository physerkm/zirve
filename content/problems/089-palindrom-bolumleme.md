---
title: Palindrom Bölümleme
difficulty: medium
tags: [geri-izleme, dizgi, dinamik-programlama]
function: partition
params:
  - { name: s, type: "string" }
returns: "List<List<string>>"
compare: unordered
---
Bir dizgi `s` veriliyor. `s`'yi, her parçası **palindrom** olacak şekilde parçalara ayırın. Bütün olası bölümlemeleri döndürün. Bölümlemeler herhangi bir sırada olabilir; her bölümlemedeki parçalar soldan sağa sıralıdır.

### Örnek 1

```text
Girdi:  s = "aab"
Çıktı:  [["a","a","b"],["aa","b"]]
```

### Örnek 2

```text
Girdi:  s = "a"
Çıktı:  [["a"]]
```

### Kısıtlar

- `1 <= s.length <= 16`
- `s` yalnızca küçük İngilizce harflerden oluşur.

## İpuçları

- İlk parçayı seçin: `s[0..i]` palindromsa, kalan `s[i+1..]` için aynı problemi çözün.
- Her konumda olası bütün bitişleri deneyen bir geri izleme (backtracking) yazın; palindrom olmayan seçimlerde hemen dönün.
- Palindrom kontrolünü iki işaretçiyle yapabilir ya da bütün alt dizgiler için önceden bir DP tablosu hesaplayabilirsiniz.

## Çözüm

### Geri izleme

`Backtrack(start)` fonksiyonu `s[start..]` kısmını bölümler. `start == s.Length` ise mevcut parça listesi tam bir bölümlemedir ve sonuca kopyası eklenir. Aksi halde `end = start .. n-1` için `s[start..end]` palindromsa parça listeye eklenir, `Backtrack(end + 1)` çağrılır ve dönüşte parça çıkarılır.

```csharp solution
public class Solution
{
    public IList<IList<string>> Partition(string s)
    {
        var result = new List<IList<string>>();
        var parts = new List<string>();

        void Backtrack(int start)
        {
            if (start == s.Length)
            {
                result.Add(new List<string>(parts));
                return;
            }

            for (var end = start; end < s.Length; end++)
            {
                if (!IsPalindrome(s, start, end))
                {
                    continue;
                }

                parts.Add(s.Substring(start, end - start + 1));
                Backtrack(end + 1);
                parts.RemoveAt(parts.Count - 1);
            }
        }

        Backtrack(0);
        return result;
    }

    private static bool IsPalindrome(string s, int left, int right)
    {
        while (left < right)
        {
            if (s[left++] != s[right--])
            {
                return false;
            }
        }

        return true;
    }
}
```

```typescript solution
function partition(s: string): string[][] {
  const result: string[][] = [];
  const parts: string[] = [];

  const isPalindrome = (left: number, right: number): boolean => {
    while (left < right) {
      if (s[left++] !== s[right--]) return false;
    }
    return true;
  };

  const backtrack = (start: number): void => {
    if (start === s.length) {
      result.push([...parts]);
      return;
    }

    for (let end = start; end < s.length; end++) {
      if (!isPalindrome(start, end)) continue;
      parts.push(s.slice(start, end + 1));
      backtrack(end + 1);
      parts.pop();
    }
  };

  backtrack(0);
  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n × 2^n). `n - 1` kesme noktasının her biri kesilir ya da kesilmez; her bölümleme O(n) sürede kopyalanır.
- **Alan:** O(n) özyineleme ve parça listesi (çıktı hariç).

## Testler

```json
[
  { "args": ["aab"], "expected": [["a", "a", "b"], ["aa", "b"]], "sample": true },
  { "args": ["a"], "expected": [["a"]], "sample": true },
  { "args": ["ab"], "expected": [["a", "b"]] },
  { "args": ["aaa"], "expected": [["a", "a", "a"], ["a", "aa"], ["aa", "a"], ["aaa"]] },
  { "args": ["abba"], "expected": [["a", "b", "b", "a"], ["a", "bb", "a"], ["abba"]] },
  { "args": ["abcba"], "expected": [["a", "b", "c", "b", "a"], ["a", "bcb", "a"], ["abcba"]] }
]
```
