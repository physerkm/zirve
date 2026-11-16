---
title: "Proje tanımı: Kütüphane Yönetim API'si"
summary: Varlıklar, 17 iş kuralı (BR-01…BR-17), endpoint listesi ve hata yanıtları.
minutes: 6
level: intermediate
---
Bir kütüphanenin yazarlarını, kitaplarını, üyelerini ve ödünç işlemlerini yöneten bir REST API yazacaksın. Sistemde iki rol var: **Librarian** (kütüphaneci; katalog ve iade yönetimi) ve **Member** (üye; kitap ödünç alır, süre uzatır). Bu alanı seçmemin nedeni, CRUD'un ötesinde gerçek iş kuralları içermesi: ödünç limiti, gecikme cezası, stok takibi, eşzamanlılık. Clean Architecture'ın değeri tam da bu kuralları doğru yere koyduğunda ortaya çıkar.

## 3.1 Varlıklar (entity'ler)

| Varlık | Alanlar | Notlar |
| --- | --- | --- |
| **Author** | Id, FirstName, LastName, Biography (opsiyonel), CreatedAt, UpdatedAt | FullName hesaplanan özellik |
| **Book** | Id, Title, Isbn, PublicationYear, AuthorId, TotalCopies, AvailableCopies, IsDeleted, DeletedAt, RowVersion, CreatedAt, UpdatedAt | Isbn bir value object. RowVersion eşzamanlılık kontrolü için. Silme soft delete |
| **Member** | Id, FullName, Email, PasswordHash, Role, IsActive, CreatedAt, UpdatedAt | Email bir value object. Role: Member veya Librarian |
| **Loan** | Id, BookId, MemberId, BorrowedAt, DueAt, ReturnedAt (boş olabilir), IsExtended, LateFee | ReturnedAt boşsa ödünç aktiftir |

> **Bilgi:** Tüm zaman alanları `DateTimeOffset` olacak ve değerleri her zaman UTC olarak `TimeProvider`'dan alınacak. Kimlikler `Guid` (sürüm 7) olacak.

## 3.2 İş kuralları

Bu kurallar projenin kalbidir. Kod yazarken, test yazarken ve review'da hep bu kodlara (BR-xx) atıf yapacağız.

| Kod | Kural |
| --- | --- |
| BR-01 | ISBN 13 haneli olmalı ve ISBN-13 kontrol hanesi doğru olmalı. Girdideki tire ve boşluklar kabul edilir, saklanmadan önce temizlenir. |
| BR-02 | ISBN sistemde benzersizdir. |
| BR-03 | Yayın yılı 1450 ile içinde bulunulan yıl arasında olmalıdır. |
| BR-04 | TotalCopies en az 1'dir. AvailableCopies hiçbir zaman 0'ın altına düşmez ve TotalCopies'i aşmaz. |
| BR-05 | Mevcut kopyası kalmamış kitap ödünç verilemez. |
| BR-06 | Bir üye aynı anda en fazla **3** aktif ödünç tutabilir. |
| BR-07 | Gecikmiş (süresi geçmiş ve iade edilmemiş) ödüncü olan üye yeni kitap alamaz. |
| BR-08 | Pasif üye kitap alamaz. |
| BR-09 | Ödünç süresi **14 gündür**. |
| BR-10 | Bir ödünç yalnızca **bir kez**, **7 gün** uzatılabilir. Gecikmiş ödünç uzatılamaz. |
| BR-11 | İade sırasında gecikme varsa, geciken her tam gün için **5,00 TL** ceza hesaplanır. |
| BR-12 | İade edilmiş bir ödünç tekrar iade edilemez ve uzatılamaz. |
| BR-13 | Kitabı olan yazar silinemez. |
| BR-14 | Aktif ödüncü olan kitap silinemez. Kitap silme işlemi soft delete'tir. |
| BR-15 | Aktif ödüncü olan üye pasifleştirilemez. |
| BR-16 | E-posta sistemde benzersizdir; boşlukları kırpılır ve küçük harfe çevrilir. |
| BR-17 | Bir üye aynı kitabı aynı anda iki kez ödünç alamaz. |

> **Dikkat:** 3, 14, 7 ve 5,00 gibi değerler koda “sihirli sayı” olarak gömülmemeli. Domain katmanında anlamlı adlara sahip sabitler olarak tek bir yerde dursunlar (ör. `LendingPolicy` adında statik bir sınıf).

## 3.3 Endpoint listesi

Tüm yollar `/api/v1` önekiyle başlar. “Faz” sütunu, endpoint'i hangi fazda yazacağını gösterir.

| Metot | Yol | Yetki | Açıklama | Başarı | Faz |
| --- | --- | --- | --- | --- | --- |
| POST | /auth/register | Anonim | Üye kaydı (BR-16) | 201 | 5 |
| POST | /auth/login | Anonim + rate limit | JWT döner | 200 | 5 |
| GET | /authors | Anonim | Sayfalı liste | 200 | 4 |
| GET | /authors/{id} | Anonim | Detay | 200 | 4 |
| POST | /authors | Librarian | Yazar oluştur | 201 | 4 |
| PUT | /authors/{id} | Librarian | Yazar güncelle | 204 | 4 |
| DELETE | /authors/{id} | Librarian | Yazar sil (BR-13) | 204 | 4 |
| GET | /books | Anonim | Arama, filtre, sıralama, sayfalama | 200 | 4 |
| GET | /books/{id} | Anonim | Detay (yazar adıyla) | 200 | 4 |
| POST | /books | Librarian | Kitap oluştur | 201 | 4 |
| PUT | /books/{id} | Librarian | Başlık ve yıl güncelle | 204 | 4 |
| POST | /books/{id}/copies | Librarian | Kopya ekle | 204 | 4 |
| DELETE | /books/{id} | Librarian | Soft delete (BR-14) | 204 | 4 |
| GET | /members/me | Giriş yapmış herkes | Kendi profilim | 200 | 5 |
| GET | /members | Librarian | Sayfalı üye listesi | 200 | 5 |
| POST | /members/{id}/deactivate | Librarian | Üyeyi pasifleştir (BR-15) | 204 | 5 |
| POST | /loans | Member | Ödünç al (gövde: bookId) | 201 | 5 |
| POST | /loans/{id}/extend | Member (sadece sahibi) | Süre uzat (BR-10) | 204 | 5 |
| POST | /loans/{id}/return | Librarian | İade al, cezayı hesapla | 200 | 5 |
| GET | /loans/me | Member | Ödünçlerim | 200 | 5 |
| GET | /loans/overdue | Librarian | Gecikmiş ödünçler | 200 | 5 |
| GET | /health (önek yok) | Anonim | Sağlık kontrolü | 200 | 6 |

### Liste sorgu parametreleri

- `page`: varsayılan 1, en az 1.
- `pageSize`: varsayılan 20, 1 ile 100 arası.
- `search`: başlıkta (kitap) ya da ad-soyadda (yazar, üye) arama.
- `authorId`: yalnızca kitap listesinde filtre.
- `sortBy`: kitaplar için `title`, `year`, `createdAt`. Bunların dışındaki değerler 400 döner.
- `sortOrder`: `asc` veya `desc`.

Sayfalı yanıtın alanları: `items`, `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`.

## 3.4 Hata yanıtları

Tüm hata yanıtları RFC 9457 **ProblemDetails** formatında olacak: `type`, `title`, `status`, `detail`, `instance` ve ek olarak `traceId`. Validasyon hatalarında alan bazlı `errors` sözlüğü de bulunur. `title` alanında hata kodunu (ör. `Books.NoCopiesAvailable`) taşıyacağız; istemci bu koda göre karar verebilsin.

| Hata türü (ErrorType) | HTTP | Örnek |
| --- | --- | --- |
| Validation | 400 Bad Request | Boş başlık, pageSize = 500 |
| Unauthorized | 401 Unauthorized | Yanlış e-posta veya şifre |
| Forbidden | 403 Forbidden | Kural gereği izin verilmeyen işlem |
| NotFound | 404 Not Found | Olmayan kitap id'si |
| Conflict | 409 Conflict | Aynı ISBN, kopya yok, limit dolu, zaten iade edilmiş, eşzamanlılık çakışması |
| Failure (beklenmeyen) | 500 Internal Server Error | Yakalanmamış exception. Detay yalnızca Development ortamında gösterilir |
