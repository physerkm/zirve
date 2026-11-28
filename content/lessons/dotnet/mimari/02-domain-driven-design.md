---
title: Domain-Driven Design
summary: Ortak dil, bounded context ve context map, entity ve value object, aggregate ve tutarlılık sınırı, domain olayları, anemik model sorunu ve DDD'nin EF Core ile uygulanması.
minutes: 24
level: advanced
---

DDD, Türkiye'de lojistik ve e-ticaret ilanlarında (Sürat Kargo, Logvance), Avrupa'da ise fintech ve SaaS ilanlarında sık geçer. Eric Evans'ın 2003 tarihli kitabıyla ortaya çıkan bu yaklaşım bir kütüphane ya da klasör yapısı değildir. Karmaşık bir iş alanını yazılıma doğru taşımanın yöntemidir.

DDD'nin iki yüzü vardır:

- **Stratejik tasarım:** sistemi nereden bölersin, ekipler ve modeller nasıl ilişkilenir? (bounded context, context map)
- **Taktik tasarım:** bir modelin içinde kodu nasıl yazarsın? (entity, value object, aggregate, domain event)

Çoğu ekip yalnızca taktik desenleri uygular ve asıl değeri, yani stratejik tasarımı kaçırır.

## Ortak dil (ubiquitous language)

Geliştiriciler ve alan uzmanları aynı kavramlar için **aynı kelimeleri** kullanır. Bu kelimeler kodda da sınıf ve metot adı olur.

Alan uzmanı "Sevkiyat depodan çıktığında müşteriye bildirim gider" diyorsa kodda `shipment.Dispatch()` ve `ShipmentDispatched` olayı vardır. `ShipmentManager.UpdateStatus(2)` yoktur. Kodu okuyan alan uzmanı ne olduğunu anlayabilmelidir.

## Bounded context

Aynı kelime iş alanının farklı yerlerinde farklı anlama gelir. Bir e-ticaret şirketinde **"Ürün"**:

- **Katalog**'da: ad, açıklama, görseller, kategori.
- **Stok**'ta: depo konumu, adet, rezervasyon.
- **Fiyatlandırma**'da: liste fiyatı, kampanyalar, vergi.
- **Sevkiyat**'ta: ağırlık, boyut, tehlikeli madde bilgisi.

Bunların hepsini tek bir dev `Product` sınıfında toplamak, herkesin değiştirdiği, kimsenin tam anlamadığı bir modele yol açar. DDD'nin çözümü: her alt alanın **kendi modeli** ve **açık bir sınırı** vardır. Bu sınıra *bounded context* denir. Sınırın içinde terimlerin tek bir anlamı vardır.

Bounded context'ler genellikle ekip sınırlarıyla ve çoğu zaman (ama zorunlu değil) servis ya da modül sınırlarıyla örtüşür. Mikroservis sınırlarını belirlemenin en sağlam yolu budur.

### Context map

Context'ler arasındaki ilişkiler adlandırılır:

| İlişki | Anlamı |
| --- | --- |
| **Customer–Supplier** | Aşağı akış (customer) yukarı akışın (supplier) API'sine bağımlıdır ve ihtiyaçlarını iletir |
| **Conformist** | Aşağı akış, yukarı akışın modelini olduğu gibi kabul eder (ör. dış bir ödeme sağlayıcı) |
| **Anti-Corruption Layer (ACL)** | Aşağı akış, yabancı modeli kendi diline çeviren bir katman yazar. Eski sistemlerle ve dış servislerle entegrasyonda kritik |
| **Shared Kernel** | İki context küçük bir ortak modeli paylaşır. Dikkatli kullanılır |
| **Open Host Service / Published Language** | Yukarı akış, herkesin kullanacağı iyi belgelenmiş bir API ve şema yayımlar |

## Taktik yapı taşları

### Entity

**Kimliği** olan ve ömrü boyunca değişen nesne. İki sipariş aynı tutarda ve aynı tarihte olsa da kimlikleri farklıysa farklıdır.

### Value object

Kimliği olmayan, **değerleriyle** tanımlanan ve değişmez (immutable) nesne. `Money`, `Address`, `EmailAddress`, `DateRange`.

```csharp
public sealed record Money
{
    public decimal Amount { get; private init; }   // EF Core setter'sız özellikleri eşlemez
    public string Currency { get; private init; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentOutOfRangeException(nameof(amount));
        if (currency.Length != 3) throw new ArgumentException("ISO 4217 kodu bekleniyor", nameof(currency));
        (Amount, Currency) = (amount, currency.ToUpperInvariant());
    }

    public static Money Zero(string currency) => new(0, currency);

    public Money Add(Money other) => other.Currency == Currency
        ? new Money(Amount + other.Amount, Currency)
        : throw new InvalidOperationException("Farklı para birimleri toplanamaz");
}
```

Value object'ler **ilkel takıntısını** (primitive obsession) önler: `decimal price, string currency` yerine `Money price`. Kural doğrulaması tek yerde yapılır ve geçersiz bir `Money` hiç oluşturulamaz. C# `record` tipleri değer eşitliğini hazır sağladığı için value object'ler için doğal bir seçimdir.

### Aggregate

Birlikte tutarlı tutulması gereken nesnelerin kümesi. Dışarıdan yalnızca **kök (aggregate root)** üzerinden erişilir.

```csharp
public sealed class Order   // aggregate root
{
    private readonly List<OrderLine> _lines = [];
    private readonly List<IDomainEvent> _events = [];

    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }     // başka aggregate'e yalnızca kimlikle referans
    public OrderStatus Status { get; private set; }
    public IReadOnlyList<OrderLine> Lines => _lines;
    public IReadOnlyList<IDomainEvent> DomainEvents => _events;

    public Money Total => _lines.Aggregate(Money.Zero("TRY"), (sum, l) => sum.Add(l.Subtotal));

    public void AddLine(Guid productId, Money unitPrice, int quantity)
    {
        if (Status != OrderStatus.Draft)
            throw new DomainException("Yalnızca taslak siparişe ürün eklenebilir");
        if (_lines.Count >= 50)
            throw new DomainException("Bir sipariş en fazla 50 kalem içerebilir");

        _lines.Add(new OrderLine(productId, unitPrice, quantity));
    }

    public void Submit()
    {
        if (_lines.Count == 0) throw new DomainException("Boş sipariş gönderilemez");
        Status = OrderStatus.Submitted;
        _events.Add(new OrderSubmitted(Id, CustomerId, Total));
    }
}
```

Aggregate kuralları:

1. **Değişmezler (invariant) aggregate içinde korunur.** "Bir sipariş en fazla 50 kalem içerebilir" kuralını `Order` korur. Kimse `order.Lines.Add(...)` ile kuralı atlayamaz, çünkü koleksiyon dışarıya salt okunur açılır.
2. **Bir transaction bir aggregate'i değiştirir.** Birden fazla aggregate'i aynı anda değiştirmek gerekiyorsa bu genellikle domain olayları ve nihai tutarlılıkla yapılır.
3. **Aggregate'ler birbirine kimlikle referans verir**, nesne referansıyla değil. `Order`, `Customer` nesnesini değil `CustomerId`'yi tutar.
4. **Küçük tutun.** Büyük aggregate'ler kilit çakışmasına ve performans sorunlarına yol açar. "Müşteri ve bütün siparişleri" tek aggregate olmamalıdır.

### Domain olayı

İş alanında önemli bir şeyin **olduğunu** anlatan, geçmiş zamanlı ve değişmez bir mesaj: `OrderSubmitted`, `PaymentFailed`, `ShipmentDelivered`.

Kullanımları:

- **Aynı servis içinde yan etkileri ayırmak:** sipariş gönderilince stok rezervasyonu başlasın. `Order` stok servisini bilmez, yalnızca olay üretir.
- **Servisler arası entegrasyon:** olay outbox üzerinden mesaj kuyruğuna yayımlanır (*integration event*). Domain olayı ile entegrasyon olayını ayırmak iyi bir uygulamadır. Domain olayı iç modelin dilini, entegrasyon olayı yayımlanmış sözleşmeyi taşır.

Olaylar genellikle `SaveChanges` sırasında bir EF Core interceptor'ı tarafından toplanır ve transaction başarılı olduktan sonra dağıtılır.

### Repository ve domain servisi

- **Repository** aggregate başına bir tanedir ve aggregate'i bütün olarak yükleyip kaydeder. `OrderLine` için ayrı repository olmaz.
- **Domain servisi**, doğal olarak tek bir varlığa ait olmayan iş kuralını taşır (ör. iki hesap arasında transfer kuralları). Durumsuzdur.

## Anemik model

```csharp
// Anemik: veri torbası
public class Order { public OrderStatus Status { get; set; } public List<OrderLine> Lines { get; set; } = []; }

// İş kuralı serviste dağınık
if (order.Status == OrderStatus.Draft && order.Lines.Count < 50) order.Lines.Add(line);
```

Bütün özellikleri `public set` olan ve iş kuralı içermeyen varlıklara **anemik model** denir. Kurallar servislerde dağılır, tekrar eder ve atlanabilir. Martin Fowler bunu bir anti-desen olarak tanımlar. Ama dürüst olmak gerekir: iş kuralı az olan CRUD ağırlıklı uygulamalarda anemik model + servisler tamamen kabul edilebilir. Zengin domain modeli kuralların gerçekten karmaşık olduğu yerde değer kazanır.

## EF Core ile DDD

EF Core zengin modelleri iyi destekler:

```csharp
public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.OwnsMany(o => o.Lines, line =>
        {
            line.WithOwner().HasForeignKey("OrderId");
            line.OwnsOne(l => l.UnitPrice);                             // Money: aynı tabloda Amount ve Currency kolonları
        });
        builder.Navigation(o => o.Lines).UsePropertyAccessMode(PropertyAccessMode.Field);   // _lines alanı üzerinden yaz
        builder.Ignore(o => o.Total);
        builder.Ignore(o => o.DomainEvents);
    }
}
```

- **Özel alanlar ve setter'lar:** EF Core `private set` özelliklere ve alanlara yazabilir. Parametresiz özel kurucu yeterlidir.
- **Owned type / complex type:** value object'leri ayrı tablo olmadan aynı satırdaki kolonlara eşler. EF Core 8 ile gelen complex type'lar değer semantiğine daha yakındır.
- **Strongly typed ID:** `OrderId(Guid Value)` gibi tiplerle bir siparişin kimliğinin yanlışlıkla müşteri kimliği yerine geçmesi derleme zamanında engellenir. EF Core'da value converter ile eşlenir.

## DDD ne zaman değmez?

- İş kuralı az, ağırlıklı olarak veri girişi ve raporlama yapan uygulamalar.
- Alan uzmanına erişimi olmayan ekipler (ortak dil kurulamaz).
- Kısa ömürlü prototipler.

DDD'nin maliyeti yüksektir. Karmaşıklığın asıl iş alanında olduğu yerde (sigorta, lojistik, ödeme, rezervasyon) kendini öder.

## Mülakatta sorulur

- **"Entity ile value object farkı?"** Entity kimliğiyle, value object değerleriyle tanımlanır. Value object değişmezdir.
- **"Aggregate nedir, sınırını nasıl çizersin?"** Birlikte tutarlı kalması gereken nesneler. Sınırı değişmez kurallar belirler. Mümkün olduğunca küçük tutarım.
- **"İki aggregate'i aynı transaction'da güncellemem gerekiyor."** Önce gerçekten aynı anda tutarlı olmaları gerekiyor mu diye sorarım. Genellikle domain olayıyla nihai tutarlılık yeterlidir.
- **"Bounded context ile mikroservis aynı şey mi?"** Hayır. Bounded context bir model sınırıdır. Mikroservis bir dağıtım birimidir. İyi mikroservis sınırları çoğu zaman bounded context'leri izler, ama bir modüler monolitte de bounded context'ler olur.
- **"Anemik model her zaman kötü mü?"** Hayır. Kuralı az uygulamalarda basit ve yeterlidir.

## Özet

- DDD'nin değeri en çok stratejik tasarımdadır: ortak dil ve bounded context'ler.
- Context'ler arası ilişkiler adlandırılır. Dış ve eski sistemlere karşı anti-corruption layer kullanılır.
- Entity kimlikle, value object değerle tanımlanır. Value object'ler ilkel takıntısını önler.
- Aggregate tutarlılık sınırıdır: kökten erişilir, küçük tutulur, diğerlerine kimlikle referans verir.
- Domain olayları yan etkileri ayırır ve servisler arası entegrasyonun temelidir.
- DDD karmaşık iş alanlarında kendini öder. Basit CRUD için fazladır.
