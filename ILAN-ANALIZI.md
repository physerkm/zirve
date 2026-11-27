# İş İlanı Analizi ve Zirve Eksik Konu Raporu

- **Tarih:** 24 Kasım 2026
- **Hedef roller:** .NET Backend Developer, Full-stack (.NET + React/Angular) Developer, Software Engineer (C#/.NET). Junior'dan Senior/Lead'e kadar bütün seviyeler. 5+ yıl isteyen ilanlar da dahil.
- **Lokasyon:** Bütün dünya (Türkiye, Avrupa, ABD, tamamen uzaktan).
- **Kapsam dışı:** Veri bilimi, ML mühendisliği ve biyoistatistik ilanları.

Bu belge iki soruyu cevaplar: (1) Bu ilanlar adaydan tam olarak neyi bilmesini istiyor? (2) Zirve bunların hangisini öğretiyor, hangisini öğretmiyor?

> **Uygulama durumu:** Bölüm 4'teki planın A, B ve C fazlarının hepsi uygulandı: 31 ders ve 10 test (106 soru). İsteğe bağlı Angular yolu, kullanıcı kararıyla eklenmedi. Bölüm 3'teki tablo, içerik eklenmeden **önceki** durumu gösterir.

---

## 1. Yöntem

1. **Tam metni okunan ilanlar (18 gerçek ilan + 1 kıdemli rol şablonu).** İlan sayfası açılıp gereksinim listesinin tamamı çıkarıldı.
   - Türkiye (9): GlobalPBX (Senior .NET Full Stack), Trendyol (Software Engineer), İhlas Holding (Senior .NET Core), Condolife (Back-End), Mobilişim (Yazılım Geliştirme Uzmanı), gizli firma (Yazılım Mühendisi, Ankara), Logvance (.NET Geliştirici), Sürat Kargo (Backend Specialist), Infoset (Full Stack .NET Core/React).
   - Avrupa / uzaktan (4): Celebratix (Senior Backend .NET, Amsterdam), Boardwise (Senior Full Stack ASP.NET Core + React, uzaktan), Codemotion (Senior .NET + yapay zekâ, uzaktan), Kozak Agency (Full Stack .NET + React, uzaktan).
   - ABD (5): Microsoft. Senior SWE Distributed Systems, Senior SWE Full-Stack, SWE II (C#/.NET), SWE II/Senior Backend (Azure Monitor), Senior SWE Backend Platform & Commerce.
   - Şablon (1): jobdescription.org "Senior .NET Developer" rol tanımı. Gerçek bir ilan olmadığı için sayımlara katılmadı, yalnızca kıdemli beklentileri görmek için kullanıldı.
2. **Hedefli aramalar (15 arama).** kariyer.net, techcareer.net, LinkedIn kaynaklı ilan sayfaları, Lever/Greenhouse/Workable, WeAreDevelopers, justjoin.it, djinni, Dice, Built In ve ITJobsWatch (İngiltere, 6 aylık beceri istatistiği). Aramalarda yüzlerce ilanın özeti tarandı. Tek tek okunamayan teknolojilerin (gRPC, SignalR, OWASP, OAuth/OIDC, Jest/Playwright, Semantic Kernel vb.) ne sıklıkta geçtiği bu yolla görüldü.
3. **Zirve envanteri.** `content/` altındaki 73 ders, 12 test ve `tracks.yaml` tarandı. Her konu için "kendine ait mülakat seviyesinde ders var mı" diye bakıldı. Bir konunun yalnızca başka bir derste adının geçmesi "var" sayılmadı.

**Sınırlamalar:** kariyer.net ve LinkedIn otomatik erişimi engelliyor (HTTP 403 ve giriş zorunluluğu). Bu iki sitedeki ilanlar arama motoru özetleri ve aynı ilanın yayımlandığı başka sitelerden (techcareer.net, şirket kariyer sayfaları) okundu. Okunan ilanların çoğu 2025 sonu ile 2026 arasında yayımlanmış ve şu an kapanmış durumda. Gereksinimler yine de geçerli, çünkü aynı şirketler aynı rolü tekrar tekrar açıyor. Sayılar bir pazar araştırması değil, temsili bir örneklemdir.

---

## 2. İlanların istediği bilgi ve beceriler (sıklık sırasıyla)

"n/18" sütunu, tam metni okunan 18 ilandan kaçında geçtiğini gösterir. "Arama" sütunu, aramalardaki ek sinyaldir.

| # | Beklenti | n/18 | Arama | Not |
| --- | --- | --- | --- | --- |
| 1 | C#, .NET (Core/8+), ASP.NET Core Web API | 18 | Çok yüksek | Microsoft ilanları dil olarak C#/Java/Python'dan birini kabul ediyor, ekip .NET. |
| 2 | REST API tasarımı ve entegrasyonu | 10 | Yüksek | Versiyonlama, hata modeli, sayfalama. |
| 3 | Mesaj kuyrukları: RabbitMQ, Kafka, Azure Service Bus | 9 | Çok yüksek | Logvance açıkça "mesaj kaybı, retry, dead-letter queue" soruyor. |
| 4 | SQL Server (MSSQL / T-SQL) | 9 | Yüksek | Türkiye ilanlarında baskın veritabanı. |
| 5 | CI/CD (GitHub Actions, GitLab CI, Azure DevOps, Jenkins) | 9 | Yüksek | Kalite kapısı olarak CI ve test hatları. |
| 6 | Bulut: Azure (çoğunluk), AWS | 9 | Yüksek | ITJobsWatch: İngiltere .NET ilanlarının ~%35'inde Azure. |
| 7 | Redis ve dağıtık önbellek | 8 | Yüksek | Invalidation, TTL, cache-aside. |
| 8 | EF Core / ORM (ve Dapper) | 8 | Yüksek | Performans: N+1, izleme, compiled/split query. |
| 9 | Frontend: React + TypeScript | 8 | Yüksek | Full-stack ilanlarında zorunlu, backend ilanlarında artı. |
| 10 | PostgreSQL | 7 | Orta | |
| 11 | Docker ve konteynerler | 7 | Yüksek | |
| 12 | İngilizce (teknik ve iş) | 7 | Yüksek | Yurt dışı ilanlarında akıcılık. |
| 13 | Mikroservis ve/veya modüler monolit | 6 | Çok yüksek | |
| 14 | Clean Architecture, DDD, CQRS/MediatR, Vertical Slice | 6 | Yüksek | Avrupa'da DDD + Event Sourcing sık geçiyor. |
| 15 | Kubernetes (AKS dahil) | 6 | Yüksek | Pod, deployment, Helm, probe'lar. |
| 16 | Mentorluk, code review, mimari karar (ADR) | 6 | Yüksek | Senior/Lead ilanlarının hepsinde. |
| 17 | Unit ve entegrasyon testi | 5 | Yüksek | xUnit, Moq/NSubstitute, WireMock. Testcontainers nadiren adıyla geçiyor. |
| 18 | MongoDB / NoSQL (Cosmos DB) | 5 | Orta | |
| 19 | Git (branch stratejisi, review akışı) | 5 | Yüksek | |
| 20 | **Yapay zekâ destekli geliştirme ve LLM entegrasyonu** | 5 | Yüksek ve artıyor | Trendyol, GlobalPBX, Microsoft: kodlama ajanları, prompt/context yönetimi. Codemotion: RAG, embedding, vektör veritabanı, Semantic Kernel, MCP. |
| 21 | Olay güdümlü mimari | 4 | Yüksek | |
| 22 | SOLID, OOP, tasarım desenleri, clean code, refactoring | 4 | Yüksek | |
| 23 | Gözlemlenebilirlik: log, metrik, iz, ELK, Grafana, App Insights | 4 | Orta | OpenTelemetry giderek standartlaşıyor. |
| 24 | Elasticsearch | 4 | Orta | İndeksleme, arama optimizasyonu. |
| 25 | Güvenlik: kimlik doğrulama, OAuth2/OIDC, OWASP, hassas veri | 4 | Orta | Güvenlik odaklı ilanlarda OWASP Top 10 ve PKCE. |
| 26 | Angular | 4 | Orta | Türkiye'de React kadar yaygın. |
| 27 | Agile / Scrum / Jira | 4 | Yüksek | ITJobsWatch: ".NET Software Developer" ilanlarının ~%53'ünde Agile. |
| 28 | Canlı sistem: on-call, olay yönetimi, kök neden analizi | 3 | Orta | Microsoft ve senior ilanlar. |
| 29 | Eşzamanlılık ve performans (TPL, SemaphoreSlim, GC, bellek) | 3 | Orta | Senior ilanlar ve Microsoft. |
| 30 | Linux | 2 | Düşük | |
| 31 | Legacy sistem modernizasyonu | 2 | Orta | |
| 32 | Arka plan işleri (IHostedService, Hangfire, Quartz) | 1 | Orta | |
| 33 | gRPC, SignalR | 0 | Orta | Aramalarda düzenli çıkıyor. |
| 34 | Frontend testi (Jest/Vitest, React Testing Library, Playwright) | 0 | Orta | Full-stack ilanlarında. |
| 35 | Redux / durum yönetimi | 1 | Orta | |
| 36 | .NET Aspire, Native AOT, modern C# (12/13) | 1 | Düşük ama yükseliyor | |
| 37 | Algoritmik düşünme ve problem çözme | 4 | Yüksek | Büyük şirket mülakatlarının temeli. |
| 38 | Dağıtık sistem temelleri (tutarlılık, uzlaşma, ölçekleme) | 4 | Yüksek | |

**Deneyim beklentisi:** Türkiye ilanları 2–4, 4–6 ve 8–10 yıl aralıklarına yayılıyor. Avrupa'daki uzaktan senior roller 4–5+ yıl istiyor. Microsoft'ta SWE II için 2+ yıl, Senior için 4+ yıl yeterli. Lead rollerde 6–12 yıl ve teknik liderlik deneyimi bekleniyor.

---

## 3. Zirve'nin kapsamı: ne var, ne eksik

Durum işaretleri:

- ✅ **Var:** Kendine ait, mülakat seviyesinde dersi var.
- 🟡 **Kısmi:** Yalnızca Kütüphane API projesinde uygulama adımı olarak ya da sistem tasarımında kavram olarak geçiyor. Kendine ait dersi ve testi yok.
- ❌ **Yok:** Zirve'de hiç işlenmiyor.

| Beklenti (yukarıdaki #) | Zirve'deki durum | Nerede |
| --- | --- | --- |
| C# temelleri, async, LINQ (1) | ✅ | `csharp/temeller`, `csharp/dil-ozellikleri` |
| ASP.NET Core istek hattı ve DI (1) | ✅ | `dotnet/aspnet-core/01` (tek ders) |
| REST API tasarımı (2) | 🟡 | `sistem-tasarimi/temeller/04` (kavram). ASP.NET Core'da uygulaması (validation, ProblemDetails, versiyonlama) yok. |
| Mesaj kuyrukları (3) | 🟡 | `sistem-tasarimi/yapi-taslari/01` ve `projeler/04` kavram düzeyinde. RabbitMQ exchange türleri, ack, DLQ, Kafka partition ve consumer group, MassTransit, Azure Service Bus anlatılmıyor. |
| SQL Server / T-SQL (4) | 🟡 | Veritabanı dersleri PostgreSQL üzerinden. SQL Server farkları, stored procedure ve T-SQL yok. |
| CI/CD (5) | ❌ | |
| Bulut: Azure/AWS (6) | ❌ | Yalnızca kaynak listelerinde adı geçiyor. |
| Redis ve önbellek (7) | 🟡 | Sistem tasarımında kavram var. .NET'te uygulaması (IDistributedCache, HybridCache, invalidation) yok. |
| EF Core derinlemesine (8) | 🟡 | Kütüphane projesinde kullanılıyor. Planlanan `dotnet/veri-ve-uretim` bölümü **boş**. |
| React + TypeScript (9) | ✅ temel | `react/temeller/01`, `typescript/temeller/01`. Planlanan `react/ileri` ve `typescript/ileri` bölümleri **boş**. |
| PostgreSQL (10) | ✅ | `veritabanlari` (4 ders) |
| Docker (11) | 🟡 | Kütüphane projesinde ve sistem tasarımı projelerinde kullanılıyor. Dockerfile, katmanlar, multi-stage build ve compose anlatılmıyor. |
| İngilizce (12) | — | Zirve'nin kapsamı dışında. Bölüm 5'teki öneriye bakın. |
| Mikroservis / modüler monolit (13) | 🟡 | Saga ve outbox projesi var. "Ne zaman mikroservis, ne zaman modüler monolit", servis sınırı belirleme ve iletişim desenleri yok. |
| Clean Architecture, DDD, CQRS (14) | 🟡 | Kütüphane projesi Clean Architecture'ı uyguluyor. DDD'nin kavramları (bounded context, aggregate, value object, domain event), CQRS/MediatR ve Vertical Slice ayrı bir derste anlatılmıyor. |
| Kubernetes (15) | ❌ | Yalnızca adı geçiyor. |
| Mentorluk, code review, ADR (16) | 🟡 | `kutuphane-api/basvuru/02-review-sureci` var. Review'ın nasıl yapılacağı, senior beklentileri ve teknik liderlik anlatılmıyor. |
| Unit ve entegrasyon testi (17) | 🟡 | Kütüphane Faz 7'de uygulanıyor. Test piramidi, mock/stub/fake, test tasarımı, WebApplicationFactory ve Testcontainers için ayrı ders ve test yok. |
| MongoDB / NoSQL (18) | 🟡 | `sistem-tasarimi/yapi-taslari/02`'de veritabanı seçimi var. MongoDB ile veri modelleme yok. |
| Git (19) | ❌ | |
| Yapay zekâ destekli geliştirme, LLM entegrasyonu (20) | ❌ | |
| Olay güdümlü mimari (21) | 🟡 | Sistem tasarımında var. |
| SOLID, tasarım desenleri (22) | ✅ | `cs-temelleri/tasarim` |
| Gözlemlenebilirlik (23) | 🟡 | `sistem-tasarimi/yapi-taslari/04` kavram düzeyinde. .NET'te ILogger, Serilog, OpenTelemetry ve health check uygulaması yok. |
| Elasticsearch (24) | 🟡 | `sistem-tasarimi/yapi-taslari/05` (ters indeks kavramı). |
| Güvenlik: OAuth2/OIDC, OWASP (25) | 🟡 | Kütüphane Faz 5'te JWT var. OAuth2/OIDC akışları, PKCE, policy tabanlı yetkilendirme ve OWASP Top 10 yok. |
| Angular (26) | ❌ | |
| Agile / Scrum (27) | ❌ | |
| On-call, olay yönetimi (28) | 🟡 | Sistem tasarımında kısaca geçiyor. |
| Eşzamanlılık ve performans (29) | 🟡 | `cs-temelleri/sistemler/01` genel kavram. Planlanan `csharp/ileri` bölümü **boş**. lock, SemaphoreSlim, Channel, Span\<T\>, ArrayPool ve BenchmarkDotNet yok. |
| Linux (30) | ❌ | |
| Legacy modernizasyonu (31) | ❌ | Strangler fig deseni yok. |
| Arka plan işleri (32) | 🟡 | BackgroundService projelerde kullanılıyor, ders yok. |
| gRPC, SignalR (33) | 🟡 / ❌ | gRPC kavram olarak var, SignalR yok. |
| Frontend testi (34) | ❌ | |
| Redux / durum yönetimi (35) | ❌ | |
| Modern C#, .NET Aspire (36) | ❌ | |
| Algoritmalar (37) | ✅ | 7 ders ve 171 problem |
| Dağıtık sistem temelleri (38) | ✅ | Sistem tasarımı (27 ders) |

**Özet:** Algoritma, sistem tasarımı, SOLID ve veritabanı temelleri güçlü. İlanların en çok istediği "günlük .NET backend mühendisliği" katmanı ise zayıf: EF Core, mesajlaşma, test, Docker/Kubernetes, CI/CD, bulut, güvenlik, gözlemlenebilirlik ve DDD. `.NET ve ASP.NET Core` yolunda yalnızca 1 ders var, oysa ilanların omurgası bu. 2026'nın yeni beklentisi olan yapay zekâ destekli geliştirme ve LLM entegrasyonu ise hiç işlenmiyor.

---

## 4. Önerilen içerik planı

Her ders mevcut derslerin formatında ve derinliğinde olacak: Türkçe, mülakat odaklı, kod örnekli, gerektiğinde mermaid diyagramlı, sonunda "mülakatta sorulursa" bölümü. Her yeni bölümün bir de testi olacak. Öncelik, ilanlardaki sıklığa göre belirlendi.

### Faz A: En sık istenen, en büyük boşluklar (öncelik 1)

**`dotnet` yolu genişletmesi.** Planlanan boş bölümler dolacak, bir bölüm eklenecek.

| Bölüm | Yeni ders |
| --- | --- |
| `aspnet-core` | 02 Web API Tasarımı: Minimal API ve Controller, model doğrulama, ProblemDetails, versiyonlama, sayfalama, rate limiting |
| `aspnet-core` | 03 Kimlik Doğrulama, Yetkilendirme ve Güvenlik: JWT, OAuth2/OIDC akışları, PKCE, policy tabanlı yetkilendirme, OWASP Top 10, secret yönetimi |
| `aspnet-core` | 04 Arka Plan İşleri, gRPC ve SignalR: IHostedService, Hangfire/Quartz, gRPC servisleri, SignalR ile gerçek zamanlılık |
| `veri-ve-uretim` | 01 EF Core Derinlemesine: change tracking, N+1, AsNoTracking, migration'lar, eşzamanlılık belirteçleri, compiled ve split query, EF Core mu Dapper mı |
| `veri-ve-uretim` | 02 .NET'te Önbellekleme ve Redis: IMemoryCache, IDistributedCache, HybridCache, cache-aside, invalidation, cache stampede |
| `veri-ve-uretim` | 03 .NET'te Test: test piramidi, xUnit, mock/stub/fake, NSubstitute, FluentAssertions, WebApplicationFactory, Testcontainers, TDD |
| `veri-ve-uretim` | 04 Gözlemlenebilirlik ve Dayanıklılık: ILogger ve Serilog ile yapılandırılmış log, OpenTelemetry, health check'ler, korelasyon kimliği, Polly / Microsoft.Extensions.Resilience, HttpClientFactory |
| **yeni** `mimari` | 01 Clean Architecture, Vertical Slice ve CQRS (MediatR) |
| **yeni** `mimari` | 02 Domain-Driven Design: bounded context, aggregate, value object, domain event |
| **yeni** `mimari` | 03 Modüler Monolit ve Mikroservisler: servis sınırları, iletişim desenleri, strangler fig ile legacy modernizasyonu |
| **yeni** `mimari` | 04 .NET'te Mesajlaşma: RabbitMQ (exchange, ack, retry, DLQ), Kafka (partition, consumer group, offset), Azure Service Bus, MassTransit, idempotent tüketici |

Testler: `dotnet/02-web-api-ve-guvenlik`, `dotnet/03-veri-test-ve-uretim`, `dotnet/04-mimari-ve-mesajlasma`.

**Yeni yol: `devops-bulut` (DevOps ve Bulut)**

| Bölüm | Yeni ders |
| --- | --- |
| `konteynerler` | 01 Docker: imaj, katman, Dockerfile, multi-stage build, compose, .NET imajlarını küçültmek |
| `konteynerler` | 02 Kubernetes Temelleri: pod, deployment, service, ingress, probe'lar, ConfigMap ve Secret, HPA, Helm |
| `teslimat` | 01 CI/CD: GitHub Actions ve Azure DevOps hatları, kalite kapıları, SonarQube, blue-green, canary, feature flag |
| `teslimat` | 02 .NET Geliştiricisi için Bulut: Azure servisleri (App Service, Functions, Service Bus, Key Vault, App Insights, AKS, Cosmos DB) ve AWS karşılıkları |
| `teslimat` | 03 Backend Geliştiricisi için Linux: süreçler, dosya izinleri, ağ araçları, loglar, systemd |

Test: `devops-bulut/01-devops-ve-bulut`.

**Yapay zekâ (yeni bölüm, `dotnet` yolunda `yapay-zeka`)**

- 01 .NET'te LLM Entegrasyonu: Microsoft.Extensions.AI, Semantic Kernel, function calling, RAG, embedding, pgvector, MCP
- 02 Yapay Zekâ Destekli Geliştirme: kodlama ajanlarıyla güvenli ve kaliteli çalışmak, context yönetimi, AI çıktısını review etmek

### Faz B: Orta sıklık, planlanmış ama boş bölümler (öncelik 2)

| Yol / bölüm | Yeni ders |
| --- | --- |
| `csharp/ileri` | 01 Eşzamanlılık: lock, Interlocked, SemaphoreSlim, Channel, concurrent koleksiyonlar, CancellationToken |
| `csharp/ileri` | 02 Performans ve Bellek: Span\<T\>, Memory\<T\>, ArrayPool, allocation azaltma, GC modları, BenchmarkDotNet |
| `csharp/ileri` | 03 Modern C#: record, pattern matching, nullable reference types, primary constructor, collection expression |
| `react/ileri` | 01 Durum Yönetimi ve Veri Çekme: Context, Redux Toolkit, Zustand, TanStack Query |
| `react/ileri` | 02 React'te Test ve Performans: Vitest/Jest, React Testing Library, Playwright, memo ve profiler |
| `typescript/ileri` | 01 İleri Tipler: koşullu, eşlenmiş ve şablon literal tipler, yardımcı tipler |
| `veritabanlari/sql` | 03 SQL Server ve T-SQL: PostgreSQL ile farklar, stored procedure, view, execution plan |
| `veritabanlari/kavramlar` | 03 NoSQL ve Arama: MongoDB ile veri modelleme, Elasticsearch'te mapping, analyzer ve sorgu |

Testler: `csharp/02-ileri-csharp`, `react/02-react-ileri`, `typescript/02-ileri-tipler`, `veritabanlari/02-sql-server-ve-nosql`.

### Faz C: Mühendislik pratikleri ve kariyer (öncelik 3)

**Yeni yol: `muhendislik-pratikleri` (Mühendislik Pratikleri)**

| Bölüm | Yeni ders |
| --- | --- |
| `ekip` | 01 Git Derinlemesine: branch stratejileri, merge ve rebase, conflict çözme, cherry-pick, bisect, PR akışı, conventional commits |
| `ekip` | 02 Agile ve Scrum: sprint, tahminleme, Jira, definition of done |
| `ekip` | 03 Code Review, ADR ve Teknik Liderlik: iyi review'ın anatomisi, ADR yazmak, mentorluk, senior/lead beklentileri |
| `canli-sistem` | 01 Olay Yönetimi ve On-Call: alarmlar, runbook, kök neden analizi, suçlamasız postmortem |

**Angular (isteğe bağlı):** Yeni `angular` yolu ve tek ders: "React bilen biri için Angular". Bileşenler, DI, RxJS, signals. Türkiye ilanlarının bir kısmında zorunlu.

**Mülakat yolu:** `mulakat/surec/04` ".NET Backend Mülakatlarında Sık Sorulan Sorular" ve buna bağlı kapsamlı bir test.

### Toplam

| Faz | Ders | Test | Yeni yol |
| --- | --- | --- | --- |
| A | 18 | 4 | 1 (`devops-bulut`) |
| B | 8 | 4 | 0 (planlanmış bölümler doluyor) |
| C | 5–6 | 2 | 1–2 (`muhendislik-pratikleri`, isteğe bağlı `angular`) |
| **Toplam** | **31–32** | **10** | **2–3** |

---

## 5. Zirve kapsamı dışında kalanlar

Bunlar ilanlarda geçiyor ama bir öğrenme platformu içeriğiyle karşılanamaz ya da hedef rol dışında kalıyor:

- **İngilizce yeterliliği:** İlanların ~%40'ı istiyor. Öneri: Davranışsal mülakat derslerinde İngilizce örnek cevaplar ve teknik terim sözlüğü (Faz C'ye eklenebilir).
- **Alan bilgisi:** ERP, lojistik, ödeme sistemleri, e-ticaret gibi deneyimler.
- **Python, SSRS/Power BI, Couchbase, F#:** Tek tek ilanlara özgü.
- **Sertifikalar:** Azure AZ-204 / AZ-305. İlgili bulut dersinde hangi sertifikanın neyi kapsadığına bir paragrafla değinilebilir.

---

## 6. Kaynaklar

Tam metni okunan ilanlar:

- [GlobalPBX: Senior .NET Full Stack Developer (techcareer.net)](https://www.techcareer.net/jobs/detail/senior-.net-full-stack-developer-4539678)
- [Trendyol: Software Engineer (Lever)](https://jobs.lever.co/trendyol/4bf7e1b0-1e26-4a2f-9208-f156b8437e8c)
- [İhlas Holding: Senior .NET Core Developer (techcareer.net)](https://www.techcareer.net/jobs/detail/senior-.net-core-developer-4229632)
- [Condolife: Back-End Developer (techcareer.net)](https://www.techcareer.net/jobs/detail/back-end-developer-4491449)
- [Mobilişim: Yazılım Geliştirme Uzmanı (techcareer.net)](https://www.techcareer.net/jobs/detail/yazlm-gelistirme-uzman-4456669)
- [Gizli firma: Yazılım Mühendisi (techcareer.net)](https://www.techcareer.net/jobs/detail/yazlm-muhendisi-4491112)
- [Logvance: .NET Geliştirici (techcareer.net)](https://www.techcareer.net/en/jobs/detail/.net-gelistirici-4393831)
- [Sürat Kargo: Backend Developer Specialist (techcareer.net)](https://www.techcareer.net/en/jobs/detail/backend-developer-specialist-4378079)
- [Infoset: Full Stack Engineer .NET Core / React (Webrazzi)](https://webrazzi.com/kariyer/infoset/full-stack-engineer-net-core-react/)
- [Celebratix: Senior Backend Engineer .NET](https://jobs.solana.com/companies/celebratix-2/jobs/51774692-senior-backend-engineer-net)
- [Boardwise: Senior Full Stack Engineer ASP.NET Core / React (join.com)](https://join.com/companies/gertrud/16959430-senior-full-stack-engineer-f-asp-net-core-reactjs-remote-europe-f-m-d)
- [Codemotion: Senior .NET Engineer (djinni)](https://djinni.co/jobs/850984-senior-net-engineer/)
- [Kozak Agency: Full Stack .NET Developer (djinni)](https://djinni.co/jobs/817041-full-stack-net-developer)
- [Microsoft: Senior SWE, Distributed Systems](https://jobs.anitab.org/companies/microsoft-2/jobs/88222688-senior-software-engineer-distributed-systems)
- [Microsoft: Senior SWE, Full-Stack](https://jobs.anitab.org/companies/microsoft-2/jobs/96272029-senior-software-engineer-full-stack)
- [Microsoft: Software Engineer II](https://jobs.anitab.org/companies/microsoft-2/jobs/68868107-software-engineer-ii)
- [Microsoft: SWE II / Senior SWE, Backend (Azure Monitor)](https://jobs.anitab.org/companies/microsoft-2/jobs/88371190-software-engineer-ii-and-or-senior-software-engineer)
- [Microsoft: Senior SWE, Backend Platform & Commerce](https://jobs.anitab.org/companies/microsoft/jobs/60499399-senior-software-engineer-backend-platform-commerce-services)
- [Senior .NET Developer rol tanımı (jobdescription.org)](https://jobdescription.org/jobs/software-engineering/senior-dotnet-developer)

Aramalarda öne çıkan ilan ve istatistik sayfaları:

- [arabam.com: Backend Developer .NET Core (kariyer.net)](https://www.kariyer.net/is-ilani/arabam-com-backend-developer-net-core-4596627)
- [Enterprise Rent-a-Car: Senior Software Developer (kariyer.net)](https://www.kariyer.net/is-ilani/enterprise-rent-a-car-senior-software-developer-4465356)
- [QLTEQ: Full Stack .NET Engineer, Microservices (kariyer.net)](https://www.kariyer.net/is-ilani/qlteq-teknoloji-yazilim-danismanlik-anonim-sirketi-full-stack-net-engineer-net-microservices-net-4583458)
- [2sworks: Full Stack Developer (kariyer.net)](https://www.kariyer.net/is-ilani/2sworks-bilisim-yazilim-ticaret-sanayi-anonim-sirk-full-stack-developer-4517316)
- [Marti: Senior .NET Core Developer, Microservices](https://jobs.alleycorp.com/companies/marti/jobs/56682022-senior-net-core-developer-microservices)
- [RoofStacks: Senior Backend Developer (Lever)](https://jobs.lever.co/roofstacks/222bc43e-471c-42c7-9b92-948e75053304)
- [Appier: Senior Backend Developer, Turkey (Greenhouse)](https://job-boards.greenhouse.io/appier/jobs/7002456)
- [Riverty: Senior Backend Engineer C#/.NET (WeAreDevelopers)](https://www.wearedevelopers.com/en/companies/3275/riverty-group-gmbh/40658/senior-backend-engineer-c-sharp-net)
- [Backend Staff Engineer: DDD, Event Sourcing, CQRS (WeAreDevelopers)](https://www.wearedevelopers.com/jobs/ext/6349350/backend-staff-engineer)
- [Lemon.io: Senior .NET Full Stack Developer (We Work Remotely)](https://weworkremotely.com/listings/lemon-io-senior-net-full-stack-developer-1)
- [ITJobsWatch: .NET Developer beceri istatistikleri (İngiltere)](https://www.itjobswatch.co.uk/jobs/uk/.net%20developer.do)
- [Microsoft Learn: ASP.NET Core için topluluk kimlik doğrulama seçenekleri](https://learn.microsoft.com/ro-ro/aspnet/core/security/authentication/community?view=aspnetcore-5.0)
