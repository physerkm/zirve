---
title: Mimari
summary: Clean Architecture katmanları, bağımlılık kuralı, klasör yapısı ve temel tasarım kararları.
minutes: 5
level: intermediate
---
## 4.1 Katmanlar ve bağımlılık kuralı

Clean Architecture'ın tek temel kuralı şudur: **bağımlılıklar her zaman içe doğru akar.** İç katmanlar dış katmanları bilmez. Domain hiçbir şeye bağımlı değildir; veritabanı, web ve framework detayları en dışta yaşar.

| Katman | Proje | Sorumluluk | Referans verebileceği |
| --- | --- | --- | --- |
| Domain | Library.Domain | Entity'ler, value object'ler, domain event'ler, hata tanımları, iş kuralları. Hiçbir NuGet paketi yok | Hiçbiri |
| Application | Library.Application | Use case'ler (command ve query handler'ları), DTO'lar, validator'lar ve dış dünyanın arayüzleri (port'lar) | Domain |
| Infrastructure | Library.Infrastructure | EF Core, repository ve okuma servisleri, şifre hash'leme, JWT üretimi, interceptor'lar | Application |
| Presentation | Library.Api | Minimal API endpoint'leri, middleware, hata eşleme, kimlik doğrulama ayarları; uygulamanın kompozisyon kökü (composition root) | Application, Infrastructure |

> **Dikkat:** Api'nin Infrastructure'a referansı yalnızca `Program.cs` içinde Infrastructure'ın servis kayıt metodunu çağırmak içindir. Endpoint'ler Infrastructure tiplerini (DbContext, repository sınıfları) asla doğrudan kullanmaz. Bunu Faz 1'de yazacağın mimari testlerle otomatik olarak doğrulayacaksın.

## 4.2 Klasör yapısı

Kodu teknik türe göre (Services, Models, Controllers) değil, **iş özelliğine göre** gruplayacaksın (feature folders). Bir use case'in command'ı, handler'ı ve validator'ı aynı klasörde durur.

```text
LibraryApi/
├── Library.slnx
├── global.json  ·  Directory.Build.props  ·  Directory.Packages.props
├── .editorconfig  ·  .gitignore
├── src/
│   ├── Library.Domain/
│   │   ├── Abstractions/      Entity, IDomainEvent, Error, Result, arayüzler
│   │   ├── Authors/           Author, AuthorErrors
│   │   ├── Books/             Book, Isbn, BookErrors
│   │   ├── Members/           Member, Email, Role, MemberErrors, olaylar
│   │   └── Loans/             Loan, LendingService, LendingPolicy, LoanErrors, olaylar
│   ├── Library.Application/
│   │   ├── Abstractions/      Messaging, Data, Authentication, Behaviors, Paging
│   │   ├── Authors/           Create/  Update/  Delete/  GetById/  List/
│   │   ├── Books/             Create/  Update/  AddCopies/  Delete/  GetById/  Search/
│   │   ├── Members/           Register/  Login/  GetCurrent/  List/  Deactivate/
│   │   ├── Loans/             Borrow/  Extend/  Return/  GetMine/  ListOverdue/
│   │   └── DependencyInjection.cs
│   ├── Library.Infrastructure/
│   │   ├── Persistence/       DbContext, Configurations/, Interceptors/,
│   │   │                      Repositories/, ReadServices/, Migrations/, Seeding/
│   │   ├── Authentication/    JwtOptions, TokenProvider, PasswordHasher
│   │   ├── DomainEvents/      DomainEventsDispatcher
│   │   └── DependencyInjection.cs
│   └── Library.Api/
│       ├── Endpoints/         IEndpoint, Auth/, Authors/, Books/, Members/, Loans/
│       ├── Extensions/        Result → HTTP eşleme, endpoint kayıt yardımcıları
│       ├── Infrastructure/    GlobalExceptionHandler, UserContext, OpenAPI dönüştürücü
│       ├── Library.Api.http
│       └── Program.cs
└── tests/
    ├── Library.Domain.UnitTests/
    ├── Library.Application.UnitTests/
    ├── Library.Api.IntegrationTests/
    └── Library.ArchitectureTests/
```

## 4.3 Temel tasarım kararları

| Konu | Seçim | Neden? |
| --- | --- | --- |
| API stili | Minimal API + route group'lar + TypedResults | Az tören, yüksek performans; .NET'in yeni projeler için önerdiği yaklaşım |
| Use case yapısı | CQRS: command ve query ayrımı, kendi küçük arayüzlerimizle | MediatR 2025'te ticari lisansa geçti. Ayrıca ihtiyacın olan yalnızca birkaç arayüz; kendin yazman öğretici |
| Okuma ve yazma | Yazma: repository + Unit of Work + domain. Okuma: doğrudan DTO döndüren okuma servisleri | Yazmada iş kuralları korunur; okumada gereksiz entity yüklemeden hızlı projeksiyon yapılır |
| Hata yönetimi | Beklenen hatalar için Result pattern, beklenmeyenler için global exception handler | Exception'lar akış kontrolü için değildir; iş hataları tipli ve öngörülebilir olur |
| Validasyon | FluentValidation + handler decorator'ı | Kurallar tek yerde ve test edilebilir; her handler'da tekrar yok |
| Mapping | Elle eşleme (statik metot ya da extension) | AutoMapper da ticari oldu; elle eşleme açık ve derleme zamanında güvenli |
| Veritabanı | EF Core 10 + SQL Server LocalDB | Kurulumu hafif, Docker gerektirmez |
| Kimlikler | `Guid.CreateVersion7()` | Zamana göre sıralı ve tahmin edilemez GUID. Not: SQL Server `uniqueidentifier` değerlerini son baytlardan başlayarak sıraladığı için bu sıra orada korunmaz; clustered index parçalanmasını azaltmak istiyorsanız EF Core'un SQL Server için ürettiği sıralı GUID'leri kullanın |
| Zaman | Yerleşik `TimeProvider` | Doğrudan `DateTime.UtcNow` test edilemez. Gecikme senaryolarını sahte saatle test edeceksin |
| Kimlik doğrulama | JWT Bearer + rol tabanlı policy'ler | Stateless API'lerde standart yaklaşım |
| Dokümantasyon | Yerleşik OpenAPI + Scalar arayüzü | .NET 9'dan itibaren şablonlarda Swashbuckle yerine yerleşik OpenAPI desteği var |
| Loglama | Serilog ile yapısal loglama | Loglar alan bazında sorgulanabilir olur |
| Paket yönetimi | Central Package Management | Tüm paket sürümleri tek dosyada |
| Test | xUnit v3, Shouldly, NSubstitute, FakeTimeProvider, WebApplicationFactory, NetArchTest | FluentAssertions v8 ticari lisansa geçti; Shouldly açık kaynak |

## 4.4 Bir isteğin yolculuğu

Örnek: bir üye `POST /api/v1/loans` ile kitap ödünç alıyor. Bu akışı kafanda net tutarsan her şeyin yerini bilirsin:

1. **Api:** JWT doğrulanır, `Member` policy'si kontrol edilir. Endpoint gövdeden `bookId`'yi okur ve `BorrowBookCommand` oluşturur.
2. **Application (decorator'lar):** Log decorator'ı isteği loglar; validasyon decorator'ı command'ı doğrular. Hata varsa handler hiç çalışmaz.
3. **Application (handler):** Üye kimliğini `IUserContext`'ten alır; üyeyi, kitabı ve üyenin aktif ödünçlerini repository'lerden yükler.
4. **Domain:** `LendingService` BR-05, 06, 07, 08 ve 17'yi kontrol eder. Geçerse kitabın stoğunu düşürür, yeni `Loan` oluşturur ve bir domain event yayınlar.
5. **Application:** Handler yeni ödüncü repository'ye ekler ve Unit of Work ile tek seferde kaydeder.
6. **Infrastructure:** EF Core değişiklikleri yazar (RowVersion ile eşzamanlılık kontrolü yaparak), ardından domain event'leri dağıtır.
7. **Api:** `Result` başarılıysa 201 Created ve Location başlığı döner; başarısızsa hata türüne göre ProblemDetails döner.
