---
title: Faz 6 — Cross-cutting konular
summary: Yapısal loglama, izlenebilirlik, health check, CORS ve output caching.
minutes: 3
level: advanced
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | Uygulamayı gözlemlenebilir ve üretime hazır hale getirmek. |
| **Öğreneceklerin** | Yapısal loglama, request logging, trace id, domain event handler'ları, health check, CORS, output caching, ortam bazlı yapılandırma. |
| **Faz sonunda elinde olacak** | Ne yaptığını anlatan loglar üreten, sağlık durumunu raporlayan ve güvenli varsayılanlarla çalışan bir API. |

## Görevler

### 6.1 Serilog

- Serilog'u yapılandırmayı `appsettings.json`'dan okuyacak şekilde kur; Console sink yeterli.
- Request logging middleware'ini ekle: her istek için tek satırlık özet log (metot, yol, status, süre).
- `Microsoft.*` ve `System.*` kaynaklarının log seviyesini Warning'e çek; gürültüyü azalt.
- Mesajlarda string interpolation değil **mesaj şablonu** kullan; böylece değerler ayrı alanlar olarak saklanır.

> **Dikkat:** Şifre, token, bağlantı dizesi gibi hassas bilgiler asla loglanmamalı. LoggingDecorator'ın command'ın tamamını loglamadığından emin ol: LoginCommand içinde şifre var!

### 6.2 İzlenebilirlik

Her log satırında ve her ProblemDetails yanıtında aynı trace id bulunsun. Bir hata yanıtındaki `traceId` ile o isteğin tüm loglarını bulabilmelisin.

### 6.3 Domain event handler'ları

- `LoanCreatedDomainEvent` → “Üyeye ödünç bilgilendirmesi gönderildi” logu (gerçek e-posta göndermiyoruz).
- `LoanReturnedDomainEvent` → ceza varsa Warning seviyesinde ceza logu.
- `MemberRegisteredDomainEvent` → hoş geldin bildirimi logu.

### 6.4 Health check

- `/health` endpoint'i: veritabanı kontrolünü içersin, sonucu JSON olarak dönsün.
- Bonus: `/health/live` (yalnızca uygulama ayakta mı) ve `/health/ready` (veritabanı dahil) ayrımı. Bu ayrımın neden yapıldığını araştır (Kubernetes liveness ve readiness).

### 6.5 CORS

İsimlendirilmiş bir CORS policy'si yaz; izin verilen origin'ler yapılandırmadan okunsun. Development'ta `http://localhost:5173` gibi bir ön yüz adresine izin ver. Hiçbir zaman “tüm origin'ler + credentials” kombinasyonunu kullanma.

### 6.6 Output caching (isteğe bağlı)

- `GET /books` ve `GET /books/{id}` yanıtlarını `books` etiketiyle önbelleğe al.
- Kitap oluşturma, güncelleme, kopya ekleme, silme, ödünç ve iade sonrasında bu etiketi geçersiz kıl (evict). Ödünç ve iade neden kitap önbelleğini etkiliyor? Düşün.

### 6.7 Production güvenliği

- Production'da HTTPS yönlendirmesi ve HSTS açık olsun.
- Tüm Options sınıfları başlangıçta doğrulansın; eksik yapılandırmayla uygulama hiç açılmasın.

## Kendin test et

1. Bir kitap ödünç al ve konsolda request logu, decorator logu ve domain event logunu sırasıyla gör.
2. Bir hata yanıtındaki `traceId`'yi konsol loglarında ara.
3. `/health` → 200 Healthy. Bağlantı dizesindeki sunucu adını geçici olarak bozup tekrar dene → 503 Unhealthy.
4. Login isteği at ve loglarda şifrenin görünmediğini doğrula.
5. Output cache açıksa: aynı GET'i iki kez at ve ikincisinin veritabanına gitmediğini EF loglarından doğrula; kitabı güncelleyip tekrar GET at, yeni veri gelmeli.

## Kabul kriterleri

- [ ] Loglarda hassas veri yok.
- [ ] Log mesajları yapısal (mesaj şablonu kullanıyor).
- [ ] Health check veritabanı durumunu doğru yansıtıyor.
- [ ] Eksik zorunlu yapılandırmada uygulama açılışta anlaşılır bir hatayla duruyor.
