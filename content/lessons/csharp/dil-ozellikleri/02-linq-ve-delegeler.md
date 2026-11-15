---
title: Delegeler, Lambda ve LINQ
summary: Fonksiyonları değer olarak kullanmak. Func ve Action, closure tuzakları, LINQ'in ertelenmiş çalışması, IEnumerable ile IQueryable farkı.
minutes: 16
level: intermediate
---

## Delegeler

Delege, bir metodu gösteren **tip güvenli** bir referanstır. Metotları değişkenlere atamanızı, parametre olarak geçirmenizi ve döndürmenizi sağlar. Günlük kodda kendi delege tipinizi tanımlamanız nadiren gerekir; üç hazır aile neredeyse her durumu karşılar:

| Tip | İmza | Örnek |
| --- | --- | --- |
| `Action<T>` | Değer döndürmez | `Action<string> log = Console.WriteLine;` |
| `Func<T, TResult>` | Son tip parametresi dönüş tipidir | `Func<int, int> square = x => x * x;` |
| `Predicate<T>` | `bool` döndürür | `Predicate<int> isEven = x => x % 2 == 0;` |

```csharp
int Apply(int value, Func<int, int> transform) => transform(value);

Console.WriteLine(Apply(5, x => x * x));     // 25
```

`x => x * x` bir **lambda ifadesidir**: adsız bir metot. Derleyici onu hedef tipe göre bir delegeye (ya da aşağıda göreceğiniz gibi bir ifade ağacına) dönüştürür.

**Olaylar** (`event`), delegeler üzerine kurulu yayımla–abone ol mekanizmasıdır. `event` anahtar sözcüğü, dışarıdan yalnızca `+=` ve `-=` yapılmasına izin vererek delegeyi korur. Abonelikten çıkmayı unutmak, yayımcı aboneyi canlı tuttuğu için klasik bir **bellek sızıntısı** kaynağıdır.

## Closure: dış değişkeni yakalamak

Lambda, tanımlandığı kapsamdaki değişkenleri kullanabilir. Yakalanan şey değişkenin **o anki değeri değil, kendisidir**.

```csharp
var factor = 2;
Func<int, int> multiply = x => x * factor;

factor = 10;
Console.WriteLine(multiply(3));     // 30, 6 değil
```

Derleyici bunu sağlamak için yakalanan değişkeni gizli bir sınıfın alanına taşır. İki sonucu vardır: yakalanan değişkenin ömrü lambdanın ömrü kadar uzar ve her closure bir bellek ayırmadır.

Klasik tuzak, `for` döngüsünün değişkenini yakalamaktır:

```csharp
var actions = new List<Action>();
for (var i = 0; i < 3; i++)
{
    actions.Add(() => Console.Write(i));
}

foreach (var action in actions) action();     // 333
```

Bütün lambdalar **aynı** `i` değişkenini paylaşır ve döngü bittiğinde `i` 3'tür. Çözüm, her turda yeni bir değişken oluşturmaktır: `var copy = i;` ve lambdada `copy` kullanmak. `foreach` döngüsünde bu sorun yoktur; döngü değişkeni her turda yenidir.

## LINQ

LINQ, koleksiyonlar üzerinde bildirimsel sorgu yazmayı sağlar: **ne** istediğinizi söylersiniz, **nasıl** dolaşılacağını değil.

```csharp
var topCustomers = orders
    .Where(o => o.Total > 100)
    .GroupBy(o => o.CustomerId)
    .Select(g => new { CustomerId = g.Key, Spent = g.Sum(o => o.Total) })
    .OrderByDescending(x => x.Spent)
    .Take(5)
    .ToList();
```

Sık kullanılan işleçler:

| Amaç | İşleçler |
| --- | --- |
| Süzme | `Where`, `Distinct`, `Take`, `Skip`, `OfType` |
| Dönüştürme | `Select`, `SelectMany` (iç içe koleksiyonları düzleştirir) |
| Sıralama | `OrderBy`, `ThenBy`, `Reverse` |
| Gruplama / birleştirme | `GroupBy`, `Join`, `Zip` |
| Tek değer | `First`, `FirstOrDefault`, `Single`, `Any`, `All`, `Count`, `Sum`, `Max`, `Aggregate` |
| Somutlaştırma | `ToList`, `ToArray`, `ToDictionary`, `ToHashSet` |

`First` eleman yoksa istisna fırlatır; `FirstOrDefault` varsayılan değeri döndürür. `Single` **tam olarak bir** eleman bekler; birden fazlaysa da istisna fırlatır.

### Ertelenmiş çalışma

LINQ sorgusu tanımlandığında **çalışmaz**; yalnızca bir tarif oluşturur. Çalışma, sonuçlar istendiğinde olur: `foreach`, `ToList()`, `Count()`, `First()` gibi çağrılarda.

```csharp
var numbers = new List<int> { 1, 2, 3 };
var evens = numbers.Where(n => n % 2 == 0);     // henüz hiçbir şey çalışmadı

numbers.Add(4);
Console.WriteLine(evens.Count());               // 2: sorgu şimdi, güncel listeyle çalıştı
```

Bunun iki sonucu vardır:

**Çoklu dolaşma.** Aynı sorguyu iki kez dolaşmak, işi iki kez yapar. Kaynak pahalıysa (veritabanı, dosya, ağır hesap) bu ciddi bir performans hatasıdır.

```csharp
var expensive = items.Select(Compute);          // tarif

if (expensive.Any())                            // Compute çalıştı
{
    foreach (var x in expensive) { }            // Compute YENİDEN çalıştı
}

var materialized = items.Select(Compute).ToList();   // bir kez çalıştır, sonucu sakla
```

**Akış halinde işleme.** `Where` ve `Select` elemanları tek tek işler; ara koleksiyon oluşturmaz. `Take(5)` beşinci elemandan sonra kaynağı dolaşmayı bırakır. Buna karşın `OrderBy` ve `GroupBy` sonuç üretmeden önce bütün kaynağı okumak zorundadır.

Bu davranışın altında `yield return` vardır: derleyici, değerleri istendikçe üreten bir durum makinesi oluşturur.

```csharp
IEnumerable<int> Evens(IEnumerable<int> source)
{
    foreach (var n in source)
    {
        if (n % 2 == 0) yield return n;     // çağıran bir sonraki elemanı isteyene kadar burada bekler
    }
}
```

## IEnumerable ve IQueryable

Mülakatların gözde sorusudur ve gerçek dünyada en pahalı hatalardan birinin kaynağıdır.

| | `IEnumerable<T>` | `IQueryable<T>` |
| --- | --- | --- |
| Lambda neye dönüşür | Delege (derlenmiş kod) | **İfade ağacı** (kodun veri olarak gösterimi) |
| Nerede çalışır | Bellekte, sizin sürecinizde | Sağlayıcıda (ör. veritabanında, SQL olarak) |
| Tipik kaynak | `List<T>`, diziler | EF Core `DbSet<T>` |

```csharp
// SQL: SELECT ... WHERE total > 100   -> süzme veritabanında yapılır
var a = db.Orders.Where(o => o.Total > 100).ToList();

// SQL: SELECT * FROM orders           -> BÜTÜN tablo belleğe çekilir, süzme bellekte yapılır
var b = db.Orders.AsEnumerable().Where(o => o.Total > 100).ToList();
```

İkisi aynı sonucu verir; ama ikincisi milyonlarca satırı ağ üzerinden taşır. `IQueryable`'ı erken `IEnumerable`'a çevirmek (ör. bir metottan `IEnumerable` döndürmek, `ToList()` çağırıp sonra süzmek) bu hatanın en yaygın biçimidir.

`IQueryable`'da lambdanız SQL'e çevrilmek zorundadır; bu yüzden sorgu içinde kendi C# metotlarınızı çağıramazsınız: sağlayıcı onları çeviremez ve çalışma zamanında hata verir.

## Performans notları

- `Count() > 0` yerine `Any()` kullanın: ilk elemanda durur.
- Döngü içinde `list.Contains(x)` O(n)'dir; arama yapacaksanız önce `ToHashSet()` ile kümeye çevirin.
- LINQ, elle yazılmış döngüye göre biraz ek yük getirir (delege çağrıları, yineleyici ayırmaları). Çoğu kodda önemsizdir; ölçümle kanıtlanmış sıcak yollarda döngüye çevirin.

## Özet

- Delege, metoda tip güvenli referanstır; `Func` ve `Action` çoğu ihtiyacı karşılar.
- Closure değişkenin kendisini yakalar; `for` döngüsü değişkenine dikkat edin.
- LINQ ertelenmiş çalışır: sorgu, sonuç istendiğinde ve **her istendiğinde** çalışır. Gerekiyorsa `ToList()` ile somutlaştırın.
- `IQueryable` sorguyu veritabanına çevirir; `IEnumerable`'a erken geçmek bütün tabloyu belleğe çeker.
