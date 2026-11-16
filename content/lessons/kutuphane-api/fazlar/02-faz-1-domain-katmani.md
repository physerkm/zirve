---
title: Faz 1 — Domain katmanı
summary: İş kurallarını koruyan zengin domain modeli, Result pattern, unit testler ve mimari testler.
minutes: 7
level: intermediate
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | Framework'ten bağımsız, kendini geçersiz duruma düşürmeyen (always-valid) zengin bir domain modeli kurmak. |
| **Öğreneceklerin** | Entity ve value object farkı, aggregate, kapsülleme (encapsulation), factory method, Result pattern, domain event, domain service, unit test ve mimari test yazımı. |
| **Faz sonunda elinde olacak** | Tüm iş kurallarını (BR-01…BR-17'nin domain'e ait olanları) uygulayan ve testlerle kanıtlanmış bir Domain projesi. |

## Görevler

### 1.1 Temel soyutlamalar (Abstractions klasörü)

| Tip | Ne olmalı? |
| --- | --- |
| `Entity` (soyut sınıf) | Guid türünde `Id`; dışarıdan değiştirilemez. Domain event'ler için private bir liste, dışarıya yalnızca salt okunur bir koleksiyon olarak açılır. Alt sınıfların olay eklemesi için protected bir `Raise` metodu ve listeyi temizleyen bir `ClearDomainEvents` metodu |
| `IDomainEvent` (arayüz) | İşaretleyici (marker) arayüz. Somut olaylar sealed record olacak ve isimleri `DomainEvent` ile bitecek (ör. `LoanCreatedDomainEvent`) |
| `IAuditableEntity` (arayüz) | `CreatedAt` ve `UpdatedAt` alanları. Değerlerini Faz 3'te bir interceptor otomatik dolduracak; domain bu alanlara elle dokunmaz |
| `ISoftDeletable` (arayüz) | `IsDeleted` ve `DeletedAt` alanları |
| `ErrorType` (enum) | Failure, Validation, NotFound, Conflict, Unauthorized, Forbidden |
| `Error` (record) | `Code`, `Description`, `Type` özellikleri. Her tür için statik fabrika metotları (ör. `Error.NotFound(kod, açıklama)`) ve “hata yok” anlamına gelen statik bir `None` değeri. `ValidationError` bundan türeyeceği için sealed olmayacak |
| `ValidationError` (sealed record) | Birden fazla validasyon hatasını taşıyan `Error` alt tipi. İçinde hata dizisi bulunur; her elemanın `Code`'u alan adı, `Description`'ı mesajdır |
| `Result` | `IsSuccess`, `IsFailure`, `Error`. Statik `Success()` ve `Failure(error)` metotları. Kurucu metot tutarsız durumu engellemeli: başarılıysa Error `None` olmalı, başarısızsa `None` olamaz; ihlal edilirse exception fırlatılır (bu bir programcı hatasıdır) |
| `Result<TValue>` | `Result`'tan türer ve `Value` özelliği ekler. Başarısız bir sonucun `Value`'suna erişmeye çalışmak `InvalidOperationException` fırlatmalı. Bonus: değerden ve `Error`'dan örtük (implicit) dönüşüm operatörleri yaz; handler'lar çok daha okunaklı olur |

> **Neden?** Result pattern ile bir metodun başarısız olabileceği imzasından anlaşılır ve çağıran taraf hatayı ele almaya zorlanır. Exception'lar ise görünmezdir ve pahalıdır; onları yalnızca gerçekten beklenmeyen durumlar için sakla.

### 1.2 Value object'ler

| Tip | Kurallar |
| --- | --- |
| `Isbn` | Private kurucu; dışarıya yalnızca `Create(string)` açık ve `Result<Isbn>` döner. Tire ve boşlukları temizler, 13 rakam ister, ISBN-13 kontrol hanesini doğrular (BR-01). Araştır: “ISBN-13 check digit” (1 ve 3 ağırlıklı toplama) |
| `Email` | `Create(string)` → `Result<Email>`. Kırpar, küçük harfe çevirir (BR-16), basit format ve en fazla 256 karakter kontrolü yapar |

> **İpucu:** Value object'leri record olarak tanımlamak değere göre eşitliği (value equality) bedavaya getirir. Kendine sor: iki `Isbn` aynı metne sahipse eşit sayılmalı mı?

### 1.3 Entity'ler

Tüm entity'ler için ortak kurallar:

- Tüm özelliklerin setter'ları private. Dışarıdan durum değiştirmenin tek yolu anlamlı isimli metotlardır (`Book.Title = …` değil, `book.UpdateDetails(…)`).
- Nesne oluşturma statik bir fabrika metoduyla yapılır ve geçersiz girdide `Result` ile hata döner. Geçersiz bir entity hiç oluşturulamamalı.
- EF Core'un nesneyi materialize edebilmesi için parametresiz bir private kurucu bulunur.
- Id'ler `Guid.CreateVersion7()` ile üretilir.
- Domain katmanı saati bilmez: zamana ihtiyaç duyan metotlar şimdiki zamanı parametre olarak alır.

| Entity | Metotlar ve davranışlar |
| --- | --- |
| **Author** | `Create(firstName, lastName, biography)`: ad ve soyad boş olamaz, en fazla 100 karakter. `Update(…)` aynı kuralları uygular. `FullName` hesaplanan bir özellik |
| **Book** | `Create(title, isbn, publicationYear, authorId, totalCopies, currentYear)`: BR-03, BR-04. Başlangıçta AvailableCopies = TotalCopies. `UpdateDetails(title, publicationYear, currentYear)`. `AddCopies(count)`: hem Total hem Available artar. `Checkout()`: Available bir azalır; 0 ise hata (BR-05). `ReturnCopy()`: Available bir artar ama Total'i aşamaz (BR-04). `Delete(now)`: Available, Total'den küçükse aktif ödünç var demektir ve hata döner (BR-14); değilse soft delete uygular |
| **Member** | `Register(fullName, email, passwordHash, role)`: varsayılan rol Member, IsActive true. `MemberRegisteredDomainEvent` yayınlar. `Deactivate(activeLoanCount)`: aktif ödünç varsa hata (BR-15) |
| **Loan** | Dışarıdan doğrudan oluşturulamaz; oluşturma metodu `internal` olur ve yalnızca `LendingService` tarafından çağrılır. DueAt = BorrowedAt + 14 gün (BR-09). `IsOverdue(now)`: iade edilmemiş ve süresi geçmiş mi? `Extend(now)`: BR-10 ve BR-12. `Return(now)`: BR-11 ve BR-12; cezayı hesaplar, ReturnedAt'i doldurur, `LoanReturnedDomainEvent` yayınlar |

### 1.4 Domain service: LendingService

Ödünç verme kuralı tek bir aggregate'e ait değil: üyenin durumunu, kitabın stoğunu ve üyenin mevcut ödünçlerini birlikte ilgilendiriyor. Bu tür kurallar bir **domain service**'te yaşar.

- Durumsuz (stateless), sealed bir sınıf.
- `Borrow(member, book, activeLoansOfMember, now)` → `Result<Loan>`.
- Kuralları şu sırayla kontrol et: BR-08 (pasif üye), BR-07 (gecikmiş ödünç var), BR-06 (limit), BR-17 (aynı kitap zaten üyede), BR-05 (stok yok).
- Hepsi geçerse `book.Checkout()` çağırır, yeni `Loan` oluşturur ve `LoanCreatedDomainEvent` yayınlar.

### 1.5 Hata tanımları

Her özellik için statik bir hata sınıfı yaz: `AuthorErrors`, `BookErrors`, `MemberErrors`, `LoanErrors`. Hata kodları `Özellik.Durum` biçiminde olsun. Beklenen hatalardan bazıları:

| Sınıf | Hatalar |
| --- | --- |
| BookErrors | NotFound(id), InvalidIsbn, DuplicateIsbn, InvalidPublicationYear, InvalidCopyCount, NoCopiesAvailable, HasActiveLoans |
| AuthorErrors | NotFound(id), HasBooks, InvalidName |
| MemberErrors | NotFound(id), EmailNotUnique, InvalidEmail, Inactive, LoanLimitReached, HasOverdueLoans, HasActiveLoans, InvalidCredentials, AlreadyBorrowedThisBook |
| LoanErrors | NotFound(id), AlreadyReturned, AlreadyExtended, OverdueCannotBeExtended |

### 1.6 Rol

`Role` adında bir enum (Member, Librarian). JWT claim'lerinde ve yetkilendirme policy'lerinde aynı isimleri kullanacağız; string değerleri tek bir yerde tanımla.

### 1.7 Unit testler (Library.Domain.UnitTests)

Test isimlendirmesi: `Metot_Senaryo_BeklenenSonuc` (ör. `Extend_WhenAlreadyExtended_ReturnsAlreadyExtendedError`). Her test Arrange / Act / Assert bölümlerinden oluşsun ve tek bir davranışı doğrulasın. En az şu senaryoları test et:

| Konu | Senaryolar |
| --- | --- |
| Isbn | `978-0-306-40615-7` geçerli ve `9780306406157` olarak normalize ediliyor; boşluklu yazım da kabul ediliyor; 12 hane → hata; son hanesi yanlış (`9780306406158`) → hata; harf içeren → hata |
| Email | Büyük harfler küçültülüyor ve boşluklar kırpılıyor; `@` içermeyen → hata |
| Book | Checkout stoğu düşürüyor; stok 0 iken Checkout hata; ReturnCopy Total'i aşmıyor; aktif ödünç varken Delete hata; 1449 yayın yılı hata |
| Loan | DueAt 14 gün sonra; Extend 7 gün ekliyor; ikinci Extend hata; gecikmişken Extend hata; zamanında iadede ceza 0; 3 gün gecikmede ceza 15,00; iki kez iade hata; iade olay yayınlıyor |
| LendingService | Her kural için bir başarısızlık testi (BR-05, 06, 07, 08, 17) ve olay yayınlayan bir başarı testi |

> **İpucu:** Zaman gerektiren testlerde sabit bir tarih kullan (ör. 1 Ocak 2026, UTC). Testlerin bugünün tarihine bağlı olmasın; aksi halde bir gün kendiliğinden kırılırlar.

### 1.8 Mimari testler (Library.ArchitectureTests)

NetArchTest ile şu kuralları test et:

- Domain; Application, Infrastructure, Api ve `Microsoft.EntityFrameworkCore` ile `Microsoft.AspNetCore` namespace'lerine bağımlı değil.
- Application; Infrastructure ve Api'ye bağımlı değil.
- Infrastructure; Api'ye bağımlı değil.
- Domain event'ler sealed ve isimleri `DomainEvent` ile bitiyor.

> **İpucu:** Her assembly'ye ulaşmak için o assembly'deki herhangi bir tipi işaret eden küçük bir “AssemblyReference” sınıfı tanımlamak yaygın bir yöntemdir.

## Kabul kriterleri

- [ ] Domain csproj'unda hiçbir `PackageReference` yok.
- [ ] Hiçbir entity'de public setter ya da dışarıya açık değiştirilebilir koleksiyon yok.
- [ ] Geçersiz bir entity veya value object oluşturmak mümkün değil.
- [ ] Domain'de `DateTime.Now`, `DateTime.UtcNow` veya `DateTimeOffset.UtcNow` geçmiyor.
- [ ] Kural sabitleri (3, 14, 7, 5,00) tek bir yerde ve anlamlı isimlerle duruyor.
- [ ] Tüm unit ve mimari testler yeşil.

## Review'da bakacaklarım

- Kapsülleme: public set, dışarı sızan `List<T>`
- Primitive obsession: ISBN ve e-postanın string olarak dolaşması
- Beklenen hatalar için exception kullanımı
- Sihirli sayılar
- Testlerin gerçekten davranışı doğrulayıp doğrulamadığı ve okunabilirliği
- İsimlendirme tutarlılığı
