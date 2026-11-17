---
title: Dizgileri Kodla ve Çöz
difficulty: medium
tags: [dizgi, tasarim]
kind: class
class: StringCodec
constructor: []
methods:
  - { name: encode, params: [{ name: strs, type: "string[]" }], returns: "string" }
  - { name: decode, params: [{ name: s, type: "string" }], returns: "List<string>" }
---
Bir dizgi listesini (`strs`) tek bir dizgiye kodlayan (`encode`) ve bu tek dizgiyi tekrar başlangıçtaki dizgi listesine çözen (`decode`) bir algoritma tasarlayın.

`StringCodec` sınıfını **uzunluk önekli paketleme (length-prefixed framing)** biçimiyle gerçekleyin:

- `StringCodec()` nesneyi başlatır.
- `string encode(string[] strs)` listedeki her dizgiyi `<uzunluk>#<dizgi>` biçiminde yazar ve hepsini ardışık olarak birleştirip döndürür (örneğin `["neet", "code"]` listesi `"4#neet4#code"` olarak kodlanır).
- `List<string> decode(string s)` `<uzunluk>#<dizgi>` biçiminde kodlanmış tek dizgiyi çözerek orijinal dizgi listesini döndürür.

Dizgiler `#` karakteri, rakamlar veya boş dizgi (`""`) dahil herhangi bir ASCII karakteri içerebilir.

### Örnek 1

```text
Girdi:
["StringCodec", "encode", "decode"]
[[], [["zirve", "mulakat", "hazirlik"]], ["5#zirve7#mulakat8#hazirlik"]]
Çıktı:
[null, "5#zirve7#mulakat8#hazirlik", ["zirve", "mulakat", "hazirlik"]]
Açıklama:
StringCodec codec = new StringCodec();
codec.encode(["zirve", "mulakat", "hazirlik"]); // "5#zirve7#mulakat8#hazirlik" döndürür
codec.decode("5#zirve7#mulakat8#hazirlik");    // ["zirve", "mulakat", "hazirlik"] döndürür
```

### Örnek 2

```text
Girdi:
["StringCodec", "encode", "decode"]
[[], [["a#b", "12#3", ""]], ["3#a#b4#12#30#"]]
Çıktı:
[null, "3#a#b4#12#30#", ["a#b", "12#3", ""]]
Açıklama: Dizgilerin içinde '#' veya sayı geçmesi çözme işlemini bozmaz; çünkü önce uzunluk okunur ve tam o kadar karakter alınır.
```

### Kısıtlar

- `0 <= strs.length < 100`
- `0 <= strs[i].length < 200`
- `strs[i]` herhangi bir olası karakteri içerebilir.

## İpuçları

- Dizgileri yalnızca `,` veya `#` gibi bir ayraçla birleştirirseniz, dizginin kendi içinde de o ayraç geçtiğinde nereye kadar okuyacağınızı bilemezsiniz.
- HTTP/1.1 `Content-Length` başlığında olduğu gibi, her parçanın başına **kaç karakter uzunluğunda olduğunu** yazmayı düşünün.
- Sadece uzunluğu yazmak yetmez (`"12"` uzunluğu 1 mi yoksa 12 mi?); uzunluk sayısının bittiği yeri belirtmek için uzunluktan hemen sonra `#` koyun: `<uzunluk>#<dizgi>`.
- Çözerken (`decode`), mevcut konumdan ilk `#` karakterine kadar olan sayıyı `length` olarak okuyun, ardından `#` işaretinden sonraki tam `length` karakteri kesip listeye ekleyin.

## Çözüm

Yalnızca özel bir ayraç karakteri kullanmak, o karakter girdi dizgilerinin içinde de geçebileceği için güvenli değildir. Bunun yerine ağ protokollerinde sıkça kullanılan **uzunluk önekli çerçeveleme (length-prefixed framing)** yöntemini kullanırız.

**Kodlama (`Encode`):**
Listedeki her `str` için önce `str.Length`, ardından `#` ayracı ve son olarak `str`'nin kendisi `StringBuilder`'a eklenir. Örneğin `"a#b"` dizgisi `"3#a#b"` olur.

**Çözme (`Decode`):**
Dizgi üzerinde `i = 0` işaretçisiyle ilerleriz:
1. `i` konumundan başlayarak ilk `#` karakterinin bulunduğu `j` indeksini buluruz.
2. `s[i..j]` alt dizgisini tam sayıya çevirerek dizginin uzunluğunu (`length`) elde ederiz.
3. `#` karakterinden hemen sonra başlayan `length` uzunluğundaki `s.Substring(j + 1, length)` parçasını sonuç listesine ekleriz (bu parçanın içinde `#` veya rakam olması artık hiçbir sorun yaratmaz).
4. İşaretçiyi bir sonraki paketin başına (`i = j + 1 + length`) taşırız.

```csharp solution
public class StringCodec
{
    public StringCodec()
    {
    }

    public string Encode(string[] strs)
    {
        StringBuilder sb = new StringBuilder();
        foreach (string str in strs)
        {
            sb.Append(str.Length).Append('#').Append(str);
        }
        return sb.ToString();
    }

    public IList<string> Decode(string s)
    {
        List<string> result = new List<string>();
        int i = 0;

        while (i < s.Length)
        {
            int j = i;
            while (s[j] != '#')
                j++;

            int length = int.Parse(s.Substring(i, j - i));
            int start = j + 1;
            result.Add(s.Substring(start, length));
            i = start + length;
        }

        return result;
    }
}
```

```typescript solution
class StringCodec {
  constructor() {}

  encode(strs: string[]): string {
    let encoded = "";
    for (const str of strs) {
      encoded += `${str.length}#${str}`;
    }
    return encoded;
  }

  decode(s: string): string[] {
    const result: string[] = [];
    let i = 0;

    while (i < s.length) {
      let j = i;
      while (s[j] !== "#") {
        j++;
      }

      const length = parseInt(s.slice(i, j), 10);
      const start = j + 1;
      result.push(s.slice(start, start + length));
      i = start + length;
    }

    return result;
  }
}
```

### Karmaşıklık

- **Zaman:** `encode` ve `decode` için **O(N)** (`N`, tüm dizgilerdeki toplam karakter sayısıdır). Her karakter sabit sayıda işlenir.
- **Alan:** Çıktı dizgisi ve listesi dışında **O(1)** ek bellek (çıktılar dahil **O(N)**).

## Testler

```json
[
  {
    "ops": ["StringCodec", "encode", "decode"],
    "args": [[], [["zirve", "mulakat", "hazirlik"]], ["5#zirve7#mulakat8#hazirlik"]],
    "expected": [null, "5#zirve7#mulakat8#hazirlik", ["zirve", "mulakat", "hazirlik"]],
    "sample": true
  },
  {
    "ops": ["StringCodec", "encode", "decode"],
    "args": [[], [["we", "say", ":", "yes"]], ["2#we3#say1#:3#yes"]],
    "expected": [null, "2#we3#say1#:3#yes", ["we", "say", ":", "yes"]],
    "sample": true
  },
  {
    "ops": ["StringCodec", "encode", "decode"],
    "args": [[], [["a#b", "12#3", ""]], ["3#a#b4#12#30#"]],
    "expected": [null, "3#a#b4#12#30#", ["a#b", "12#3", ""]],
    "sample": true
  },
  {
    "ops": ["StringCodec", "encode", "decode", "encode", "decode"],
    "args": [[], [[]], [""], [[""]], ["0#"]],
    "expected": [null, "", [], "0#", [""]]
  },
  {
    "ops": ["StringCodec", "encode", "decode"],
    "args": [[], [["", "#", "##", ""]], ["0#1##2###0#"]],
    "expected": [null, "0#1##2###0#", ["", "#", "##", ""]]
  },
  {
    "ops": ["StringCodec", "encode", "decode"],
    "args": [[], [["0123456789abcdef", "xy"]], ["16#0123456789abcdef2#xy"]],
    "expected": [null, "16#0123456789abcdef2#xy", ["0123456789abcdef", "xy"]]
  }
]
```
