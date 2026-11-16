---
title: Faz 8 — Bonus görevler
summary: "Docker, CI, Outbox, strongly-typed ID, PostgreSQL'e geçiş ve diğer ileri görevler."
minutes: 3
level: advanced
---
Ana projeyi bitirdikten sonra seviyeni artırmak için seçebileceğin görevler. Her biri bağımsızdır; istediğin sırayla yapabilirsin.

| Görev | Ne öğretir? |
| --- | --- |
| **PostgreSQL'e geçiş** | Clean Architecture'ın getirisini somut olarak görürsün: yalnızca Infrastructure ve yapılandırma değişmeli. Domain, Application ve testlerin büyük kısmı hiç değişmemeli |
| **Docker**: Docker Desktop'ı kur, uygulamayı container'a al (`dotnet publish` ile SDK'nın yerleşik container desteği ya da çok aşamalı Dockerfile), docker compose ile SQL Server | Container'lar, ortam değişkenleriyle yapılandırma |
| **Testcontainers**'a geçiş | Testlerin her makinede aynı veritabanıyla çalışması |
| **GitHub Actions** ile CI: her push'ta build + test | Sürekli entegrasyon |
| **Outbox pattern**: domain event'leri aynı transaction'da bir tabloya yaz, arka plan servisiyle işle | Güvenilir mesajlaşma, `BackgroundService` |
| **Strongly-typed ID**'ler (BookId, MemberId…) | Primitive obsession'ın son kalesini yıkmak; yanlış id'yi yanlış yere geçirmenin derleme hatası olması |
| **API versioning** (Asp.Versioning.Http) ile bir v2 endpoint | Geriye dönük uyumluluk |
| **Refresh token** akışı | Kısa ömürlü access token + uzun ömürlü refresh token, token iptali |
| **HybridCache** ile kitap detayı önbelleği | Bellek + dağıtık önbellek, stampede koruması |
| **.NET 10 yerleşik minimal API validasyonu** ile FluentValidation karşılaştırması | Framework'ün yeni özelliklerini değerlendirme |
| **OpenTelemetry** ile trace ve metrik | Modern gözlemlenebilirlik |
