---
title: Dizgide Permütasyon
difficulty: medium
tags: [dizgi, kayan-pencere]
function: checkInclusion
params:
  - { name: s1, type: "string" }
  - { name: s2, type: "string" }
returns: "bool"
---
İki dizgi `s1` ve `s2` veriliyor. `s2` dizgisi, `s1`'in herhangi bir **permütasyonunu** alt dizgi (substring) olarak içeriyorsa `true`, aksi hâlde `false` döndürün.

Başka bir deyişle, `s1`'in karakterlerinin yer değiştirilmiş hâllerinden biri `s2` içinde kesintisiz olarak geçiyorsa sonuç `true` olmalıdır.

### Örnek 1

```text
Girdi:  s1 = "ab", s2 = "eidbaooo"
Çıktı:  true
Açıklama: s2 dizgisi, "ab"nin permütasyonu olan "ba" alt dizgisini içerir.
```

### Örnek 2

```text
Girdi:  s1 = "ab", s2 = "eidboaoo"
Çıktı:  false
Açıklama: s2 içinde "ab" veya "ba" alt dizgisi yoktur.
```

### Kısıtlar

- `1 <= s1.length, s2.length <= 10^4`
- `s1` ve `s2` yalnızca küçük İngilizce harflerden (`a-z`) oluşur.

## İpuçları

- Bir dizginin başka bir dizginin permütasyonu olması, her iki dizgideki harf frekanslarının birebir aynı olması demektir.
- `s2` içinde aradığımız alt dizginin uzunluğu tam olarak `s1.Length` olmalıdır.
- `s2` üzerinde `s1.Length` boyutunda sabit bir kayan pencere gezdirin; pencere sağa kaydıkça yeni giren harfin sayacını artırıp çıkan harfin sayacını azaltın.
- Her adımda 26 harfi baştan karşılaştırmak yerine, kaç harfin frekansının eşleştiğini tutan bir `matches` (0..26) değişkeni ile kontrolü O(1)'de yapabilirsiniz.

## Çözüm

`s1`'in bir permütasyonu, `s1` ile aynı uzunlukta ve aynı harf sayılarına sahip bir alt dizgidir. Dolayısıyla `s2` üzerinde `s1.Length` uzunluğunda **sabit boyutlu bir kayan pencere** gezdirebiliriz.

26 elemanlı iki frekans dizisi (`s1Count` ve `winCount`) kurarız. İlk `s1.Length` karakteri yerleştirdikten sonra, 26 harfin kaç tanesinde `s1Count[i] == winCount[i]` olduğunu `matches` değişkeninde sayarız (`matches == 26` ise tüm harf frekansları eşleşmiştir).

Pencereyi bir sağa kaydırırken:
1. Sağdan pencereye giren karakterin `winCount` değerini 1 artırırız. Bu artış sonucunda frekanslar eşitlendiyse `matches++`, önceden eşitken bozulduysa `matches--` yaparız.
2. Soldan pencereden çıkan karakterin `winCount` değerini 1 azaltırız. Bu azalış sonucunda frekanslar eşitlendiyse `matches++`, önceden eşitken bozulduysa `matches--` yaparız.

Herhangi bir adımda `matches == 26` olursa `true` döndürürüz.

```csharp solution
public class Solution
{
    public bool CheckInclusion(string s1, string s2)
    {
        if (s1.Length > s2.Length)
            return false;

        int[] s1Count = new int[26];
        int[] winCount = new int[26];

        for (int i = 0; i < s1.Length; i++)
        {
            s1Count[s1[i] - 'a']++;
            winCount[s2[i] - 'a']++;
        }

        int matches = 0;
        for (int i = 0; i < 26; i++)
        {
            if (s1Count[i] == winCount[i])
                matches++;
        }

        for (int right = s1.Length; right < s2.Length; right++)
        {
            if (matches == 26)
                return true;

            int addIdx = s2[right] - 'a';
            winCount[addIdx]++;
            if (winCount[addIdx] == s1Count[addIdx])
                matches++;
            else if (winCount[addIdx] == s1Count[addIdx] + 1)
                matches--;

            int remIdx = s2[right - s1.Length] - 'a';
            winCount[remIdx]--;
            if (winCount[remIdx] == s1Count[remIdx])
                matches++;
            else if (winCount[remIdx] == s1Count[remIdx] - 1)
                matches--;
        }

        return matches == 26;
    }
}
```

```typescript solution
function checkInclusion(s1: string, s2: string): boolean {
  if (s1.length > s2.length) return false;

  const s1Count = new Array<number>(26).fill(0);
  const winCount = new Array<number>(26).fill(0);

  for (let i = 0; i < s1.length; i++) {
    s1Count[s1.charCodeAt(i) - 97]++;
    winCount[s2.charCodeAt(i) - 97]++;
  }

  let matches = 0;
  for (let i = 0; i < 26; i++) {
    if (s1Count[i] === winCount[i]) matches++;
  }

  for (let right = s1.length; right < s2.length; right++) {
    if (matches === 26) return true;

    const addIdx = s2.charCodeAt(right) - 97;
    winCount[addIdx]++;
    if (winCount[addIdx] === s1Count[addIdx]) matches++;
    else if (winCount[addIdx] === s1Count[addIdx] + 1) matches--;

    const remIdx = s2.charCodeAt(right - s1.length) - 97;
    winCount[remIdx]--;
    if (winCount[remIdx] === s1Count[remIdx]) matches++;
    else if (winCount[remIdx] === s1Count[remIdx] - 1) matches--;
  }

  return matches === 26;
}
```

### Karmaşıklık

- **Zaman:** O(n). İlk pencere kurulumu ve `matches` hesabı sonrasında `s2` üzerindeki her kaydırma adımı O(1) zamanda tamamlanır.
- **Alan:** O(1). Yalnızca 26 elemanlı iki sabit frekans dizisi kullanılır.

## Testler

```json
[
  { "args": ["ab", "eidbaooo"], "expected": true, "sample": true },
  { "args": ["ab", "eidboaoo"], "expected": false, "sample": true },
  { "args": ["adc", "dcda"], "expected": true },
  { "args": ["hello", "ooolleoooleh"], "expected": false },
  { "args": ["a", "a"], "expected": true },
  { "args": ["abc", "ab"], "expected": false },
  { "args": ["aab", "baa"], "expected": true },
  { "args": ["xyz", "afdgzyxksldfm"], "expected": true }
]
```
