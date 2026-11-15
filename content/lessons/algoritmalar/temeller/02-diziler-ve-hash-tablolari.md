---
title: Diziler ve Hash Tabloları
summary: Mülakat sorularının yarısından fazlasında kullanılan iki veri yapısı. Nasıl çalışırlar, hangi işlem ne kadar sürer ve hash tablosuyla O(n²) çözümler nasıl O(n)'e iner.
minutes: 14
level: beginner
---

Kodlama mülakatlarında en sık kullanacağınız iki araç dizi ve hash tablosudur. Çoğu "kolay" ve "orta" problem, bu ikisinin doğru kullanımına dayanır.

## Diziler

Dizi, elemanları bellekte **yan yana** tutar. Bu yüzden `i`. elemanın adresi doğrudan hesaplanır ve erişim sabit zamanlıdır. Bedeli: araya eleman eklemek ya da aradan silmek, sonraki bütün elemanları kaydırmayı gerektirir.

| İşlem | Karmaşıklık |
| --- | --- |
| İndeksle erişim / güncelleme | O(1) |
| Sona ekleme (dinamik dizi) | O(1) amortize |
| Başa ya da araya ekleme / silme | O(n) |
| Değere göre arama (sırasız) | O(n) |
| Değere göre arama (sıralı, ikili arama) | O(log n) |

Dillerdeki karşılıkları:

| | Sabit boyutlu | Dinamik |
| --- | --- | --- |
| C# | `int[]` | `List<int>` |
| JavaScript / TypeScript | — | `Array` (`number[]`) |

Yan yana duran veri, işlemci önbelleğini iyi kullanır. Bu yüzden pratikte bir diziyi gezmek, aynı sayıda elemanı olan bağlı listeyi gezmekten belirgin biçimde hızlıdır; Big-O bunu göstermez.

### Dizgiler de dizidir, ama değişmezdir

C# ve JavaScript'te dizgiler **değişmezdir** (immutable). Bir karakteri değiştirmek ya da iki dizgiyi birleştirmek yeni bir dizgi oluşturur. Döngü içinde `+=` ile birleştirme bu yüzden O(n²)'dir.

```csharp
// Kötü: her adımda o ana kadarki bütün dizgi kopyalanır.
var result = "";
foreach (var part in parts) result += part;

// İyi: O(n)
var builder = new StringBuilder();
foreach (var part in parts) builder.Append(part);
var result2 = builder.ToString();
```

JavaScript'te karşılığı parçaları bir dizide toplayıp `parts.join('')` demektir.

## Hash tabloları

Hash tablosu anahtar–değer çiftlerini saklar ve anahtara göre arama, ekleme, silme işlemlerini **ortalama O(1)** zamanda yapar.

Çalışma biçimi:

1. Anahtar bir **hash fonksiyonundan** geçirilip bir tam sayıya çevrilir.
2. Bu sayı, tablonun iç dizisindeki bir **kovaya** (bucket) eşlenir: `indeks = hash % kapasite`.
3. Değer o kovaya yazılır.

İki farklı anahtar aynı kovaya düşerse **çakışma** (collision) olur. Çakışmalar genellikle kovada küçük bir liste tutarak (zincirleme) ya da boş bir komşu kovaya bakarak (açık adresleme) çözülür. Tablo dolmaya başladığında kapasite büyütülür ve bütün elemanlar yeniden yerleştirilir; bu yüzden ekleme "amortize" O(1)'dir.

| İşlem | Ortalama | En kötü |
| --- | --- | --- |
| Arama / ekleme / silme | O(1) | O(n) |

En kötü durum, bütün anahtarların aynı kovaya düşmesidir. İyi bir hash fonksiyonuyla pratikte görülmez; mülakatta "ortalama O(1)" demeniz yeterlidir, ama en kötü durumu bildiğinizi göstermek artıdır.

| | Anahtar → değer | Yalnızca anahtar (küme) |
| --- | --- | --- |
| C# | `Dictionary<TKey, TValue>` | `HashSet<T>` |
| JavaScript / TypeScript | `Map` | `Set` |

JavaScript'te düz nesne (`{}`) yerine `Map` kullanın: anahtarlar yalnızca dizgi olmak zorunda değildir, ekleme sırası korunur ve `size` sabit zamanlıdır.

### Anahtar olabilmenin koşulu

Bir tipin hash tablosunda anahtar olarak doğru çalışması için eşit iki değerin **aynı hash'i** üretmesi gerekir. C#'ta kendi sınıfınızı anahtar yapacaksanız `Equals` ve `GetHashCode` metotlarını birlikte ezmelisiniz (ya da bunu sizin yerinize yapan `record` kullanmalısınız). Anahtar tabloya eklendikten sonra değiştirilirse bir daha bulunamaz; anahtarlar değişmez olmalıdır.

JavaScript'te `Map` nesneleri **kimliğe** göre karşılaştırır: `map.get([1, 2])` içeriği aynı olan başka bir diziyi bulamaz. Bileşik anahtar gerektiğinde değerleri bir dizgiye çevirin: `` `${row},${col}` ``.

## Hash tablosunun çözdüğü üç soru

**1. "Bunu daha önce gördüm mü?"** Küme kullanın.

```typescript
function hasDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}
```

**2. "Bu kaç kez geçti?"** Frekans tablosu kullanın.

```csharp
var counts = new Dictionary<char, int>();
foreach (var c in text)
{
    counts[c] = counts.GetValueOrDefault(c) + 1;
}
```

İki dizginin anagram olup olmadığı, en sık geçen `k` eleman, ilk tekrarsız karakter gibi sorular bu kalıbın çeşitlemeleridir.

**3. "Aradığım tamamlayıcı nerede?"** Değerden indekse (ya da başka bir bilgiye) eşleme tutun.

İki sayının toplamı probleminde her `x` için `hedef - x` değerinin daha önce geçip geçmediğine bakılır. İç içe iki döngü yerine tek geçiş yeterli olur: O(n²) → O(n).

Ortak fikir şudur: **"geriye dönüp aramak" yerine, gördüklerinizi aranabilir biçimde saklayın.**

## Hash tablosu ne zaman yetmez

Hash tablosu anahtarları sıralı tutmaz. Şunlar gerekiyorsa başka bir yapı seçin:

- **Sıralı dolaşma, en küçük/en büyük anahtar, aralık sorgusu:** dengeli ağaç (`SortedDictionary`, `SortedSet`), işlemler O(log n).
- **Sürekli en küçük/en büyük elemanı çekmek:** heap (`PriorityQueue`).
- **Anahtarlar küçük bir tam sayı aralığındaysa** (ör. 26 küçük harf): düz bir dizi hem daha hızlı hem daha yalındır.

```csharp
var counts = new int[26];
foreach (var c in word) counts[c - 'a']++;
```

## Sık yapılan hatalar

- **Gezerken değiştirmek.** Bir koleksiyonu `foreach` ile gezerken eleman ekleyip çıkarmak C#'ta istisna fırlatır, JavaScript'te beklenmedik sonuç verir.
- **`Contains` maliyetini unutmak.** `List.Contains` ve `Array.includes` O(n)'dir. Döngü içinde çağırıyorsanız kümeye çevirin.
- **Var olmayan anahtarı okumak.** C#'ta `dict[key]` anahtar yoksa istisna fırlatır; `TryGetValue` ya da `GetValueOrDefault` kullanın. JavaScript'te `map.get(key)` `undefined` döndürür; değerin kendisi `0` olabileceği için `if (map.get(key))` yerine `map.has(key)` ile sınayın.
- **Sınır hataları.** Boş dizi, tek elemanlı dizi ve dizinin son indeksi her zaman ayrıca düşünülmelidir.

## Özet

- Dizi: O(1) erişim, O(n) araya ekleme. Dizgiler değişmezdir; döngüde birleştirmeyin.
- Hash tablosu: ortalama O(1) arama, ekleme, silme; sıra tutmaz.
- Üç temel kullanım: üyelik (küme), frekans sayma, tamamlayıcıyı bulma.
- "İç içe döngüyle arıyorum" dediğiniz her yerde hash tablosunu düşünün.
