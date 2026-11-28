---
title: EF Core Derinlemesine
summary: DbContext'in iş birimi rolü, change tracking, IQueryable ile IEnumerable farkı, N+1 sorunu, projeksiyon, AsNoTracking, split query, toplu güncelleme, iyimser eşzamanlılık, migration stratejileri ve EF Core ile Dapper seçimi.
minutes: 25
level: intermediate
---

EF Core, .NET ilanlarının büyük çoğunluğunda adıyla geçer. Mülakatta "EF Core kullandım" demek yetmez. Görüşmeci şunu ölçer: ürettiği SQL'i tahmin edebiliyor musun ve performans sorununu bulup düzeltebiliyor musun?

## DbContext: iş birimi

`DbContext` iki iş yapar: sorguları SQL'e çevirir ve okuduğu varlıkları **izler** (change tracking). `SaveChangesAsync` çağrıldığında izlenen varlıklardaki bütün değişiklikleri **tek bir transaction** içinde veritabanına yazar. Buna *Unit of Work* deseni denir.

```csharp
var order = await db.Orders.FirstAsync(o => o.Id == id, ct);  // izlenmeye başlar
order.MarkAsPaid();                                           // yalnızca bellekte değişir
db.Payments.Add(new Payment(order.Id, amount));
await db.SaveChangesAsync(ct);                                // UPDATE + INSERT, tek transaction
```

Bu yüzden EF Core'un üstüne bir de `IRepository<T>` + `IUnitOfWork` katmanı yazmak çoğu zaman gereksizdir: `DbSet` zaten repository, `DbContext` zaten unit of work'tür. Ekipler bu soyutlamayı test kolaylığı ya da domain dilini korumak için yine de seçebilir. Önemli olan nedenini söyleyebilmektir.

`DbContext` **thread güvenli değildir** ve kısa ömürlü olmalıdır (istek başına bir tane). Aynı context üzerinde iki sorguyu `Task.WhenAll` ile paralel çalıştırmak `InvalidOperationException` fırlatır.

## Varlık durumları

| Durum | Anlamı | `SaveChanges` ne yapar |
| --- | --- | --- |
| `Added` | Yeni eklendi | `INSERT` |
| `Unchanged` | Okundu, değişmedi | Hiçbir şey |
| `Modified` | En az bir özelliği değişti | Yalnızca değişen kolonlar için `UPDATE` |
| `Deleted` | Silinmek üzere işaretlendi | `DELETE` |
| `Detached` | İzlenmiyor | Hiçbir şey |

Değişiklik tespiti, varlığın okunduğu andaki kopyasıyla şimdiki halinin karşılaştırılmasıyla yapılır. Binlerce varlık izlemek bellek ve işlemci maliyetidir.

## IQueryable ve IEnumerable

```csharp
// 1) Filtre veritabanında çalışır: WHERE "Status" = 'Paid'
var paid = await db.Orders.Where(o => o.Status == OrderStatus.Paid).ToListAsync(ct);

// 2) Bütün tablo belleğe çekilir, filtre C#'ta çalışır
IEnumerable<Order> all = db.Orders;
var paidSlow = all.Where(o => o.Status == OrderStatus.Paid).ToList();
```

`IQueryable` bir **ifade ağacı** taşır ve sonlandırıcı bir çağrı (`ToListAsync`, `FirstAsync`, `CountAsync`) gelene kadar SQL'e dönüşmez. `IEnumerable`'a geçtiğiniz an (`AsEnumerable`, `ToList`, parametre tipi `IEnumerable`) sonraki her şey bellekte çalışır. Repository metodunun `IEnumerable<Order>` döndürüp çağıranın onu filtrelemesi, fark edilmeyen tam tablo taramalarının klasik kaynağıdır.

## N+1 sorunu

```csharp
var orders = await db.Orders.ToListAsync(ct);          // 1 sorgu
foreach (var order in orders)
{
    var count = order.Lines.Count;                      // lazy loading açıksa: her sipariş için 1 sorgu daha
}
```

100 sipariş için 101 sorgu. Lazy loading EF Core'da varsayılan olarak kapalıdır ve kapalı kalması önerilir. Çözümler:

```csharp
// Eager loading: JOIN ile tek sorgu
var orders = await db.Orders.Include(o => o.Lines).ToListAsync(ct);

// Daha iyisi: yalnızca gereken kolonları seç (projeksiyon)
var summaries = await db.Orders
    .Select(o => new OrderSummary(o.Id, o.Customer.Name, o.Lines.Count, o.Lines.Sum(l => l.Price * l.Quantity)))
    .ToListAsync(ct);
```

**Projeksiyon** okuma senaryolarında en etkili optimizasyondur: daha az kolon, daha az veri ve change tracking yok (anonim ya da DTO tipleri izlenmez).

### Kartezyen patlama ve split query

Birden fazla koleksiyonu `Include` etmek tek bir JOIN üretir ve satırlar çarpılır: 10 satırlı ve 10 ödemeli bir sipariş 100 satır döner.

```csharp
var orders = await db.Orders
    .Include(o => o.Lines)
    .Include(o => o.Payments)
    .AsSplitQuery()          // her koleksiyon için ayrı sorgu
    .ToListAsync(ct);
```

Split query tutarlılık riski taşır: sorgular arasında veri değişebilir. Sorguları snapshot ya da serializable yalıtım düzeyindeki bir transaction içinde çalıştırmak (varsayılan read committed yetmez) ya da projeksiyonla iki koleksiyonu da özetlemek alternatiflerdir.

## AsNoTracking

Yalnızca okunacak ve güncellenmeyecek veride izlemeyi kapatın:

```csharp
var products = await db.Products.AsNoTracking().Where(p => p.IsActive).ToListAsync(ct);
```

Okuma ağırlıklı bir context için varsayılanı değiştirmek de mümkündür: `optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)`.

## Toplu güncelleme ve silme

Eskiden bin satırı güncellemek için bin varlığı belleğe çekmek gerekirdi. EF Core 7'den beri tek SQL komutu yeter:

```csharp
await db.Sessions
    .Where(s => s.ExpiresAt < DateTime.UtcNow)
    .ExecuteDeleteAsync(ct);

await db.Products
    .Where(p => p.CategoryId == categoryId)
    .ExecuteUpdateAsync(set => set.SetProperty(p => p.Price, p => p.Price * 1.10m), ct);
```

Bu komutlar change tracker'ı **atlar**: bellekteki izlenen varlıklar güncellenmez ve `SaveChanges` interceptor'ları çalışmaz.

## İyimser eşzamanlılık

İki kullanıcının aynı kaydı aynı anda güncellemesi kayıp güncellemeye yol açar. EF Core'un çözümü bir **eşzamanlılık belirtecidir**:

```csharp
public class Product
{
    public Guid Id { get; set; }
    public int Stock { get; set; }

    [Timestamp] public byte[] RowVersion { get; set; } = [];   // SQL Server: rowversion
}
// PostgreSQL (Npgsql): sistem kolonu xmin kullanılabilir:
// modelBuilder.Entity<Product>().Property<uint>("xmin").IsRowVersion();
```

EF Core güncellemeyi `UPDATE ... WHERE Id = @id AND RowVersion = @eski` olarak yazar. Etkilenen satır sayısı 0 ise başka biri kaydı değiştirmiştir ve `DbUpdateConcurrencyException` fırlatılır. Uygulama bunu yakalayıp kullanıcıya `409 Conflict` dönebilir ya da yeniden okuyup tekrar deneyebilir.

## Transaction'lar

`SaveChangesAsync` tek başına zaten bir transaction'dır. Birden fazla `SaveChanges`'i ya da ham SQL'i aynı transaction'da toplamak gerekiyorsa:

```csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);
// ... birden fazla işlem ve SaveChangesAsync ...
await tx.CommitAsync(ct);
```

Bağlantı dayanıklılığı (`EnableRetryOnFailure`) açıksa elle açılan transaction'lar bir **execution strategy** içinde çalıştırılmalıdır, yoksa yeniden deneme transaction'ın ortasından başlar:

```csharp
var strategy = db.Database.CreateExecutionStrategy();
await strategy.ExecuteAsync(async () =>
{
    await using var tx = await db.Database.BeginTransactionAsync(ct);
    // ...
    await tx.CommitAsync(ct);
});
```

## Performans araçları

- **SQL'i görün:** `optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information)` ya da `query.ToQueryString()`.
- **Compiled query:** sık çalışan sorgunun ifade ağacı çevirisini bir kez yapar. `EF.CompileAsyncQuery((AppDbContext db, Guid id) => db.Orders.First(o => o.Id == id))`.
- **DbContext havuzu:** `AddDbContextPool<AppDbContext>()` context nesnelerini yeniden kullanır. Context'te istek başına durum tutulmamalıdır.
- **Global query filter:** soft delete ve çok kiracılık için her sorguya otomatik `WHERE` ekler. `HasQueryFilter(o => !o.IsDeleted && o.TenantId == tenantId)`. Gerektiğinde `IgnoreQueryFilters()` ile kapatılır.
- **Interceptor:** `SaveChanges` öncesi denetim alanlarını (`CreatedAt`, `UpdatedBy`) doldurmak ya da domain olaylarını toplamak için.

## Migration'lar

```bash
dotnet ef migrations add AddOrderNumber
dotnet ef migrations script --idempotent -o migrate.sql   # üretim için gözden geçirilebilir SQL
dotnet ef migrations bundle                               # tek dosyalık çalıştırılabilir paket
```

Üretimde migration'ı uygulama açılışında `Database.Migrate()` ile çalıştırmak, birden fazla örnek aynı anda açılınca yarışa ve uzun kilitlere yol açabilir. Daha güvenli yol, dağıtım hattında ayrı bir adım olarak çalıştırmaktır.

**Kesintisiz dağıtım için genişlet-daralt (expand/contract):** Bir kolonu yeniden adlandırmak doğrudan yapılmaz. Önce yeni kolon eklenir ve ikisine birden yazılır, veri taşınır, kod yeni kolondan okumaya geçer ve en son eski kolon silinir. Böylece eski ve yeni uygulama sürümleri dağıtım sırasında aynı şemayla çalışabilir.

## EF Core mu, Dapper mı?

| | EF Core | Dapper |
| --- | --- | --- |
| Ne yazarsın | LINQ | SQL |
| Change tracking, migration | Var | Yok |
| Kontrol | SQL'i EF üretir | SQL tamamen sizde |
| Hız | Çok yakın, projeksiyon ve no-tracking ile | Ham ADO.NET'e en yakın |
| Uygun olduğu yer | Yazma tarafı, domain modeli, CRUD | Karmaşık raporlar, performans kritik okuma |

Yaygın ve savunulabilir yaklaşım ikisini birlikte kullanmaktır: yazma ve iş kuralları EF Core ile, ağır okuma ve raporlar Dapper ya da EF Core'un `SqlQuery<T>` metoduyla ham SQL ile. Bu, CQRS'in pratikteki basit halidir.

## Mülakatta sorulur

- **"N+1 nedir, nasıl bulursun?"** Liste için 1, her eleman için 1 sorgu daha. SQL loglarında aynı sorgunun tekrar ettiğini görürüm. `Include` ya da projeksiyonla düzeltirim.
- **"AsNoTracking ne zaman?"** Güncellenmeyecek, yalnızca okunacak veride.
- **"İki kullanıcı aynı stoğu düşüyor. Nasıl korursun?"** Eşzamanlılık belirteci (rowversion/xmin) ve `DbUpdateConcurrencyException`. Ya da atomik `UPDATE ... SET Stock = Stock - 1 WHERE Stock >= 1`.
- **"Repository deseni EF Core ile gerekli mi?"** DbSet ve DbContext zaten repository ve unit of work. Ek katman ancak bir fayda sağlıyorsa yazılır.
- **"Kolon adını kesintisiz nasıl değiştirirsin?"** Genişlet-daralt. Önce ekle ve iki yere yaz, sonra taşı, en son eskiyi sil.

## Özet

- `DbContext` kısa ömürlü bir iş birimidir. `SaveChanges` değişiklikleri tek transaction'da yazar.
- `IQueryable` SQL'e çevrilir, `IEnumerable` bellekte çalışır. Bu çizginin nerede olduğunu bilin.
- N+1'i `Include` ya da projeksiyonla, kartezyen patlamayı split query ile çözün. Okumada `AsNoTracking` kullanın.
- Toplu işler için `ExecuteUpdate`/`ExecuteDelete`, eşzamanlılık için rowversion kullanın.
- Migration'ı dağıtım hattında çalıştırın. Kıran şema değişikliklerini genişlet-daralt ile yapın.
