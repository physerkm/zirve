---
title: Anagramları Grupla
difficulty: medium
tags: [dizgi, hash-tablosu, siralama]
function: groupAnagrams
params:
  - { name: words, type: "string[]" }
returns: "List<List<string>>"
compare: unordered-nested
---
Bir dizgi dizisi `words` veriliyor. Birbirinin anagramı olan sözcükleri aynı grupta toplayın. Grupları ve grup içindeki sözcükleri istediğiniz sırada döndürebilirsiniz.

### Örnek 1

```text
Girdi:  words = ["eat", "tea", "tan", "ate", "nat", "bat"]
Çıktı:  [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]
```

### Örnek 2

```text
Girdi:  words = [""]
Çıktı:  [[""]]
```

### Kısıtlar

- `1 <= words.length <= 10^4`
- `0 <= words[i].length <= 100`
- Sözcükler yalnızca küçük İngilizce harflerden oluşur.

## İpuçları

- Aynı gruptaki bütün sözcükler için **aynı** olan, farklı gruplar için farklı olan bir "imza" bulun.
- Bir sözcüğün harflerini sıralarsanız bütün anagramları aynı dizgiye dönüşür.
- İmzayı anahtar, sözcük listesini değer olarak tutan bir hash tablosu kullanın.

## Çözüm

Anagramların ortak özelliği, harfleri sıralandığında aynı dizgiyi vermeleridir: `"eat"`, `"tea"` ve `"ate"` hepsi `"aet"` olur. Bu sıralı biçimi hash tablosunda anahtar olarak kullanır ve her sözcüğü kendi anahtarının listesine ekleriz.

```csharp solution
public class Solution
{
    public IList<IList<string>> GroupAnagrams(string[] words)
    {
        var groups = new Dictionary<string, IList<string>>();

        foreach (var word in words)
        {
            var letters = word.ToCharArray();
            Array.Sort(letters);
            var key = new string(letters);

            if (!groups.TryGetValue(key, out var group))
            {
                group = new List<string>();
                groups[key] = group;
            }

            group.Add(word);
        }

        return groups.Values.ToList();
    }
}
```

```typescript solution
function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();

  for (const word of words) {
    const key = [...word].sort().join('');
    const group = groups.get(key);

    if (group) group.push(word);
    else groups.set(key, [word]);
  }

  return [...groups.values()];
}
```

### Karmaşıklık

`n` sözcük sayısı, `k` en uzun sözcüğün uzunluğu olsun.

- **Zaman:** O(n · k log k). Her sözcük sıralanır.
- **Alan:** O(n · k).

**İyileştirme:** Anahtar olarak sıralı dizgi yerine 26 harfin frekans sayımını (ör. `"1#0#0#…"`) kullanmak sıralamayı ortadan kaldırır ve zamanı O(n · k)'ye indirir. Sözcükler kısa olduğunda pratikte fark küçüktür.

## Testler

```json
[
  { "args": [["eat", "tea", "tan", "ate", "nat", "bat"]], "expected": [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]], "sample": true },
  { "args": [[""]], "expected": [[""]], "sample": true },
  { "args": [["a"]], "expected": [["a"]] },
  { "args": [["abc", "def", "ghi"]], "expected": [["abc"], ["def"], ["ghi"]] },
  { "args": [["ab", "ba", "ab"]], "expected": [["ab", "ba", "ab"]] },
  { "args": [["", "", "a"]], "expected": [["", ""], ["a"]] },
  { "args": [["listen", "silent", "enlist", "google", "gogole"]], "expected": [["listen", "silent", "enlist"], ["google", "gogole"]] }
]
```
