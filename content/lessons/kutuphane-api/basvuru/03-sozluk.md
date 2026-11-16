---
title: Sözlük
summary: Rehberde geçen mimari ve domain terimlerinin kısa açıklamaları.
minutes: 3
level: beginner
---
| Terim | Açıklama |
| --- | --- |
| Aggregate | Birlikte tutarlı kalması gereken nesneler kümesi ve onun giriş noktası (aggregate root). Dışarıdan yalnızca kök üzerinden değiştirilir |
| Entity | Kimliği (Id) olan ve zaman içinde durumu değişen nesne |
| Value Object | Kimliği olmayan, değerleriyle tanımlanan, değişmez (immutable) nesne (Isbn, Email) |
| Domain Service | Tek bir entity'ye ait olmayan iş kuralını barındıran durumsuz sınıf (LendingService) |
| Domain Event | Domain'de olmuş önemli bir olayın kaydı (“ödünç oluşturuldu”) |
| Invariant | Bir nesnenin her zaman doğru olması gereken kuralı (stok asla eksi olmaz) |
| CQRS | Durum değiştiren işlemler (command) ile okuma işlemlerinin (query) ayrılması |
| Repository | Aggregate'leri bir koleksiyon gibi yükleyip ekleyen soyutlama |
| Unit of Work | Bir işlemdeki tüm değişiklikleri tek seferde kaydeden soyutlama |
| Port / Adapter | Port: iç katmanın tanımladığı arayüz. Adapter: dış katmandaki implementasyonu |
| Composition Root | Tüm bağımlılıkların bir araya getirildiği tek nokta (Program.cs) |
| Decorator | Bir nesneyi aynı arayüzle sarıp davranış ekleyen tasarım kalıbı |
| Result Pattern | Başarı ya da hatayı exception yerine dönüş değeriyle ifade etme |
| ProblemDetails | HTTP API hata yanıtları için standart format (RFC 9457) |
| Optimistic Concurrency | Kilit koymadan, kaydetme anında verinin başkası tarafından değiştirilip değiştirilmediğini kontrol etme (RowVersion) |
| Soft Delete | Kaydı silmek yerine silinmiş olarak işaretleme |
| Idempotent | Aynı işlemi birden çok kez yapmanın tek sefer yapmakla aynı sonucu vermesi (seed işlemi) |
