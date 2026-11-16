---
title: Faz 0 — Çözüm iskeleti
summary: Kuralları baştan sıkı tutulan, sıfır uyarıyla derlenen boş çözümü ve test projelerini kur.
minutes: 3
level: beginner
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | Kuralları baştan sıkı tutulan, derlenen, boş bir çözüm kurmak. |
| **Öğreneceklerin** | dotnet CLI, .slnx çözüm formatı, proje referansları, Directory.Build.props, Central Package Management, .NET analyzer'ları, global.json. |
| **Faz sonunda elinde olacak** | 4 kaynak ve 4 test projesi içeren, sıfır uyarıyla derlenen ve git'e commit'lenmiş bir çözüm. |

## Görevler

### 0.1 Klasör, git ve çözüm dosyaları

VS Code'da bir PowerShell terminali aç ve sırayla çalıştır:

```bash
mkdir C:\Pratik; cd C:\Pratik
mkdir LibraryApi; cd LibraryApi
git init
dotnet new gitignore
dotnet new editorconfig
dotnet new globaljson --sdk-version 10.0.402 --roll-forward latestFeature
dotnet new sln -n Library
```

> **Bilgi:** .NET 10'da `dotnet new sln` varsayılan olarak yeni, sade XML tabanlı `.slnx` formatını üretir.

### 0.2 Kaynak projeler

```bash
dotnet new classlib -n Library.Domain -o src/Library.Domain
dotnet new classlib -n Library.Application -o src/Library.Application
dotnet new classlib -n Library.Infrastructure -o src/Library.Infrastructure
dotnet new webapi -n Library.Api -o src/Library.Api
dotnet sln add src/Library.Domain src/Library.Application src/Library.Infrastructure src/Library.Api
```

### 0.3 Proje referansları

Komutu sen bul (ipucu: `dotnet add <proje> reference <hedef>`). Kurman gereken referanslar:

- Application → Domain
- Infrastructure → Application
- Api → Application ve Infrastructure

> **Neden?** Infrastructure'ın Domain'e doğrudan referansı yok; Application üzerinden geçişli olarak erişir. Domain'den dışarıya hiçbir ok yok.

### 0.4 Şablon artıklarını temizle

- Class library'lerdeki `Class1.cs` dosyalarını sil.
- Api'deki WeatherForecast örnek endpoint'ini ve kaydını sil. `Program.cs` neredeyse boş kalsın.
- Api'deki `.http` dosyasının adını `Library.Api.http` olarak bırak; içeriğini Faz 4'te dolduracaksın.

### 0.5 Directory.Build.props (ortak derleme ayarları)

Kök klasörde `dotnet new buildprops` ile oluştur. Tüm projelerde ortak olacak şu ayarları buraya taşı ve csproj'lardan sil:

- `TargetFramework`: net10.0
- `Nullable`: enable
- `ImplicitUsings`: enable
- `TreatWarningsAsErrors`: true (uyarılar build'i kırar; disiplin buradan başlar)
- `AnalysisLevel`: latest-recommended (.NET kod analizörlerinin önerilen kural seti)
- `EnforceCodeStyleInBuild`: true (.editorconfig stil kuralları build sırasında da denetlenir)

### 0.6 Directory.Packages.props (merkezi paket yönetimi)

Kök klasörde `dotnet new packagesprops` ile oluştur, `ManagePackageVersionsCentrally` özelliğinin true olduğundan emin ol. Api şablonunun eklediği `Microsoft.AspNetCore.OpenApi` sürümünü buraya taşı.

### 0.7 .editorconfig ayarları

Oluşan dosyayı oku; özellikle şunları kontrol et ya da ekle:

- Dosya kapsamlı namespace tercihi (file-scoped namespace), uyarı seviyesinde.
- Kullanılmayan `using`'lerin uyarı vermesi (IDE0005).
- Migration dosyaları için ayrı bir bölüm açıp bu dosyaları üretilmiş kod (generated code) olarak işaretle. Aksi halde EF'in ürettiği kod analizör uyarısı verip build'i kırabilir.
- Test projelerinde test metodu adlarındaki alt çizgiye izin ver (CA1707). Bunun için `tests/` klasörüne ikinci bir `.editorconfig` koyabilirsin.

### 0.8 Test projeleri

```bash
dotnet new install xunit.v3.templates
dotnet new xunit3 -n Library.Domain.UnitTests -o tests/Library.Domain.UnitTests
dotnet new xunit3 -n Library.Application.UnitTests -o tests/Library.Application.UnitTests
dotnet new xunit3 -n Library.Api.IntegrationTests -o tests/Library.Api.IntegrationTests
dotnet new xunit3 -n Library.ArchitectureTests -o tests/Library.ArchitectureTests
```

Bunları çözüme ekle, şablonun yazdığı paket sürümlerini `Directory.Packages.props`'a taşı ve şu referansları kur: Domain.UnitTests → Domain; Application.UnitTests → Application; IntegrationTests → Api; ArchitectureTests → dört kaynak projenin hepsi.

### 0.9 İlk commit

`dotnet build` ve `dotnet test` çalıştır, ardından ilk commit'i at. VS Code'da açmak için kök klasörde `code .` yazabilirsin.

## Kabul kriterleri

- [ ] `dotnet build` 0 uyarı ve 0 hata ile bitiyor.
- [ ] csproj dosyalarında `TargetFramework`, `Nullable` gibi tekrar eden ayarlar yok.
- [ ] Hiçbir csproj'da paket sürümü yazmıyor; sürümler yalnızca `Directory.Packages.props`'ta.
- [ ] Referans yönleri [Bölüm 4.1](/tracks/kutuphane-api/mimari)'deki tabloyla birebir aynı.
- [ ] `dotnet run --project src/Library.Api` uygulamayı ayağa kaldırıyor.
- [ ] `bin/` ve `obj/` klasörleri git'e girmiyor.

## Review'da bakacaklarım

- Referans yönleri ve gereksiz referanslar
- props dosyalarının içeriği ve csproj'lardaki tekrarlar
- Silinmemiş şablon dosyaları
- global.json ve .editorconfig ayarları
