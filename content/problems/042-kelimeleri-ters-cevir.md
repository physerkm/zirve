---
title: Kelimeleri Ters Çevir
difficulty: medium
tags: [dizgi, iki-isaretci]
function: reverseWords
params:
  - { name: s, type: "string" }
returns: "string"
---
Bir dizgi `s` veriliyor. Dizgideki **kelimelerin sırasını** ters çevirin.

Kelime, boşluk içermeyen karakterlerin oluşturduğu parçadır; kelimeler birbirinden en az bir boşlukla ayrılır.

Kelimeleri ters sırada ve aralarında **tek bir boşluk** olacak biçimde birleştirip döndürün. `s`'nin başında, sonunda ya da kelimelerin arasında fazladan boşluklar olabilir; sonuçta fazladan boşluk bulunmamalıdır.

### Örnek 1

```text
Girdi:  s = "the sky is blue"
Çıktı:  "blue is sky the"
```

### Örnek 2

```text
Girdi:  s = "  hello world  "
Çıktı:  "world hello"
Açıklama: Baştaki ve sondaki boşluklar sonuçta yer almaz.
```

### Örnek 3

```text
Girdi:  s = "a good   example"
Çıktı:  "example good a"
Açıklama: Kelimeler arasındaki birden fazla boşluk teke iner.
```

### Kısıtlar

- `1 <= s.length <= 10^4`
- `s` İngilizce harfler, rakamlar ve boşluklardan oluşur.
- `s` içinde en az bir kelime vardır.

## İpuçları

- İşi üç adıma bölün: kelimeleri ayır, sırayı çevir, yeniden birleştir.
- Boşluklardan bölerken art arda gelen boşluklar boş parçalar üretir. Onları eleyin.
- Bir diziyi ters çevirmek için iki işaretçi yeter: baştaki ve sondaki elemanları değiştirip ortaya doğru ilerleyin.

## Çözüm

Problem üç küçük adıma ayrılır:

1. **Böl:** Dizgiyi boşluklardan kes. Art arda gelen boşluklar, aralarında boş parçalar (`""`) bırakır; bunlar atılır. Baştaki ve sondaki boşluklar da aynı şekilde kaybolur.
2. **Çevir:** Kelime dizisini yerinde ters çevir. İlk kelime sonuncuyla, ikinci sondan ikinciyle yer değiştirir ve böyle ortaya kadar gidilir.
3. **Birleştir:** Kelimeleri aralarına tek boşluk koyarak birleştir. Başa ya da sona boşluk eklenmez.

C#'ta `StringSplitOptions.RemoveEmptyEntries` boş parçaları bölme sırasında atar; TypeScript'te aynı iş `filter` ile yapılır.

```csharp solution
public class Solution
{
    public string ReverseWords(string s)
    {
        // Her boşluktan kes. Art arda boşluklar arada boş parçalar ("") bırakır; onları at.
        string[] words = s.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        // Kelime sırasını yerinde çevir: ilk kelime sonuncuyla yer değiştirir, ortaya doğru böyle gider.
        Array.Reverse(words);

        // Kelimeler arasında tam bir boşluk; başta ve sonda boşluk yok.
        return string.Join(" ", words);
    }
}
```

```typescript solution
function reverseWords(s: string): string {
  const words = s.split(' ').filter((word) => word.length > 0);

  words.reverse();

  return words.join(' ');
}
```

### Karmaşıklık

- **Zaman:** O(n). Bölme, çevirme ve birleştirme dizgiyi birer kez gezer.
- **Alan:** O(n), kelime dizisi ve sonuç dizgisi için.

**Mülakatta devam sorusu:** "Hazır `Split` ve `Reverse` olmadan yapar mısın?" Bu durumda dizgiyi sondan başa gezip her kelimenin başını ve sonunu iki işaretçiyle bulur, kelimeleri sırayla sonuca eklersiniz. Karakter dizisi değiştirilebiliyorsa O(1) ek bellekli çözüm de vardır: önce bütün diziyi, sonra her kelimeyi kendi içinde ters çevirirsiniz.

## Testler

```json
[
  { "args": ["the sky is blue"], "expected": "blue is sky the", "sample": true },
  { "args": ["  hello world  "], "expected": "world hello", "sample": true },
  { "args": ["a good   example"], "expected": "example good a", "sample": true },
  { "args": ["tek"], "expected": "tek" },
  { "args": ["   tek   "], "expected": "tek" },
  { "args": ["a b"], "expected": "b a" },
  { "args": ["  Bob    Loves  Alice   "], "expected": "Alice Loves Bob" },
  { "args": ["1 22 333"], "expected": "333 22 1" },
  { "args": ["x  y"], "expected": "y x" }
]
```
