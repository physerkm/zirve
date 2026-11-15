---
title: SOLID İlkeleri
summary: Beş ilkenin her biri için bir ihlal ve düzeltme örneği, ilkelerin hangi sorunu çözdüğü, kalıtım yerine bileşim ve ilkelerin aşırıya kaçtığı durumlar. Nesne yönelimli tasarım mülakatlarının ortak dili.
minutes: 18
level: intermediate
---

SOLID, nesne yönelimli kodun **değişime dayanıklı** olması için beş ilkenin baş harflerinden oluşur. Mülakatta ilkeleri saymak yetmez; beklenen, bir kod parçasındaki sorunu görüp hangi ilkenin ihlal edildiğini ve düzeltmenin neyi kolaylaştırdığını anlatabilmektir. Örnekler C# ile yazılmıştır.

## S: Tek sorumluluk ilkesi

> Bir sınıfın değişmek için **tek bir sebebi** olmalıdır.

"Tek bir iş yapmalı" diye yanlış anlaşılır. Doğru okuma: sınıf, **tek bir paydaşın** (iş biriminin, kural kaynağının) isteğiyle değişmelidir.

```csharp
// Üç farklı değişim sebebi tek sınıfta
public class InvoiceService
{
    public decimal CalculateTotal(Invoice invoice) { /* vergi ve indirim kuralları */ }
    public void Save(Invoice invoice) { /* SQL */ }
    public void SendByEmail(Invoice invoice) { /* şablon ve SMTP */ }
}
```

Vergi oranı değişince, veritabanı şeması değişince ya da e-posta sağlayıcısı değişince hep aynı sınıfa dokunulur. Her değişiklik diğer iki sorumluluğu bozma riski taşır ve sınıfı tek başına test etmek zorlaşır.

```csharp
public class InvoiceCalculator { public decimal CalculateTotal(Invoice invoice) { /* ... */ } }
public interface IInvoiceRepository { Task SaveAsync(Invoice invoice); }
public interface IInvoiceSender { Task SendAsync(Invoice invoice); }
```

Artık vergi kuralları veritabanı olmadan test edilebilir; e-posta sağlayıcısını değiştirmek hesaplama koduna dokunmaz.

## O: Açık-kapalı ilkesi

> Yazılım varlıkları **genişletmeye açık, değiştirmeye kapalı** olmalıdır.

Yeni bir davranış eklemek, çalışan ve test edilmiş kodu değiştirmeyi gerektirmemelidir.

```csharp
public decimal Discount(Customer customer, decimal amount) => customer.Tier switch
{
    Tier.Regular  => 0m,
    Tier.Gold     => amount * 0.10m,
    Tier.Employee => amount * 0.30m,
    _             => 0m,
};
```

Yeni bir müşteri türü bu metodu (ve büyük olasılıkla kod tabanında aynı `switch`'in tekrarlandığı başka yerleri) değiştirmeyi gerektirir. Davranışı bir soyutlamanın arkasına almak:

```csharp
public interface IDiscountPolicy
{
    decimal Apply(decimal amount);
}

public sealed class GoldDiscount : IDiscountPolicy
{
    public decimal Apply(decimal amount) => amount * 0.10m;
}

// Yeni tür = yeni sınıf; mevcut kod değişmez
public sealed class StudentDiscount : IDiscountPolicy
{
    public decimal Apply(decimal amount) => Math.Min(amount * 0.15m, 200m);
}
```

Ölçülü olun: tek bir yerde duran ve yılda bir değişen bir `switch` gayet iyidir. Soyutlamayı, aynı türden **ikinci ya da üçüncü** değişiklik geldiğinde, değişimin hangi eksende olduğu görüldüğünde ekleyin. Her şeyi baştan genişletilebilir yapmaya çalışmak gereksiz karmaşıklık üretir.

## L: Liskov yerine geçme ilkesi

> Alt tipler, üst tiplerinin yerine **programın doğruluğunu bozmadan** kullanılabilmelidir.

Kalıtım "bir tür ...dır" (is-a) ilişkisi kurar; ama bu ilişki gerçek dünyada değil **davranışta** geçerli olmalıdır. Klasik örnek:

```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area => Width * Height;
}

// Matematikte kare bir dikdörtgendir...
public class Square : Rectangle
{
    public override int Width  { get => base.Width;  set { base.Width = value; base.Height = value; } }
    public override int Height { get => base.Height; set { base.Width = value; base.Height = value; } }
}

void Resize(Rectangle shape)
{
    shape.Width = 5;
    shape.Height = 4;
    Debug.Assert(shape.Area == 20);   // Square verilirse alan 16: varsayım bozuldu
}
```

`Rectangle`'ı kullanan kod "genişliği değiştirmek yüksekliği değiştirmez" varsayımına güvenir; `Square` bu sözleşmeyi bozar. Çözüm kalıtımı kaldırmaktır: ikisi ortak bir `IShape` arayüzünü uygulayan bağımsız, tercihen değişmez tipler olabilir.

İhlalin işaretleri:

- Alt sınıfta `NotSupportedException` ya da `NotImplementedException` fırlatan metotlar.
- Çağıran kodda `if (shape is Square)` gibi tip kontrolleri.
- Alt sınıfın daha sıkı ön koşul istemesi (üst sınıf her sayıyı kabul ederken alt sınıfın yalnızca pozitifleri kabul etmesi) ya da daha zayıf sonuç garantisi vermesi.

.NET'in kendisinde de örneği vardır: diziler `IList<T>` arayüzünü uygular ama `Add` çağrıldığında `NotSupportedException` fırlatır. Sonradan eklenen `IReadOnlyList<T>` gibi arayüzler, "yalnızca okunabilen liste" yeteneğini ayrı ifade ederek bu sorunu hafifletir.

## I: Arayüz ayrımı ilkesi

> İstemciler **kullanmadıkları metotlara** bağımlı olmaya zorlanmamalıdır.

```csharp
public interface IOfficeMachine
{
    void Print(Document document);
    void Scan(Document document);
    void Fax(Document document);
}

public sealed class BasicPrinter : IOfficeMachine
{
    public void Print(Document document) { /* ... */ }
    public void Scan(Document document) => throw new NotSupportedException();
    public void Fax(Document document) => throw new NotSupportedException();
}
```

Şişkin arayüz, uygulayanları boş ya da hata fırlatan metotlar yazmaya zorlar (bu aynı zamanda Liskov ihlalidir) ve yalnızca yazdırmak isteyen istemciyi faks metodundaki değişikliklere bağlar.

```csharp
public interface IPrinter { void Print(Document document); }
public interface IScanner { void Scan(Document document); }

public sealed class BasicPrinter : IPrinter { /* ... */ }
public sealed class MultiFunctionPrinter : IPrinter, IScanner { /* ... */ }
```

Arayüzler, onları **kullananın** ihtiyacına göre kesilmelidir; uygulayanın neler yapabildiğine göre değil.

## D: Bağımlılığın tersine çevrilmesi ilkesi

> Üst seviye modüller alt seviye modüllere bağımlı olmamalıdır; ikisi de **soyutlamalara** bağımlı olmalıdır.

```csharp
public class OrderService
{
    private readonly SqlOrderRepository _orders = new();      // somut veritabanı sınıfı
    private readonly StripePaymentClient _payments = new();   // somut ödeme sağlayıcısı
}
```

İş kuralları (sipariş vermek) altyapı ayrıntılarına (hangi veritabanı, hangi ödeme sağlayıcısı) kilitlenmiştir. Ödeme sağlayıcısı değiştiğinde iş kodu değişir ve sınıf gerçek bir veritabanı ve ödeme hesabı olmadan test edilemez.

```csharp
// Soyutlamalar iş katmanında tanımlanır...
public interface IOrderRepository { Task AddAsync(Order order); }
public interface IPaymentGateway  { Task<PaymentResult> ChargeAsync(Money amount, string token); }

public sealed class OrderService(IOrderRepository orders, IPaymentGateway payments)
{
    public async Task PlaceAsync(Order order, string paymentToken)
    {
        var result = await payments.ChargeAsync(order.Total, paymentToken);
        if (!result.Succeeded) throw new PaymentFailedException(result.Error);
        await orders.AddAsync(order);
    }
}

// ...altyapı katmanı onları uygular: PostgresOrderRepository, StripePaymentGateway
```

"Tersine çevirme" buradadır: bağımlılık oku artık altyapıdan iş katmanına doğrudur; çünkü arayüzün **sahibi** onu kullanan iş katmanıdır.

İki kavram sık karıştırılır:

- **Bağımlılığın tersine çevrilmesi (DIP)** bir tasarım ilkesidir: neyin neye bağlı olacağını söyler.
- **Bağımlılık enjeksiyonu (DI)** bir tekniktir: bağımlılıkları sınıfın içinde `new` ile oluşturmak yerine dışarıdan (genellikle yapıcıdan) vermek. ASP.NET Core'daki DI kapsayıcısı bu işi otomatikleştirir.

## Kalıtım yerine bileşim

SOLID'le birlikte anılan bir başka ilke: **davranışı paylaşmak için kalıtım yerine bileşimi tercih edin.**

Kalıtım, alt sınıfı üst sınıfın **uygulama ayrıntılarına** bağlar. Üst sınıftaki masum görünen bir değişiklik alt sınıfları bozabilir (kırılgan üst sınıf sorunu) ve tek kalıtımlı dillerde bir sınıf yalnızca bir üst sınıftan yararlanabilir. Bileşimde ise sınıf, ihtiyaç duyduğu davranışı içinde tuttuğu nesnelerden alır:

```csharp
// Kalıtım: "bildirim gönderen sipariş servisi" bir e-posta göndericisi midir?
public class OrderService : EmailSender { }

// Bileşim: sipariş servisi bir bildirim gönderene sahiptir
public sealed class OrderService(INotifier notifier) { }
```

Bileşimde davranış çalışma zamanında değiştirilebilir (e-posta yerine SMS) ve sınıflar küçük kalır. Kalıtım, gerçek ve kalıcı bir "bir tür ...dır" ilişkisi olduğunda ve Liskov ilkesi sağlandığında uygundur.

## Ölçülü olmak

İlkeler bir amaca hizmet eder: kodu değiştirmeyi ucuzlatmak. Amaçsız uygulandıklarında tersini yaparlar.

- **YAGNI** (ihtiyacın olmayacak): bugün gerekmeyen bir genişleme noktası eklemeyin. Her arayüz, her soyutlama okuyucunun izlemesi gereken bir dolaylılıktır.
- **KISS** (basit tut): tek uygulaması olan ve olması da beklenmeyen bir sınıf için arayüz yazmak çoğu zaman gereksizdir. (Test için sahte nesne gerekiyorsa bu bir sebep olabilir.)
- **DRY** (kendini tekrar etme) bilgi tekrarı içindir, görüntü benzerliği için değil. Yalnızca bugün birbirine benzeyen iki kodu ortak bir soyutlamada birleştirmek, ileride farklı yönlere değişmeleri gerektiğinde onları birbirine kilitler. Yanlış soyutlama, tekrardan daha pahalıdır.

## Nesne yönelimli tasarım mülakatı

"Bir otopark sistemi tasarlayın", "bir asansör sistemi modelleyin" gibi sorularda izlenecek yol:

1. **Gereksinimleri netleştirin:** hangi araç türleri, kaç kat, ücretlendirme nasıl, hangi işlemler (giriş, çıkış, ödeme)?
2. **Temel varlıkları çıkarın:** cümlelerdeki isimler aday sınıflardır (`ParkingLot`, `Level`, `Spot`, `Vehicle`, `Ticket`).
3. **İlişkileri kurun:** otopark katlara **sahiptir** (bileşim); motosiklet bir araç **türüdür** (kalıtım ya da arayüz).
4. **Davranışları yerleştirin:** fiiller metotlardır. Her davranış, gereken bilgiye sahip olan sınıfa gider (`Spot.CanFit(vehicle)`).
5. **Değişim noktalarını gösterin:** "Ücretlendirme kuralları değişebilir, bu yüzden `IPricingStrategy` arkasında" demek, SOLID'i ezberden değil gerekçeyle kullandığınızı gösterir.

## Özet

- **S:** bir sınıfın değişmek için tek bir sebebi olmalı.
- **O:** yeni davranış, mevcut kodu değiştirmeden eklenebilmeli; ama soyutlamayı ihtiyaç doğduğunda ekleyin.
- **L:** alt tip, üst tipin sözleşmesini bozmamalı; `NotSupportedException` ve tip kontrolleri uyarı işaretidir.
- **I:** arayüzleri kullananın ihtiyacına göre küçük tutun.
- **D:** iş kodu soyutlamalara bağımlı olsun; soyutlamanın sahibi onu kullanan katmandır. DI bu ilkeyi uygulamanın tekniğidir.
- Davranış paylaşmak için bileşimi tercih edin; ilkeleri amaçsız uygulamayın.
