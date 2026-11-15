---
title: Karmaşıklık Analizi (Big-O)
summary: Bir çözümün girdi büyüdükçe nasıl ölçeklendiğini ölçmenin dili. Zaman ve alan karmaşıklığı, sık görülen sınıflar ve mülakatta analiz yapmanın yolu.
minutes: 15
level: beginner
---

Mülakatta yazdığınız her çözüm için size iki soru sorulur: "Zaman karmaşıklığı nedir?" ve "Alan karmaşıklığı nedir?". Bu sorulara net yanıt veremeyen bir aday, kod doğru olsa bile zayıf puan alır. İyi haber: gereken matematik azdır ve birkaç kalıp öğrenmek çoğu durumu çözer.

## Big-O ne söyler

Big-O, bir algoritmanın yaptığı iş miktarının **girdi boyutu büyürken nasıl büyüdüğünü** söyler. Saniyeyi değil, büyüme hızını ölçer. İki sadeleştirme kuralı vardır:

1. **Sabit çarpanlar atılır.** `3n` adım atan algoritma da `n/2` adım atan algoritma da O(n)'dir.
2. **Baskın terim kalır.** `n² + 100n + 5` ifadesi O(n²)'dir; `n` büyüdükçe diğer terimler önemsizleşir.

Big-O teknik olarak bir **üst sınırdır**. Mülakatlarda aksi söylenmedikçe **en kötü durum** kastedilir.

## Sık görülen sınıflar

| Karmaşıklık | Ad | Tipik örnek | n = 1.000.000 için adım |
| --- | --- | --- | --- |
| O(1) | Sabit | Diziye indeksle erişim, hash tablosunda arama | 1 |
| O(log n) | Logaritmik | İkili arama, dengeli ağaçta arama | ~20 |
| O(n) | Doğrusal | Diziyi bir kez gezmek | 1.000.000 |
| O(n log n) | Doğrusal-logaritmik | Verimli sıralama (merge sort, quicksort ortalama) | ~20.000.000 |
| O(n²) | Karesel | Bütün çiftleri denemek | 10¹² |
| O(2ⁿ) | Üstel | Bütün alt kümeleri üretmek | hesaplanamaz |
| O(n!) | Faktöriyel | Bütün sıralanışları üretmek | hesaplanamaz |

Kaba bir kural: modern bir işlemci saniyede 10⁸ civarında basit işlem yapar. Kısıtlarda `n ≤ 10⁵` görüyorsanız O(n²) çözüm (10¹⁰ işlem) geçmez; O(n log n) ya da O(n) aramalısınız. `n ≤ 20` görüyorsanız üstel bir çözüm bekleniyor olabilir.

## Koddan karmaşıklık okumak

**Ardışık bloklar toplanır, iç içe bloklar çarpılır.**

```csharp
// O(n) + O(n) = O(n)
foreach (var x in items) Console.WriteLine(x);
foreach (var x in items) Console.WriteLine(x * 2);

// O(n) * O(n) = O(n²)
foreach (var a in items)
    foreach (var b in items)
        Console.WriteLine(a + b);
```

**Döngü değişkeni her adımda ikiye katlanıyor ya da yarılanıyorsa logaritma vardır.**

```csharp
// i: 1, 2, 4, 8, ... n  ->  O(log n)
for (var i = 1; i < n; i *= 2) { }
```

**İç döngünün sınırı dış döngüye bağlıysa toplamı hesaplayın.**

```csharp
// İç döngü 0, 1, 2, ..., n-1 kez döner: n(n-1)/2  ->  O(n²)
for (var i = 0; i < n; i++)
    for (var j = 0; j < i; j++) { }
```

**Farklı girdiler farklı harflerle gösterilir.** İki ayrı diziyi iç içe gezen kod O(n²) değil, O(a · b)'dir. Bu ayrımı yapmak mülakatta fark yaratır.

**Gizli maliyetlere dikkat edin.** Tek satırlık bir kütüphane çağrısı sabit zamanlı olmayabilir:

```csharp
// list.Contains O(n) olduğu için bu döngü O(n²)'dir.
foreach (var x in items)
    if (list.Contains(x)) count++;

// Döngü içinde dizgi birleştirmek her seferinde yeni dizgi kopyalar: O(n²).
var s = "";
foreach (var word in words) s += word;      // StringBuilder kullanın
```

## Özyinelemenin analizi

Özyinelemeli bir fonksiyonun maliyeti kabaca **çağrı sayısı × çağrı başına iş**tir. Çağrı ağacını çizmek en güvenilir yöntemdir.

```csharp
int Fib(int n) => n < 2 ? n : Fib(n - 1) + Fib(n - 2);
```

Her çağrı iki çağrı üretir, ağacın derinliği `n` olur: yaklaşık 2ⁿ düğüm, yani O(2ⁿ) zaman. **Alan** ise ağacın toplam boyutu değil, **derinliğidir**: aynı anda yığında en fazla `n` çerçeve bulunur, O(n) alan.

Sık görülen özyineleme kalıpları:

| Kalıp | Örnek | Sonuç |
| --- | --- | --- |
| Problemi yarıya indir, sabit iş yap | İkili arama | O(log n) |
| İki yarıya böl, doğrusal iş yap | Merge sort | O(n log n) |
| Her düğümü bir kez ziyaret et | Ağaç dolaşma | O(n) |
| Her adımda iki dala ayrıl, derinlik n | Alt kümeler | O(2ⁿ) |

## Alan karmaşıklığı

Alan analizi, algoritmanın **girdi dışında** kullandığı belleği sayar:

- Oluşturduğunuz diziler, hash tabloları, kuyruklar.
- **Özyinelemenin çağrı yığını.** En sık unutulan kalemdir. Derinliği `n` olan bir özyineleme, hiçbir veri yapısı oluşturmasa bile O(n) alan kullanır.

Zaman ile alan çoğu zaman birbirinin karşılığıdır: bir hash tablosu için O(n) bellek harcayıp O(n²) zamanı O(n)'e indirmek, mülakatlardaki en yaygın hamledir.

## Amortize analiz

Bazı işlemler çoğu zaman ucuz, arada bir pahalıdır. `List<T>.Add` buna örnektir: kapasite dolduğunda bütün elemanlar iki katı büyüklükte yeni bir diziye kopyalanır (O(n)), ama bu seyrek olur. `n` ekleme boyunca toplam kopyalama `n + n/2 + n/4 + … < 2n` olduğundan ekleme başına **amortize** maliyet O(1)'dir. Hash tablosuna eklemede de aynı mantık geçerlidir.

## Mülakatta nasıl anlatılır

Yalnızca sonucu söylemeyin; gerekçesini bir cümleyle verin:

> "Diziyi bir kez geziyorum ve her eleman için hash tablosunda sabit zamanlı bir arama yapıyorum; zaman O(n). Tablo en kötü durumda bütün elemanları tutar; alan O(n)."

Analizi sorulmadan yapın. Kaba kuvvet çözümün karmaşıklığını söyleyip "bunu şuraya indirebiliriz" demek, problem çözme puanınızı doğrudan yükseltir.

## Özet

- Big-O büyüme hızını ölçer: sabitleri atın, baskın terimi tutun.
- Ardışık bloklar toplanır, iç içe bloklar çarpılır, yarılanan döngüler logaritmiktir.
- Özyinelemede zaman için çağrı ağacının düğüm sayısına, alan için derinliğine bakın.
- Kısıtlar hedef karmaşıklığı ele verir: `n ≤ 10⁵` çoğu zaman O(n log n) ya da daha iyisini ister.
- Kütüphane çağrılarının maliyetini bilin: `Contains`, dizgi birleştirme, `Sort`.
