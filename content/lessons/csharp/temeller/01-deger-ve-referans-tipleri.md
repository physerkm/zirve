---
title: Değer ve Referans Tipleri
summary: C# tip sisteminin temeli. struct ile class farkı, yığın ve öbek, kopyalama davranışı, boxing, ref/out/in ve record tipleri.
minutes: 15
level: beginner
---

"`struct` ile `class` arasındaki fark nedir?" C# mülakatlarının en klasik sorusudur. İyi bir yanıt "biri yığında biri öbekte" demekle bitmez; **atama ve parametre geçirme davranışını** anlatır.

## Temel fark: kopyalama

- **Değer tipi:** değişken, verinin **kendisini** tutar. Atama veriyi kopyalar.
- **Referans tipi:** değişken, öbekteki nesneye bir **referans** tutar. Atama referansı kopyalar; iki değişken aynı nesneyi gösterir.

```csharp
struct PointStruct { public int X; }
class PointClass { public int X; }

var a = new PointStruct { X = 1 };
var b = a;          // veri kopyalandı
b.X = 99;
Console.WriteLine(a.X);   // 1

var c = new PointClass { X = 1 };
var d = c;          // referans kopyalandı; c ve d aynı nesne
d.X = 99;
Console.WriteLine(c.X);   // 99
```

| | Değer tipleri | Referans tipleri |
| --- | --- | --- |
| Örnekler | `int`, `double`, `bool`, `char`, `decimal`, `DateTime`, `Guid`, `enum`, `struct`, demetler (tuple) | `class`, `string`, diziler, `delegate`, `interface`, `record` (varsayılan) |
| Atama | Değeri kopyalar | Referansı kopyalar |
| Varsayılan değer | Bütün alanları sıfır | `null` |
| Eşitlik (varsayılan) | Alan alan karşılaştırma | Referans (kimlik) karşılaştırma |
| Kalıtım | Yok (arayüz uygulayabilir) | Var |

`string` referans tipidir ama **değişmezdir** ve eşitliği içeriğe göre çalışır; bu yüzden değer tipi gibi davranıyor izlenimi verir.

## Yığın ve öbek: yaygın yanlış

"Değer tipleri yığında, referans tipleri öbekte durur" ifadesi **eksiktir**. Doğrusu:

- Referans tipinin **nesnesi** her zaman öbektedir (heap).
- Değer tipi, **nerede tanımlandıysa oradadır**: yerel değişkense genellikle yığında (stack); bir sınıfın alanıysa o nesneyle birlikte **öbekte**; bir dizinin elemanıysa dizinin içinde, yani öbekte.

```csharp
class Order
{
    public int Quantity;      // değer tipi, ama Order nesnesinin içinde: öbekte
}
```

Nerede durduğu bir uygulama ayrıntısıdır; dilin garanti ettiği şey **kopyalama semantiğidir**. Mülakatta bu ayrımı yapmak sizi öne çıkarır.

## Parametre geçirme

C#'ta parametreler varsayılan olarak **değerle** geçirilir. Bu, referans tiplerinde **referansın kopyası** demektir: metot nesnenin içini değiştirebilir, ama çağıranın değişkenini başka bir nesneye bağlayamaz.

```csharp
void Mutate(List<int> list) => list.Add(1);            // çağıran bunu görür
void Reassign(List<int> list) => list = new List<int>(); // çağıran bunu GÖRMEZ

var numbers = new List<int>();
Mutate(numbers);     // Count == 1
Reassign(numbers);   // Count hâlâ 1
```

Değişkenin kendisini geçirmek için üç anahtar sözcük vardır:

| Sözcük | Anlamı | Tipik kullanım |
| --- | --- | --- |
| `ref` | Okunur ve yazılır; çağıran önceden atamış olmalı | Yerinde değiştirme, `Swap` |
| `out` | Metot atamak **zorundadır**; çağıranın ataması gerekmez | `int.TryParse(text, out var value)` |
| `in` | Salt okunur referans | Büyük `struct`'ları kopyalamadan geçirme |

## Boxing ve unboxing

Bir değer tipi `object` ya da bir arayüz tipine atandığında, değer öbekte yeni bir nesnenin içine **kopyalanır**: buna boxing denir. Geri almak unboxing'dir.

```csharp
int n = 42;
object boxed = n;          // boxing: öbekte ayırma + kopyalama
int back = (int)boxed;     // unboxing: tip denetimi + kopyalama
```

Her boxing bir bellek ayırmadır ve çöp toplayıcıya iş çıkarır. Sıcak döngülerde fark edilir. Gizli boxing kaynakları:

- Generic olmayan koleksiyonlar (`ArrayList`, `Hashtable`). Generic koleksiyonlar (`List<int>`) bu sorunu çözmek için vardır.
- `string.Format("{0}", 42)` ya da `object` parametre alan her metot.
- Bir `struct`'ı arayüz tipinde değişkene atamak.

Bir incelik: kutulanmış değer bir **kopyadır**. Kutuyu değiştirmek özgün değişkeni etkilemez.

## struct ne zaman kullanılır

Varsayılan seçiminiz `class` olsun. `struct` şu koşulların **hepsi** sağlanıyorsa düşünülür:

- Mantıksal olarak **tek bir değeri** temsil ediyor (koordinat, para tutarı, tarih aralığı).
- Küçük (kabaca 16–24 bayta kadar); büyük `struct`'ları kopyalamak pahalıdır.
- **Değişmez** (immutable). Değişebilen `struct`'lar, kopya üzerinde yapılan değişikliğin kaybolması gibi şaşırtıcı hatalara yol açar.

```csharp
public readonly record struct Money(decimal Amount, string Currency);
```

`readonly struct` değişmezliği derleyiciye denetletir ve gereksiz savunma kopyalarını önler.

## record: değer semantiğiyle referans tipi

`record`, verinin kendisiyle tanımlanan tipler için tasarlanmıştır. Derleyici sizin yerinize değere dayalı `Equals`/`GetHashCode`, okunaklı `ToString` ve `with` ifadesiyle kopyalama üretir.

```csharp
public record Person(string Name, int Age);

var ada = new Person("Ada", 36);
var same = new Person("Ada", 36);
Console.WriteLine(ada == same);          // True: içerik karşılaştırılır

var older = ada with { Age = 37 };       // yeni nesne; ada değişmedi
```

| | `class` | `record` (class) | `record struct` |
| --- | --- | --- | --- |
| Tip türü | Referans | Referans | Değer |
| `==` varsayılanı | Kimlik | İçerik | İçerik |
| Tipik kullanım | Davranışı ve kimliği olan varlıklar | DTO'lar, değer nesneleri | Küçük, sık kopyalanan değerler |

## Null olabilirlik

- `int?` (`Nullable<int>`), değer tipine "değer yok" durumunu ekleyen bir `struct`'tır.
- `string?`, null olabilen referans tipleri özelliğiyle derleyiciye "bu null olabilir" bilgisini verir. Çalışma zamanında bir fark yaratmaz; derleme zamanında uyarı üretir ve `NullReferenceException` hatalarının çoğunu yazım aşamasında yakalar.

```csharp
string? name = FindName();
var length = name?.Length ?? 0;      // null ise 0
```

## Özet

- Değer tipleri kopyalanır; referans tipleri paylaşılır. Asıl fark budur, bellek konumu değil.
- Parametreler değerle geçer; referans tiplerinde kopyalanan şey referanstır. `ref`, `out`, `in` değişkenin kendisini geçirir.
- Boxing gizli bellek ayırmadır; generic koleksiyonlar bunu önler.
- `struct`: küçük, değişmez, tek değer. Emin değilseniz `class`.
- `record`: içerik eşitliği ve `with` ile değişmez veri modelleri.
