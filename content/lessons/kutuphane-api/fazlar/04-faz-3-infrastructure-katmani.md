---
title: Faz 3 — Infrastructure katmanı
summary: "EF Core, migration'lar, seed verisi, şifre hash'leme ve JWT üretimi."
minutes: 5
level: intermediate
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | Application'daki port'ları gerçek teknolojilerle uygulamak: veritabanı, şifre hash'leme, token üretimi. |
| **Öğreneceklerin** | DbContext, Fluent API konfigürasyonu, value converter, index, optimistic concurrency (RowVersion), interceptor, global query filter, migration, seeding, AsNoTracking projeksiyon, Options pattern. |
| **Faz sonunda elinde olacak** | LocalDB'de oluşmuş, seed verisiyle dolu bir veritabanı ve tüm port'ların gerçek implementasyonları. |

## Görevler

### 3.1 LibraryDbContext

- Dört entity için `DbSet`'ler.
- `OnModelCreating` içinde tüm konfigürasyonları assembly'den toplu uygula (`ApplyConfigurationsFromAssembly`).
- `IUnitOfWork`'ü uygula (DbContext'in kendisi ya da onu kullanan ayrı bir sınıf; kararını gerekçelendir).
- Kaydetme başarılı olduktan sonra domain event'leri dağıt (bkz. 3.4).
- `DbUpdateConcurrencyException`'ı yakalayıp Application'daki `ConcurrencyException`'a çevir.

### 3.2 Entity konfigürasyonları

Her entity için ayrı bir `IEntityTypeConfiguration<T>` sınıfı yaz:

| Entity | Konfigürasyon |
| --- | --- |
| Author | Tablo adı; FirstName ve LastName zorunlu, en fazla 100; Biography en fazla 2000 |
| Book | Title zorunlu, en fazla 200 ve index'li (arama için). Isbn: value converter ile string'e dönüşür, 13 karakter, **unique index**. AuthorId: Author'a foreign key, silme davranışı Restrict (BR-13 veritabanında da korunur). RowVersion: concurrency token. `IsDeleted = false` global query filter |
| Member | Email: value converter, en fazla 256, **unique index**. Role string olarak saklanır. PasswordHash zorunlu |
| Loan | BookId ve MemberId foreign key'leri; (MemberId, ReturnedAt) üzerinde index (aktif ödünç sorgusu için); LateFee için ondalık hassasiyet (ör. 10,2) |
| Tümü | Entity'deki domain event koleksiyonunu modelden hariç tut (EF onu tablo yapmaya çalışmasın) |

### 3.3 Interceptor'lar

- **AuditableEntityInterceptor** (`SaveChangesInterceptor`'dan türer): `IAuditableEntity` uygulayan entity'ler eklenince `CreatedAt`, değişince `UpdatedAt` doldurulur. Zamanı `TimeProvider`'dan al.
- Interceptor'ları DI'dan çözüp `AddDbContext` sırasında DbContext'e ekle.

### 3.4 Domain event dağıtımı

- `DomainEventsDispatcher`: takip edilen entity'lerden olayları toplar, entity'lerdeki listeyi temizler ve her olay için DI'dan ilgili `IDomainEventHandler`'ları bulup çalıştırır.
- Dağıtım kaydetme **başarılı olduktan sonra** yapılır.

> **Bilgi:** Bu yöntemde kayıt başarılı olup olay işleyici hata verirse olay kaybolur. Gerçek sistemlerde bunun çözümü Outbox pattern'dir (Bonus faz). Şimdilik bu sınırlamayı bil, yeter.

### 3.5 Repository'ler ve okuma servisleri

- Tüm implementasyonlar `internal sealed`; DbContext'i primary constructor ile alır.
- Repository'ler entity'leri takip ederek (tracking) yükler; çünkü değiştirilip kaydedilecekler.
- Okuma servisleri `AsNoTracking` kullanır ve `Select` ile **doğrudan DTO'ya projekte** eder. Önce entity'leri belleğe alıp sonra dönüştürme.
- Kitap aramasında: arama metni, yazar filtresi, beyaz listeyle sıralama (kullanıcı girdisini doğrudan sütun adına çevirme), `Skip`/`Take` ile sayfalama ve toplam kayıt sayısı.
- Kitap detayında yazar adını join ile al; N+1 sorgu sorununa düşme.

### 3.6 Kimlik altyapısı

- **PasswordHasher:** `IPasswordHasher`'ı uygular; ASP.NET Core Identity'nin hazır `PasswordHasher<T>` sınıfını sarmalar. Kendi hash algoritmanı **asla** yazma.
- **JwtOptions:** Issuer, Audience, Secret, ExpirationMinutes. Options pattern ile `Jwt` bölümünden okunur; data annotation'larla doğrulanır (Secret en az 32 karakter) ve uygulama başlarken doğrulama yapılır (`ValidateOnStart`).
- **TokenProvider:** `JsonWebTokenHandler` ile HMAC-SHA256 imzalı token üretir. Claim'ler: `sub` (üye id), `email`, `role`, `jti`.

### 3.7 Yapılandırma ve servis kaydı

Bağlantı dizesini `appsettings.Development.json` dosyasındaki `ConnectionStrings:Database` anahtarına koy:

```text
Server=(localdb)\MSSQLLocalDB;Database=LibraryDb;Trusted_Connection=True;TrustServerCertificate=True
```

JWT Secret'ı **asla** appsettings'e yazma; user secrets kullan:

```bash
dotnet user-secrets init --project src/Library.Api
dotnet user-secrets set "Jwt:Secret" "<en az 32 karakterlik rastgele bir değer>" --project src/Library.Api
```

Infrastructure için `AddInfrastructure(services, configuration)` extension'ı yaz: DbContext (SQL Server + interceptor'lar), repository'ler ve okuma servisleri (Scoped), Unit of Work, `TimeProvider.System` (Singleton), kimlik servisleri ve Options kaydı.

### 3.8 Migration

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate --project src/Library.Infrastructure --startup-project src/Library.Api --output-dir Persistence/Migrations
dotnet ef database update --project src/Library.Infrastructure --startup-project src/Library.Api
```

> **Dikkat:** Üretilen migration dosyasını mutlaka oku: tablolar, sütun uzunlukları, unique index'ler, foreign key silme davranışları ve RowVersion beklediğin gibi mi? Migration'lar veritabanının tarihçesidir; körü körüne kabul etme.

> **Bilgi:** Uygulamanın açılışında migration'ları otomatik uygulamak yalnızca Development ortamında kabul edilebilir. Production'da migration script'i ya da migration bundle tercih edilir.

### 3.9 Seed verisi

Yalnızca Development ortamında çalışan bir `DatabaseSeeder` yaz. Veri yoksa şunları eklesin:

- 1 Librarian: `librarian@library.local`; şifresi user secrets'tan (`Seed:LibrarianPassword`) okunur.
- 3 yazar ve bunlara ait geçerli ISBN'li 5 kitap. Geçerli ISBN örneklerini gerçek kitaplardan bulabilirsin.

Seed işlemi idempotent olmalı: uygulama kaç kez açılırsa açılsın veri bir kez eklenir.

## Kendin test et

1. VS Code'daki mssql eklentisiyle `(localdb)\MSSQLLocalDB`'ye bağlan; tabloları, index'leri ve seed verisini gör.
2. Aynı ISBN'li bir satırı SQL ile eklemeyi dene → unique index hatası.
3. Kitabı olan bir yazarı SQL ile silmeyi dene → foreign key hatası.
4. Uygulamayı iki kez başlat → seed verisi çoğalmıyor.

## Kabul kriterleri

- [ ] Migration temiz oluşuyor ve veritabanına uygulanıyor.
- [ ] Repository ve okuma servisi sınıfları `internal`.
- [ ] Application'a EF Core sızmamış (mimari testler yeşil).
- [ ] Okuma sorgularının hepsi `AsNoTracking` ve DTO projeksiyonu kullanıyor.
- [ ] Repoda hiçbir sır (secret, şifre) yok. `git grep -i secret` ile kontrol et.

## Review'da bakacaklarım

- N+1 sorgular ve gereksiz `Include`
- Filtrelemeden önce `ToList` çağrılması
- Cascade delete davranışları
- Eksik string uzunlukları ve index'ler
- Yaşam süresi hataları (ör. Scoped bir servisin Singleton'a enjekte edilmesi)
- Koda gömülmüş bağlantı dizesi veya sır
