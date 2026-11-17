---
title: Bölüm Etiketleri
difficulty: medium
tags: [acgozlu, iki-isaretci, dizgi]
function: partitionLabels
params:
  - { name: s, type: "string" }
returns: "List<int>"
---
Size küçük İngilizce harflerden oluşan bir `s` dizgisi veriliyor. Bu dizgiyi, **her harfin en fazla bir parçada** görüneceği şekilde mümkün olduğunca çok sayıda alt parçaya ayırmak istiyoruz.

Parçalar sırasıyla uç uca birleştirildiğinde yine orijinal `s` dizgisini vermelidir.

Oluşturulan bu parçaların uzunluklarını sırasıyla içeren bir liste döndürün.

### Örnek 1

```text
Girdi:  s = "ababcbacadefegdehijhklij"
Çıktı:  [9, 7, 8]
Açıklama:
Parçalar "ababcbaca", "defegde" ve "hijhklij" şeklindedir.
Her harf yalnızca tek bir parçada yer alır.
Daha az parçaya bölmek (örneğin ["ababcbacadefegde", "hijhklij"]) mümkün olsa da biz en fazla sayıda parçayı istiyoruz.
```

### Örnek 2

```text
Girdi:  s = "eccbbbbdec"
Çıktı:  [10]
Açıklama: İlk harf olan 'e' en son 8. indekste, o aralıktaki 'c' ise 9. indekste geçtiği için dizgi bölünemez.
```

### Kısıtlar

- `1 <= s.length <= 500`
- `s` yalnızca küçük İngilizce harflerden (`'a'` - `'z'`) oluşur.

## İpuçları

- Bir parçaya `'a'` harfini dahil ettiğiniz anda, `'a'` harfinin dizgide **son görüldüğü** indekse kadar olan tüm karakterleri de aynı parçaya dahil etmek zorundasınız.
- Bu yüzden önce dizgiyi bir kez tarayıp her harfin son görüldüğü indeksi `last` tablosuna kaydedin.
- İkinci geçişte mevcut parçanın bitmesi gereken en uzak sınırı `end = Math.Max(end, last[s[i] - 'a'])` ile takip edin.
- Gezdiğiniz indeks `i == end` olduğunda, şu ana kadar gördüğünüz hiçbir harf `end`'den sonra tekrar etmiyor demektir; parçayı tam buradan kesebilirsiniz!

## Çözüm

Bir parçanın nerede bitebileceğini belirleyen şey, o parçanın içindeki harflerin dizgide **en son nerede görüldüğüdür**. Örneğin parçanın başında `'a'` harfi varsa ve `'a'` en son 8. indekste geçiyorsa, ilk parça en erken 8. indekste bitebilir. Üstelik `0..8` aralığında yürürken gördüğümüz başka bir harf (örneğin `'c'`) 12. indekste tekrar ediyorsa, parçanın son sınırı en az 12'ye uzamak zorundadır.

Bu açgözlü (greedy) fikri iki adımda uygularız:

1. **Son indeksleri kaydet:** Dizgiyi baştan sona bir kez tarayarak her harfin son görüldüğü indeksi `last[26]` dizisine yazarız.
2. **Parçaları sınırla:** `start = 0` ve `end = 0` işaretçileriyle dizgiyi tekrar gezeriz. Her `i` adımında:
   - `end = Math.Max(end, last[s[i] - 'a'])` ile mevcut parçanın uzaması gereken en sağ sınırı güncelleriz.
   - `i == end` olduğu anda, `[start..end]` aralığındaki bütün harflerin son görünümlerine ulaşmışızdır ve bu harflerin hiçbiri `end`'den sonra bir daha karşımıza çıkmaz. Parçayı mümkün olan en erken yerde keser, uzunluğu olan `end - start + 1` değerini sonuca ekler ve yeni parçayı `start = i + 1` ile başlatırız.

```csharp solution
public class Solution
{
    public IList<int> PartitionLabels(string s)
    {
        int[] last = new int[26];
        for (int i = 0; i < s.Length; i++)
        {
            last[s[i] - 'a'] = i;
        }

        List<int> result = new List<int>();
        int start = 0, end = 0;

        for (int i = 0; i < s.Length; i++)
        {
            end = Math.Max(end, last[s[i] - 'a']);

            if (i == end)
            {
                result.Add(end - start + 1);
                start = i + 1;
            }
        }

        return result;
    }
}
```

```typescript solution
function partitionLabels(s: string): number[] {
  const last = new Array<number>(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    last[s.charCodeAt(i) - 97] = i;
  }

  const result: number[] = [];
  let start = 0;
  let end = 0;

  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s.charCodeAt(i) - 97]);
    if (i === end) {
      result.push(end - start + 1);
      start = i + 1;
    }
  }

  return result;
}
```

### Karmaşıklık

- **Zaman:** O(n). Dizgi biri son konumları bulmak, diğeri parçaları kesmek için olmak üzere toplam iki kez baştan sona taranır.
- **Alan:** O(1). Harfler yalnızca 26 küçük İngilizce karakterden oluştuğu için `last` dizisi sabit (26 elemanlı) bellek kullanır.

## Testler

```json
[
  { "args": ["ababcbacadefegdehijhklij"], "expected": [9, 7, 8], "sample": true },
  { "args": ["eccbbbbdec"], "expected": [10], "sample": true },
  { "args": ["abc"], "expected": [1, 1, 1] },
  { "args": ["aaaa"], "expected": [4] },
  { "args": ["abacbc"], "expected": [6] },
  { "args": ["caedbdedda"], "expected": [1, 9] },
  { "args": ["z"], "expected": [1] }
]
```
