---
title: Geliştirme ortamın
summary: Gereken araçlar, önerilen VS Code eklentileri ve proje konumu.
minutes: 3
level: beginner
---
Rehber aşağıdaki ortama göre yazıldı. Komutlar Windows ve PowerShell içindir; başka bir işletim sisteminde çalışıyorsan yolları ve veritabanını kendi ortamına uyarlaman gerekir.

| Araç | Rehberdeki sürüm | Bu projede |
| --- | --- | --- |
| .NET SDK | 10.0.402 | Projeler `net10.0` hedefleyecek (.NET 10 bir LTS sürümüdür) |
| VS Code | 1.143 | Ana editör. Aşağıdaki eklentileri kur |
| SQL Server LocalDB | `MSSQLLocalDB` örneği | Geliştirme ve test veritabanı. `sqllocaldb info` ile kurulu olduğunu doğrula |
| PostgreSQL | 18 (isteğe bağlı) | Bonus fazda veritabanı değiştirme alıştırması için |
| Git | 2.56 | Her faz için commit |
| Docker | Gerekmez | Testcontainers yerine LocalDB ile entegrasyon testi yapacağız. Docker bonus fazda |

## 2.1 Önerilen VS Code eklentileri

- **C# Dev Kit** (Microsoft): IntelliSense, test gezgini, çözüm görünümü.
- **REST Client** (Huachao Mao): `.http` dosyalarından istek göndermek için. (C# Dev Kit'in kendi `.http` desteği de var; birini seç.)
- **SQL Server (mssql)** (Microsoft): LocalDB'ye bağlanıp tabloları ve verileri görmek için.
- **EditorConfig for VS Code**: `.editorconfig` kurallarının editörde uygulanması için.

## 2.2 Proje konumu

Projeyi kısa ve boşluk içermeyen bir klasörde oluştur; rehberdeki komutlar `C:\Pratik\LibraryApi` yolunu kullanır. Kod, değişken ve sınıf adları İngilizce olacak (sektör standardı); bu belge ve commit mesajların Türkçe olabilir.
