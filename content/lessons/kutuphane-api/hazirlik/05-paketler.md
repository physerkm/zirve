---
title: Paketler
summary: Hangi NuGet paketi hangi projeye, hangi fazda ve ne amaçla eklenecek.
minutes: 3
level: beginner
---
Aşağıdaki paketleri ilgili fazda ekleyeceksin. Sürüm numarası vermiyorum: NuGet.org'dan ya da `dotnet package search <paket-adı>` komutuyla .NET 10 ile uyumlu **en güncel kararlı** sürümü seç. Bu da öğrenmenin bir parçası.

| Proje | Paket | Amaç | Faz |
| --- | --- | --- | --- |
| Domain | (hiçbiri) | Domain saf C# kalır | 1 |
| Application | FluentValidation, FluentValidation.DependencyInjectionExtensions | Validasyon kuralları ve DI kaydı | 2 |
| Application | Scrutor | Handler'ları otomatik tarama ve decorator kaydı | 2 |
| Application | Microsoft.Extensions.Logging.Abstractions | Log decorator'ı için `ILogger` | 2 |
| Infrastructure | Microsoft.EntityFrameworkCore.SqlServer | EF Core + SQL Server | 3 |
| Infrastructure | Microsoft.Extensions.Identity.Core | Hazır, güvenli `PasswordHasher` (PBKDF2) | 3 |
| Infrastructure | Microsoft.IdentityModel.JsonWebTokens | JWT üretimi (`JsonWebTokenHandler`) | 3 |
| Infrastructure | Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore | Veritabanı health check'i | 6 |
| Api | Microsoft.AspNetCore.OpenApi | OpenAPI dokümanı (şablonda zaten var) | 0 |
| Api | Microsoft.EntityFrameworkCore.Design | Migration araçları (startup projesinde olmalı) | 3 |
| Api | Scalar.AspNetCore | API'yi tarayıcıdan denemek için arayüz | 4 |
| Api | Microsoft.AspNetCore.Authentication.JwtBearer | Gelen JWT'leri doğrulama | 5 |
| Api | Serilog.AspNetCore | Yapısal loglama | 6 |
| Tüm testler | xunit.v3, xunit.runner.visualstudio, Microsoft.NET.Test.Sdk | Test altyapısı (şablondan gelir) | 0 |
| Tüm testler | Shouldly | Okunaklı doğrulamalar (assertion) | 1 |
| Application.UnitTests | NSubstitute | Arayüzleri taklit etmek (mock) | 2 |
| Unit + Integration | Microsoft.Extensions.TimeProvider.Testing | `FakeTimeProvider` ile zamanı kontrol etmek | 1 |
| IntegrationTests | Microsoft.AspNetCore.Mvc.Testing | `WebApplicationFactory` ile API'yi bellekte ayağa kaldırmak | 7 |
| ArchitectureTests | NetArchTest.Rules | Katman bağımlılıklarını test etmek | 1 |

> **İpucu:** Central Package Management açıkken `dotnet add package` sürümü `Directory.Packages.props`'a, referansı ise csproj'a sürümsüz yazar. Bir şablon csproj'a sürümlü referans eklemişse NU1008 hatası alırsın; sürümü props dosyasına taşıyıp csproj'dan silmen gerekir.
