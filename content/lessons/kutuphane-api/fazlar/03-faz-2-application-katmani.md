---
title: Faz 2 — Application katmanı
summary: "Use case'ler, port arayüzleri, validasyon ve log decorator'ları, handler testleri."
minutes: 7
level: intermediate
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | Tüm use case'leri yazmak ve dış dünyayı (veritabanı, saat, kimlik) arayüzlerin arkasına saklamak. |
| **Öğreneceklerin** | CQRS, dependency inversion, port & adapter yaklaşımı, decorator pattern, DTO tasarımı, FluentValidation, Scrutor ile DI taraması, NSubstitute ile mock'lama. |
| **Faz sonunda elinde olacak** | [Bölüm 3.3](/tracks/kutuphane-api/proje-tanimi)'teki her endpoint'in arkasındaki handler, validator'lar ve handler unit testleri. Henüz veritabanı yok; her şey arayüzlerle test ediliyor. |

## Görevler

### 2.1 Mesajlaşma soyutlamaları (Abstractions/Messaging)

| Arayüz | Açıklama |
| --- | --- |
| `ICommand`, `ICommand<TResponse>` | Durum değiştiren istekler için işaretleyici arayüzler |
| `IQuery<TResponse>` | Sadece okuma yapan istekler için işaretleyici arayüz |
| `ICommandHandler<TCommand>` | `HandleAsync(command, cancellationToken)` → `Task<Result>` |
| `ICommandHandler<TCommand, TResponse>` | `HandleAsync(…)` → `Task<Result<TResponse>>` |
| `IQueryHandler<TQuery, TResponse>` | `HandleAsync(…)` → `Task<Result<TResponse>>` |
| `IDomainEventHandler<TEvent>` | Domain event'lere tepki veren sınıflar için: `HandleAsync(domainEvent, cancellationToken)` |

> **İpucu:** Generic kısıtlarla (ör. TCommand'ın `ICommand<TResponse>` olması zorunluluğu) yanlış command ile yanlış handler'ın eşleşmesini derleme zamanında engelle.

### 2.2 Port arayüzleri

**Yazma tarafı (repository'ler):** Her aggregate için bir repository. Repository'ler yalnızca yükler ve ekler; asla kaydetmez. Kaydetme işi `IUnitOfWork`'ün tek bir `SaveChangesAsync` metodundadır.

| Arayüz | Metotlar |
| --- | --- |
| `IAuthorRepository` | GetByIdAsync, HasBooksAsync, Add, Remove |
| `IBookRepository` | GetByIdAsync, IsbnExistsAsync, Add |
| `IMemberRepository` | GetByIdAsync, GetByEmailAsync, EmailExistsAsync, Add |
| `ILoanRepository` | GetByIdAsync, GetActiveByMemberIdAsync, CountActiveByMemberIdAsync, Add |
| `IUnitOfWork` | SaveChangesAsync |

**Okuma tarafı (okuma servisleri):** Query'ler entity yüklemek yerine doğrudan DTO döndüren arayüzleri kullanır. Böylece okuma işlemleri hızlı ve basit kalır.

| Arayüz | Metotlar |
| --- | --- |
| `IAuthorReadService` | GetByIdAsync → AuthorResponse (yoksa null), ListAsync → PagedList |
| `IBookReadService` | GetByIdAsync → BookResponse (yazar adı dahil), SearchAsync → PagedList |
| `IMemberReadService` | GetByIdAsync, ListAsync |
| `ILoanReadService` | GetByMemberIdAsync, ListOverdueAsync(now, paging) |

**Diğer port'lar:**

- `IPasswordHasher`: Hash ve Verify.
- `ITokenProvider`: bir üye için token ve bitiş zamanını döndürür.
- `IUserContext`: giriş yapmış kullanıcının `MemberId`'si.
- Saat için arayüz yazma; .NET'in yerleşik `TimeProvider` soyut sınıfını enjekte et.
- `ConcurrencyException`: eşzamanlılık çakışmasını Application seviyesinde temsil eden exception. Infrastructure EF'in exception'ını bununla değiştirecek, Api bunu 409'a çevirecek.

### 2.3 Sayfalama

`PagedList<T>` adında bir record: Items, Page, PageSize, TotalCount ve bunlardan hesaplanan TotalPages, HasNextPage, HasPreviousPage. Sayfa parametreleri için de ortak bir tip tanımla; varsayılan değerleri orada dursun.

### 2.4 Use case listesi

| Özellik | Command / Query | Çıktı | Dikkat edilecekler |
| --- | --- | --- | --- |
| Authors | CreateAuthorCommand | Guid | Domain doğrulaması |
|  | UpdateAuthorCommand | — | Yoksa NotFound |
|  | DeleteAuthorCommand | — | BR-13 → Conflict |
|  | GetAuthorByIdQuery | AuthorResponse | Yoksa NotFound |
|  | ListAuthorsQuery | PagedList\<AuthorResponse\> | Arama ve sayfalama |
| Books | CreateBookCommand | Guid | Yazar yoksa NotFound; ISBN varsa Conflict (BR-02) |
|  | UpdateBookCommand | — | BR-03 |
|  | AddBookCopiesCommand | — | Kopya sayısı pozitif |
|  | DeleteBookCommand | — | BR-14 |
|  | GetBookByIdQuery | BookResponse | Silinmiş kitap görünmez |
|  | SearchBooksQuery | PagedList\<BookSummaryResponse\> | Arama, authorId, sortBy beyaz listesi |
| Members | RegisterMemberCommand | Guid | BR-16; şifre hash'lenir |
|  | LoginCommand | TokenResponse | E-posta yoksa da şifre yanlışsa da **aynı** hata |
|  | GetCurrentMemberQuery | MemberResponse | Id `IUserContext`'ten |
|  | ListMembersQuery | PagedList\<MemberResponse\> | Şifre hash'i asla dönmez |
|  | DeactivateMemberCommand | — | BR-15 |
| Loans | BorrowBookCommand | Guid | MemberId `IUserContext`'ten; `LendingService` |
|  | ExtendLoanCommand | — | Sadece ödüncün sahibi uzatabilir |
|  | ReturnLoanCommand | ReturnLoanResponse | Ceza + kitabın stoğu geri artar |
|  | GetMyLoansQuery | IReadOnlyList\<LoanResponse\> |  |
|  | ListOverdueLoansQuery | PagedList\<OverdueLoanResponse\> | Şimdiki zaman `TimeProvider`'dan |

> **Neden?** Login'de “böyle bir e-posta yok” ile “şifre yanlış” arasında fark gösterirsen, saldırgan hangi e-postaların kayıtlı olduğunu öğrenebilir (user enumeration). İkisi de aynı `InvalidCredentials` hatasını dönmeli.

> **Bilgi:** Başka bir üyenin ödüncünü uzatmaya çalışan biri için iki seçenek var: 403 Forbidden ya da 404 Not Found. 404, kaynağın varlığını bile sızdırmaz. Hangisini seçtiğini ve nedenini handler'da bir yorumla belirt; review'da konuşalım.

### 2.5 Command handler'ın tipik akışı

1. Gerekli aggregate'leri repository'lerden yükle; bulunamazsa NotFound dön.
2. Gerekli ön kontrolleri yap (ör. benzersizlik).
3. İş mantığını domain'e devret: entity metodu ya da domain service.
4. Domain'den başarısız bir `Result` gelirse aynen yukarı ilet.
5. Yeni entity'leri repository'ye ekle.
6. `IUnitOfWork.SaveChangesAsync` ile hepsini tek seferde kaydet.
7. Sonucu (id ya da DTO) döndür.

> **Dikkat:** Handler'ın içinde `if` ile bir iş kuralı yazmaya başladıysan dur ve düşün: bu kural büyük ihtimalle Domain'e aittir. Handler'lar orkestra şefidir; kuralı kendileri çalmazlar.

### 2.6 Validasyon ve decorator'lar

- Her command (ve parametre alan her query) için bir `AbstractValidator` yaz. Örnek kurallar: Title zorunlu ve en fazla 200 karakter; ISBN zorunlu; TotalCopies 1–1000; PageSize 1–100; SortBy izin verilen değerlerden biri; şifre en az 8 karakter ve büyük harf, küçük harf ve rakam içeriyor.
- **ValidationDecorator:** handler arayüzünü uygulayan ve gerçek handler'ı saran bir sınıf. Command için kayıtlı tüm validator'ları çalıştırır; hata varsa handler'ı hiç çağırmadan `ValidationError` döner.
- **LoggingDecorator:** isteğin adını ve süresini loglar; başarısız `Result` dönerse hata kodunu Warning seviyesinde loglar.

> **Neden?** Validasyon iki yerde yapılır ve ikisi de gereklidir. Application'daki validator **girdiyi** kontrol eder: hızlıdır, tüm hataları tek seferde toplar ve 400 döner. Domain ise **değişmezleri (invariant)** korur; son savunma hattıdır. ISBN kontrol hanesi gibi karmaşık bir kuralı iki yerde yazma; validator'da sadece “boş olmasın” de, gerisini domain'e bırak.

### 2.7 DTO'lar ve mapping

- Response tipleri sealed record'dur ve yalnızca veri taşır.
- Entity'ler katmanın dışına asla çıkmaz; Api'ye her zaman DTO gider.
- Entity'den DTO'ya dönüşümü elle yaz (statik bir fabrika metodu ya da extension method).

### 2.8 Bağımlılık kaydı (DependencyInjection.cs)

- `IServiceCollection` için bir `AddApplication` extension metodu yaz.
- Handler'ları Scrutor ile assembly'yi tarayarak Scoped olarak kaydet. Ardından decorator'ları ekle. Kayıt sırasına dikkat: en dıştaki decorator hangisi olmalı?
- Validator'ları FluentValidation'ın assembly tarama metoduyla kaydet.
- Domain event handler'larını da taramayla kaydet.
- `LendingService` durumsuz olduğu için Singleton olabilir.

> **İpucu:** Scrutor'a geçmeden önce bir iki handler'ı elle kaydetmeyi dene. Neyi otomatikleştirdiğini görmek, taramanın nasıl çalıştığını anlamanı sağlar.

### 2.9 Unit testler (Library.Application.UnitTests)

Repository'leri ve diğer port'ları NSubstitute ile taklit et, zaman için `FakeTimeProvider` kullan. En az şu senaryolar:

| Handler | Senaryolar |
| --- | --- |
| CreateBook | Yazar yok → NotFound; ISBN mevcut → Conflict; başarılı → `Add` ve `SaveChangesAsync` tam olarak birer kez çağrıldı |
| BorrowBook | Kitap yok → NotFound; üye pasif → hata; limit dolu → hata; başarılı → kitabın stoğu düştü, kayıt yapıldı |
| ReturnLoan | Saati 17 gün ileri al → ceza 15,00; zaten iade edilmiş → Conflict |
| Login | Yanlış şifre ve olmayan e-posta → ikisi de aynı hata kodu; doğru bilgi → token döner |
| ValidationDecorator | Geçersiz command'da iç handler hiç çağrılmıyor |
| Validator'lar | FluentValidation'ın test yardımcılarıyla (`TestValidate`) her kural için en az bir test |

## Kabul kriterleri

- [ ] Application'da EF Core ya da ASP.NET Core referansı yok (mimari testler bunu kanıtlıyor).
- [ ] Her command'ın bir validator'ı var.
- [ ] Handler'lar sealed, `internal` ve tek bir iş yapıyor.
- [ ] Tüm async metotlar `CancellationToken` alıyor ve aşağıya iletiyor.
- [ ] Hiçbir handler beklenen bir hata için exception fırlatmıyor.
- [ ] Tüm testler yeşil.

## Review'da bakacaklarım

- Handler'a sızmış iş kuralları
- `SaveChangesAsync`'in birden fazla çağrılması
- DTO yerine entity döndürülmesi
- `CancellationToken`'ın iletilmemesi
- Decorator sırası
- Mock'ların gereğinden fazla detay doğrulaması (kırılgan testler)
