---
title: Geçerli Kelime Kısaltması
difficulty: easy
tags: [dizgi, iki-isaretci]
function: validWordAbbreviation
params:
  - { name: word, type: "string" }
  - { name: abbr, type: "string" }
returns: "bool"
---
Bir dizgi, birbirine **bitişik olmayan**, boş olmayan alt dizgilerinin uzunluklarıyla değiştirilerek kısaltılabilir. Uzunluklar **baştaki sıfırlarla** yazılmamalıdır.

Örneğin `"substitution"` şöyle kısaltılabilir:

- `"s10n"` (`"s ubstitutio n"`)
- `"sub4u4"` (`"sub stit u tion"`)
- `"12"` (`"substitution"`)
- `"substitution"` (hiçbir şey değiştirilmeden)

Şunlar **geçersizdir**: `"s55n"` (değiştirilen alt dizgiler bitişik), `"s010n"` (baştaki sıfır), `"s0ubstitution"` (boş alt dizgi).

Bir kelime `word` ve bir kısaltma `abbr` veriliyor. `abbr`, `word`'ün geçerli bir kısaltmasıysa `true` döndürün.

### Örnek 1

```text
Girdi:  word = "internationalization", abbr = "i12iz4n"
Çıktı:  true
```

### Örnek 2

```text
Girdi:  word = "apple", abbr = "a2e"
Çıktı:  false
```

### Kısıtlar

- `1 <= word.length <= 20`, `word` küçük harflerden oluşur.
- `1 <= abbr.length <= 10`, `abbr` küçük harfler ve rakamlardan oluşur.
- `abbr` içindeki her sayı 32 bitlik tam sayıya sığar.

## İpuçları

- İki işaretçi kullanın: biri `word`'de, biri `abbr`'de.
- `abbr`'de harf görürseniz `word`'deki harfle aynı olmalı. Rakam görürseniz bütün sayıyı okuyun ve `word`'de o kadar ilerleyin.
- Sayı `0` ile başlıyorsa kısaltma geçersizdir. Sonda iki işaretçi de dizgilerin sonuna aynı anda varmalıdır.

## Çözüm

### İki işaretçi

`i`, `word`'deki; `j`, `abbr`'deki konumdur.

- `abbr[j]` bir harfse `word[i]` ile eşleşmeli; ikisi de bir ilerler.
- `abbr[j]` bir rakamsa: `'0'` ise geçersizdir (baştaki sıfır ya da boş alt dizgi). Değilse rakamlar bitene kadar sayı okunur ve `i` o kadar ilerletilir. `i` kelimenin dışına taşarsa geçersizdir.

Sonunda `i == word.Length && j == abbr.Length` olmalıdır. Bitişik iki sayı `abbr`'de tek bir sayı olarak okunacağı için ayrıca kontrol gerekmez (`"s55n"` → `55`, kelimeyi aşar).

```csharp solution
public class Solution
{
    public bool ValidWordAbbreviation(string word, string abbr)
    {
        var i = 0;
        var j = 0;

        while (i < word.Length && j < abbr.Length)
        {
            if (char.IsDigit(abbr[j]))
            {
                if (abbr[j] == '0')
                {
                    return false;
                }

                var skip = 0;
                while (j < abbr.Length && char.IsDigit(abbr[j]))
                {
                    skip = skip * 10 + (abbr[j] - '0');
                    j++;
                }

                i += skip;
            }
            else
            {
                if (word[i] != abbr[j])
                {
                    return false;
                }

                i++;
                j++;
            }
        }

        return i == word.Length && j == abbr.Length;
    }
}
```

```typescript solution
function validWordAbbreviation(word: string, abbr: string): boolean {
  let i = 0;
  let j = 0;
  const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

  while (i < word.length && j < abbr.length) {
    if (isDigit(abbr[j])) {
      if (abbr[j] === '0') return false;
      let skip = 0;
      while (j < abbr.length && isDigit(abbr[j])) {
        skip = skip * 10 + Number(abbr[j]);
        j++;
      }
      i += skip;
    } else {
      if (word[i] !== abbr[j]) return false;
      i++;
      j++;
    }
  }

  return i === word.length && j === abbr.length;
}
```

### Karmaşıklık

- **Zaman:** O(|abbr|). `word`'de sayılar sayesinde atlanarak ilerlenir.
- **Alan:** O(1).

## Testler

```json
[
  { "args": ["internationalization", "i12iz4n"], "expected": true, "sample": true },
  { "args": ["apple", "a2e"], "expected": false, "sample": true },
  { "args": ["substitution", "s10n"], "expected": true },
  { "args": ["substitution", "sub4u4"], "expected": true },
  { "args": ["substitution", "12"], "expected": true },
  { "args": ["substitution", "s55n"], "expected": false },
  { "args": ["substitution", "s010n"], "expected": false },
  { "args": ["substitution", "s0ubstitution"], "expected": false },
  { "args": ["a", "2"], "expected": false },
  { "args": ["word", "word"], "expected": true }
]
```
