# Zirve — Proje Özeti ve Durum Raporu

Bu belge, projenin başından bu yana yapılan her şeyi tek yerde toplar: ne inşa edildi, hangi mimari kararlar neden alındı, hangi dosya ne iş yapıyor, neler doğrulandı, neler eksik ve sırada ne var. Kullanım kılavuzu için `README.md` dosyasına bakın; bu belge durum ve gerekçe kaydıdır.

- **Konum:** `C:\Users\HP\Desktop\github\zirve`
- **Son güncelleme:** 15 Kasım 2026
- **Durum:** Platform uçtan uca çalışıyor ve testleri geçiyor. İçerik sınırlı. Docker dağıtımı yazıldı ama hiç çalıştırılmadı. Proje Git ile sürümleniyor (`main` dalı).

---

## 1. İstenen şey

C#, .NET, React, JavaScript, TypeScript, algoritmalar ve sistem tasarımı konularında; Alphabet, Meta, Amazon, IBM, Oracle, Tesla, Microsoft ve Apple gibi şirketlerde yazılım mühendisi olmak için gereken bilgileri, testleri, quizleri ve bir pratik ortamını içeren bir site. Frontend React, backend .NET, veritabanı PostgreSQL; daha iyi bir öneri varsa o uygulanacaktı.

Önerilen yığın korundu. Tek ekleme, kullanıcı kodunu çalıştıran ayrı bir **Runner** servisidir.

## 2. Şu anki durum (özet)

| Alan | Durum |
| --- | --- |
| Backend API (ASP.NET Core 10) | Tamam, testli |
| Runner (kod çalıştırma servisi) | Tamam, testli |
| Frontend (React 19) | Tamam; lint, tip denetimi, testler ve derleme temiz |
| Yerel geliştirme (`npm run dev`) | Çalışıyor (Docker gerektirmez) |
| İçerik | 32 ders, 9 quiz (90 soru), 23 problem; 11 yolun hepsi yayında |
| Docker / nginx / CI dosyaları | Yazıldı, **hiç çalıştırılmadı** |
| Sürüm kontrolü | Git deposu var (`main`); GitHub'a gönderimi bekliyor |

### İçerik dökümü

| Yol | Ders | Quiz |
| --- | --- | --- |
| Mülakat Hazırlığı | 4 | — |
| Algoritmalar ve Veri Yapıları | 7 | 1 (12 soru) |
| Sistem Tasarımı | 4 | 1 (10 soru) |
| C# | 3 | 1 (10 soru) |
| .NET ve ASP.NET Core | 1 | 1 (8 soru) |
| JavaScript | 2 | 1 (10 soru) |
| TypeScript | 1 | 1 (8 soru) |
| React | 1 | 1 (8 soru) |
| Şirket Rehberleri | 1 | — |
| Veritabanları | 4 | 1 (12 soru) |
| Bilgisayar Bilimi Temelleri | 4 | 1 (12 soru) |

Veritabanları dersleri: SQL sorguları ve join'ler; indeksler ve sorgu planları; transaction'lar ve izolasyon seviyeleri; veri modelleme ve normalizasyon. Bilgisayar Bilimi Temelleri dersleri: süreçler, thread'ler ve bellek; ağ temelleri (TCP, TLS, HTTP); SOLID ilkeleri; tasarım desenleri.

Problemler (23): 11 kolay, 12 orta; zor problem yok. Kapsanan kalıplar: dizi/hash tablosu, iki işaretçi, kayan pencere, yığın, ikili arama, bağlı liste, ağaç (DFS/BFS/BST), graf, dinamik programlama, geri izleme, aralıklar, sınıf tasarımı (Min Yığın, LRU Önbellek).

## 3. Makinede yapılan değişiklikler

Proje klasörü dışında yapılan kalıcı değişiklikler:

- **.NET SDK 10.0.404** `winget` ile sistem geneline kuruldu (önceden yalnızca runtime'lar vardı).
- **Git 2.56** ve **GitHub CLI (`gh`) 2.104** `winget` ile kuruldu (15 Kasım 2026). `gh`, GitHub hesabına (`physerkm`) giriş yapılmış durumda; belirteç Windows kimlik bilgisi deposunda tutuluyor. Deponun yazar adı ve e-postası yalnızca bu deponun ayarlarında tanımlı: `physerkm`, GitHub'ın gizli (`noreply`) adresi.

Proje klasörü içinde kurulanlar (hepsi klasör silinince gider):

- `node_modules/` (kök): `embedded-postgres` (PostgreSQL 18.6 ikilileri) ve `pg`.
- `src/Zirve.Runner/Node/node_modules/`: `amaro` 1.3.0 (TypeScript dönüştürücü).
- `web/node_modules/`: frontend bağımlılıkları.
- `dotnet-ef` 10.0.15, yerel araç olarak (`dotnet-tools.json`).
- `.pgdata/`: geliştirme veritabanının verisi (git'e eklenmez).

Kurulmayanlar: Docker, sistem geneli PostgreSQL. Doğrulama sırasında kullanılan `playwright-core` yalnızca geçici klasöre kuruldu, projeye girmedi.

## 4. Mimari

```text
Tarayıcı (React SPA)
   │  aynı köken
   ▼
web  (geliştirmede Vite vekili :5173, üretimde nginx :8080)
   │  /api
   ▼
Zirve.Api  (ASP.NET Core 10, :5080)  ──►  PostgreSQL (:5433 geliştirme)
   │  HTTP, iç ağ, paylaşılan anahtar
   ▼
Zirve.Runner  (:5081)
   ├─► dotnet alt süreci  (Roslyn ile derlenmiş C#)
   └─► node alt süreci    (JavaScript / TypeScript)
```

### Mimari kararlar ve gerekçeleri

**1. Kod olarak içerik.** Dersler, quizler ve problemler `content/` altında Markdown/YAML dosyalarıdır; API açılışta okur, doğrular ve PostgreSQL'e eşitler (slug üzerinden upsert, içerik özeti değişmediyse atlanır). Gerekçe: içerik sürümlenebilir, gözden geçirilebilir ve testle doğrulanabilir olur. Hatalı içerik API'nin açılmasını engeller ve bütün hatalar birlikte listelenir.

**2. Problem imzası tek kaynaktır.** Her problem dilden bağımsız bir imza tanımlar (`function`, `params`, `returns`, küçük bir tip dili: `int`, `long`, `double`, `bool`, `string`, `char`, `T[]`, `List<T>`, `ListNode`, `TreeNode`). Üç dilin başlangıç kodu bu imzadan üretilir; elle yazılmaz. İki tür vardır: `function` ve `class` (işlem dizisiyle sınanan tasarım problemleri).

**3. Her referans çözüm test edilir.** Test paketi, her problemin C# ve TypeScript referans çözümünü gerçek koşucuda problemin bütün testlerinden geçirir. Hatalı test verisi ya da bozuk çözüm fark edilmeden kalamaz.

**4. Kod çalıştırma ayrı bir serviste.** Kullanıcı kodu API sürecinde çalışmaz. Runner her çalıştırma için ayrı bir alt süreç açar; süre, bellek ve çıktı sınırı uygular; sınır aşılınca süreç ağacını öldürür. Karşılaştırma yalnızca Runner'da yapılır ki üç dil aynı kurallarla değerlendirilsin (`exact`, `unordered`, `unordered-nested`; ondalıklı sayılarda 1e-6 tolerans).

**5. Çözümler sunucuda değerlendirilir.** JavaScript tarayıcıda da çalıştırılabilirdi; tek ve tutarlı bir yol, gizli testler ve güvenilir ilerleme kaydı için üç dil de sunucuda çalışır.

**6. Savunma katmanları (kod çalıştırma).**
- C#: yalnızca izin verilen derlemelere başvuru; dosya, ağ, yansıma, süreç ve interop API'leri derleme aşamasında reddedilir (`ApiRestrictionAnalyzer`).
- JavaScript/TypeScript: ana bağlamdan hiçbir nesne paylaşmayan ayrı V8 bağlamı (iki taraf arasında yalnızca dizgi taşınır), `eval`/`new Function` kapalı, Node izin modeli (`--permission`).
- Alt süreçlere Runner'ın ortam değişkenleri aktarılmaz.
- Bunlar derinlemesine savunmadır; **asıl güvenlik sınırı** Docker kurulumundaki kapsayıcıdır (internetsiz iç ağ, salt-okunur dosya sistemi, yetkisiz kullanıcı, kaynak sınırları). Yerel geliştirmede bu sınır yoktur.

**7. Çerez tabanlı oturum.** ASP.NET Core Identity, `HttpOnly` + `SameSite=Strict` çerez. Tarayıcıda JavaScript'in okuyabildiği bir erişim belirteci yoktur. Ek olarak her durum değiştiren istekte CSRF belirteci doğrulanır; belirteç yalnızca bellekte tutulur, giriş/çıkış yanıtlarıyla yenilenir ve reddedilirse istemci bir kez yenileyip tekrar dener.

**8. Tek köken.** SPA ve API aynı adresten sunulur; CORS gerekmez ve çerez `SameSite=Strict` kalabilir.

**9. Dikey dilimler.** API `Features/` altında özellik bazında düzenlidir (uç noktalar ve DTO'lar aynı dosyada). Dört katmanlı "temiz mimari" bu boyut için gereksiz bulundu.

**10. Arama PostgreSQL'de.** Dersler ve problemler için üretilmiş `tsvector` sütunları, `turkish` yapılandırması (kök bulma) ve GIN indeksi; başlıkta kısmi eşleşme için ek `ILIKE`. Ayrı bir arama motoru yok.

**11. Yayımlanmayan içerik gizlenir.** `tracks.yaml` planlanan müfredatı listeleyebilir; dersi olmayan bölümler ve yollar yüklenmez.

**12. Geliştirme veritabanı Docker'sız.** PostgreSQL ikilileri npm paketinden gelir ve `pg_ctl` ile yönetilir. Üretimde kullanılmaz.

**13. Ödünleşimler.**
- Migration'lar açılışta uygulanabiliyor (`Database__ApplyMigrationsOnStartup`); tek örnekli kurulum için pratik, çok örnekli kurulumda kapatılmalı.
- C# testlerinde süre sınırı süreç düzeyindedir (tek tek test değil); zaman aşımında ilk tamamlanmamış test sorumlu tutulur. JavaScript'te test başına sınır vardır.
- Kod çalıştırma oturum açmış kullanıcılara özeldir; dersler, quizler ve problem tanımları herkese açıktır.

### Sürümler

| Bileşen | Sürüm |
| --- | --- |
| .NET SDK / hedef çatı | 10.0.404 / `net10.0` |
| EF Core, Identity, OpenAPI | 10.0.15 |
| Npgsql EF Core sağlayıcısı | 10.0.3 |
| Roslyn (`Microsoft.CodeAnalysis.CSharp`) | 5.12.0 |
| xUnit | v3 4.0.3 (Microsoft.Testing.Platform) |
| PostgreSQL | 18.6 (geliştirme), `postgres:18` (Docker) |
| Node.js | 26 (yerel), 24 (Docker/CI) |
| React / React Router / TanStack Query | 19.3 / 8.5 / 5.107 |
| Vite / Vitest / Tailwind CSS | 8.3 / 5.1 / 4.3 |
| TypeScript | 6.0.3 (7.x değil: typescript-eslint henüz desteklemiyor) |
| Monaco / Mermaid | 0.57 / 12.3 |

## 5. Dosya haritası

### Kök

| Dosya | İş |
| --- | --- |
| `Zirve.slnx` | Çözüm dosyası |
| `global.json` | SDK sürümü; `dotnet test` için Microsoft.Testing.Platform seçimi |
| `Directory.Build.props` | Ortak derleme ayarları (nullable, uyarılar hata) |
| `Directory.Packages.props` | Merkezî paket sürümleri |
| `dotnet-tools.json` | `dotnet-ef` yerel aracı |
| `package.json`, `package-lock.json` | Kök betikler (`setup`, `dev`, `db`, `test`) ve geliştirme veritabanı paketleri |
| `scripts/dev.mjs` | Veritabanı + Runner + API + web'i birlikte başlatır; Ctrl+C hepsini durdurur |
| `scripts/dev-db.mjs` | Gömülü PostgreSQL'i `pg_ctl` ile başlatır/durdurur, veritabanını oluşturur |
| `docker-compose.yml`, `.env.example`, `.dockerignore` | Kapsayıcı kurulumu (denenmedi) |
| `deploy/nginx.conf` | SPA sunumu, `/api` vekili, güvenlik başlıkları, CSP (denenmedi) |
| `.github/workflows/ci.yml` | Backend ve frontend CI işleri (hiç koşmadı) |
| `README.md` | Kurulum, kullanım, içerik biçimleri, güvenlik, yapılandırma |
| `.gitignore`, `.gitattributes`, `.editorconfig` | Depo düzeni |

### `src/Zirve.Shared` — ortak sözleşmeler

| Dosya | İş |
| --- | --- |
| `ZirveJson.cs` | Ortak JSON ayarları (camelCase, enum'lar dizgi, null'lar yazılmaz) |
| `Problems/ProblemSpec.cs` | Problem imzası, dil ve karşılaştırma kipi sabitleri |
| `Problems/TypeRef.cs` | Tip dili ayrıştırıcısı; C#, TypeScript, JSDoc karşılıkları |
| `Problems/StarterCodeGenerator.cs` | İmzadan üç dil için başlangıç kodu |
| `Execution/ExecutionContracts.cs` | API ↔ Runner istek/yanıt modelleri |

### `src/Zirve.Runner` — kod çalıştırma servisi

| Dosya | İş |
| --- | --- |
| `Program.cs` | `POST /execute`, `GET /health`, paylaşılan anahtar denetimi |
| `RunnerOptions.cs`, `appsettings.json` | Süre, bellek, çıktı, eşzamanlılık sınırları |
| `WarmupService.cs` | Açılışta derleyiciyi ısıtır |
| `Execution/ExecutionService.cs` | Doğrulama, eşzamanlılık sınırı, yürütücü seçimi, sonuçların karşılaştırılması |
| `Execution/ProcessRunner.cs` | Alt süreç çalıştırma: süre/çıktı sınırı, süreç ağacını öldürme |
| `Execution/ResultComparer.cs` | Dilden bağımsız sonuç karşılaştırma |
| `Execution/RawExecution.cs` | Ham sonuç modelleri, koşucu çıktısının ayrıştırılması |
| `Execution/WorkDirectory.cs` | Tek kullanımlık geçici klasörler |
| `Execution/ExecutableLocator.cs` | `dotnet` ve `node` yollarının bulunması |
| `Execution/CrashDialogs.cs` | Windows hata bildirimini kapatır (çöken süreçlerde saniyelerce gecikmeyi önler) |
| `CSharp/CSharpCompiler.cs` | Roslyn ile bellekte derleme, izinli derleme listesi |
| `CSharp/ApiRestrictionAnalyzer.cs` | Yasaklı API denetimi |
| `CSharp/CSharpExecutor.cs` | Derle, `dotnet exec` ile çalıştır, sonucu topla |
| `CSharp/Harness/TestHarness.cs` | Kullanıcı koduyla birlikte derlenen test koşucusu (`ListNode`, `TreeNode`, yansıma ile çağrı) |
| `Node/NodeExecutor.cs` | Node sürecini izin modeliyle başlatır |
| `Node/harness.mjs` | JS/TS koşucusu: tip silme (amaro), yalıtılmış bağlam, test ve script kipleri |
| `Node/package.json`, `package-lock.json` | `amaro` bağımlılığı |
| `Dockerfile` | Runner görüntüsü (.NET runtime + Node) |

### `src/Zirve.Api` — API

| Dosya | İş |
| --- | --- |
| `Program.cs` | Bileşim kökü, middleware sırası, uç nokta eşlemesi, açılışta veritabanı hazırlığı |
| `appsettings.json`, `appsettings.Development.json` | Ayarlar; geliştirme bağlantı dizesi yalnızca Development dosyasında |
| `Data/AppDbContext.cs` | EF Core modeli, indeksler, tam metin arama sütunları |
| `Data/Entities/*.cs` | `Track`, `Module`, `Lesson`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, `Problem`, `Submission`, `LessonProgress`, `AppUser`, `ContentState` |
| `Data/Migrations/*` | `InitialCreate` migration'ı |
| `Content/ContentLoader.cs` | `content/` klasörünü okur ve doğrular |
| `Content/ContentSynchronizer.cs` | İçeriği veritabanına eşitler |
| `Content/ContentModels.cs` | Ayrıştırılmış içerik modelleri, `ContentException` |
| `Features/Auth/` | Kayıt, giriş, çıkış, oturum; Identity ve çerez ayarları; Türkçe hata iletileri |
| `Features/Catalog/` | Yollar, bölümler, dersler, ders ilerlemesi |
| `Features/Quizzes/` | Quiz listesi, sorular (yanıtsız), sunucuda değerlendirme |
| `Features/Problems/` | Problem listesi/detayı, çözüm anlatımı, çalıştır/gönder, gönderimler; `ProblemJudge` hükmü verir |
| `Features/Playground/` | Serbest kod çalıştırma |
| `Features/Dashboard/` | İlerleme özeti, çalışma serisi, etkinlik haritası |
| `Features/Search/` | Ders, problem ve quiz araması |
| `Infrastructure/CodeRunner.cs` | Runner istemcisi (`ICodeRunner`) |
| `Infrastructure/Security.cs` | Güvenlik başlıkları, CSRF middleware'i |
| `Infrastructure/RateLimiting.cs` | Genel, giriş ve kod çalıştırma hız sınırları |
| `Infrastructure/GlobalExceptionHandler.cs` | Hataları `ProblemDetails`'e çevirir |
| `Infrastructure/DatabaseInitializer.cs` | Migration + içerik eşitleme, bağlantı için yeniden deneme |
| `Dockerfile` | API görüntüsü |

**Uç noktalar (`/api`):** `auth/session|register|login|logout`, `tracks`, `tracks/{yol}`, `tracks/{yol}/lessons/{ders}` (+ `/progress`), `quizzes`, `quizzes/{slug}` (+ `/attempts`), `problems`, `problems/{slug}` (+ `/editorial`, `/run`, `/submit`, `/submissions`), `submissions/{id}`, `playground/run`, `me/dashboard`, `search`. Sağlık: `/health/live`, `/health/ready`.

### `tests/Zirve.Tests`

| Dosya | İş |
| --- | --- |
| `Runner/RunnerExecutionTests.cs`, `RunnerFixture.cs` | Gerçek derleyici ve alt süreçlerle Runner testleri |
| `Content/ContentValidationTests.cs` | İçeriğin yüklenmesi; her referans çözümün bütün testleri geçmesi |
| `Api/ApiTests.cs`, `ApiFactory.cs` | API'nin gerçek PostgreSQL'e karşı entegrasyon testleri (test sınıfı başına tek kullanımlık veritabanı) |
| `UnitTests.cs` | Karşılaştırıcı, tip dili, başlangıç kodu, quiz değerlendirme, seri hesabı |
| `xunit.runner.json` | Testler paralel koşmaz (süre sınırlı testler işlemci yarışından etkilenmesin) |

### `web` — frontend

| Dosya | İş |
| --- | --- |
| `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` | Derleme, tip denetimi, lint; `/api` geliştirme vekili |
| `index.html`, `public/theme-init.js`, `public/favicon.svg` | Kabuk; tema ilk boyamadan önce ayrı dosyadan uygulanır (katı CSP ile uyum için) |
| `src/main.tsx`, `src/App.tsx` | Giriş noktası, yönlendirme, tembel yüklenen sayfalar |
| `src/index.css` | Tasarım belirteçleri (açık/koyu), Markdown ve kod renklendirme stilleri |
| `src/lib/api.ts` | `fetch` sarmalayıcı, CSRF akışı, `ApiError` |
| `src/lib/queries.ts` | TanStack Query kancaları ve önbellek geçersiz kılma |
| `src/lib/types.ts` | API tipleri |
| `src/lib/format.ts`, `accents.ts`, `toc.ts`, `theme.ts`, `storage.ts`, `hooks.ts` | Etiketler ve biçimlendirme, yol renkleri, içindekiler, tema, yerel depolama, yardımcı kancalar |
| `src/components/Layout.tsx` | Üst menü, kullanıcı menüsü, alt bilgi |
| `src/components/Markdown.tsx` | Markdown, kod blokları (kopyala, "Dene"), Mermaid |
| `src/components/CodeEditor.tsx` | Monaco (paketten, CDN'siz), hata işaretleri, kısayollar |
| `src/components/JudgeResultPanel.tsx` | Hüküm, test listesi, girdi/beklenen/çıktı |
| `src/components/SearchBox.tsx`, `SplitPane.tsx`, `TrackCard.tsx`, `TrackIcon.tsx`, `MermaidDiagram.tsx`, `ui.tsx` | Arama, bölme, kartlar, ortak arayüz parçaları |
| `src/pages/*.tsx` | Ana sayfa, yollar, yol, ders, quizler, quiz, problemler, problem çalışma alanı, deneme alanı, panel, giriş/kayıt, 404 |
| `src/lib/api.test.ts`, `format.test.ts`, `src/test/setup.ts` | Frontend testleri |
| `Dockerfile` | Derleme + yetkisiz nginx görüntüsü |

### `content` — içerik

`tracks.yaml` (11 yol, 25 bölüm tanımlı; 21'inin dersi var), `lessons/` (32 ders), `quizzes/` (9 quiz), `problems/` (23 problem). Biçimler `README.md` içinde anlatılıyor.

## 6. Yol boyunca bulunan ve düzeltilen sorunlar

| Sorun | Çözüm |
| --- | --- |
| Sırasız karşılaştırma pozitif sayılarda yanlış sonuç veriyordu (sıralama anahtarı 15 basamak hassasiyet sınırına takılıyordu) | Metin anahtarı yerine gerçek bir sıralama karşılaştırıcısı; testlere yeni durumlar eklendi |
| Windows'ta stack overflow ~9 saniyede raporlanıyordu | Windows Hata Bildirimi alt süreçler için kapatıldı; ~2 saniyeye indi |
| Node 26'da yerleşik tip silici `transform` kipini desteklemiyor (enum, parametre özellikleri çalışmıyordu) | `amaro` paketi sabit sürümle eklendi; yoksa yerleşik siliciye düşülür |
| TypeScript sözdizimi hatalarında satır numarası gelmiyordu | Hata konumu amaro'nun alanlarından okunuyor |
| PostgreSQL yönetici yetkili kabukta çalışmayı reddediyor | Sunucu `pg_ctl` ile başlatılıyor |
| `pg_ctl` çağrısı sonsuza dek bekliyordu (miras kalan çıktı boruları) | `stdio: 'ignore'` ile başlatılıyor |
| Merkezî paket sabitleme, EF Core Design ile Roslyn sürümünü çakıştırdı | Geçişli sabitleme kapatıldı |
| xUnit v4, .NET 10 SDK'da eski test yolunu desteklemiyor | `global.json` ile Microsoft.Testing.Platform'a geçildi |
| Ders bölümden bölüme taşınınca basamaklı silmeye yakalanabilirdi | Eşitleme sırası değiştirildi: önce dersler yeni bölüme bağlanır, sonra eski bölüm silinir |
| Monaco 0.57'de modül yolları ve `ScriptTarget` değerleri değişmiş | Yeni yollar ve `ESNext` kullanıldı |
| İlerleme çubuğunda özel renk yerine varsayılan renk görünüyordu | Varsayılan renk yalnızca özel renk verilmediğinde uygulanıyor |
| Kod yazı tipinde bitişik harfler (`<=` → `≤`) ve üst simgeler kötü görünüyordu | Kodda bitişik harfler kapatıldı; kısıtlarda `10^4` biçimi kullanıldı |
| Geçici klasörde çalıştırılan `npm init`, kök `package.json`'a gereksiz alanlar ekledi | Dosya eski haline getirildi |

## 7. Doğrulama durumu

| Denetim | Sonuç |
| --- | --- |
| Backend testleri (`dotnet test`) | 147 / 147 geçti |
| Frontend lint ve tip denetimi | Temiz |
| Frontend testleri (Vitest) | 17 / 17 geçti |
| Frontend üretim derlemesi | Başarılı |
| Tarayıcı turu (başsız Edge) | 9 yol, 24 ders, 7 quiz, 23 problem sayfası açıldı; kayıt, quiz, kod çalıştır/gönder (C# ve TypeScript), sınıf problemi, deneme alanı, ders tamamlama → panel, arama, açık tema, mobil görünüm çalıştı; konsol hatası yok |
| Yeni içerik (8 ders, 2 quiz) | İçerik doğrulama testleri geçti; derslerdeki 12 Mermaid diyagramının hepsi Mermaid 12.3 ayrıştırıcısından geçti; çalışan sitede yollar, dersler, quizler ve arama (`izolasyon`, `deadlock`, `TLS` vb.) API üzerinden doğrulandı |

**Doğrulanmayanlar:**

- Docker görüntüleri, `docker-compose.yml`, nginx yapılandırması ve içindeki Content-Security-Policy hiç çalıştırılmadı. CSP'nin Monaco ve Mermaid ile uyumu denenmedi.
- CI iş akışı hiç koşmadı (depo GitHub'da değil). Linux'ta Runner testleri denenmedi.
- Tarayıcı turu betiği geçici klasördeydi; depoda uçtan uca (e2e) test yok.
- Veritabanları ve Bilgisayar Bilimi Temelleri yollarının sayfaları tarayıcıda görsel olarak gezilmedi (diyagramlar yalnızca ayrıştırıcıyla denetlendi). Mermaid denetim betiği de geçici klasördeydi; depoda yok.
- Yük, eşzamanlılık ve güvenlik (sızma) testi yapılmadı.

## 8. Bilinen sınırlamalar

- **İçerik dar.** .NET, TypeScript ve React yollarında birer ders var. Zor problem yok.
- **Şirket rehberi genel eğilimleri anlatır;** süreçler ekibe ve yıla göre değişir ve bu derste de belirtilmiştir.
- **Yerel çalıştırmada kod yalıtımı zayıftır.** `npm run dev` ile kullanıcı kodu kapsayıcısız çalışır. İnternete açmadan önce Docker kurulumu kullanılmalı ve sınanmalıdır.
- **Hesap özellikleri temel düzeyde.** E-posta doğrulama, parola sıfırlama, profil düzenleme ve hesap silme yok.
- **JavaScript için ayrı referans çözüm yok;** çözüm anlatımları C# ve TypeScript gösterir. JavaScript yolu Runner testlerinde sınanıyor.
- **Dile özel problemler tanımlanamıyor;** tip dilinde serbest tip (`any`) olmadığı için "debounce yaz", "diziyi düzleştir" gibi JavaScript'e özgü problemler eklenemiyor.
- **Quiz yanıtları saklanmıyor;** yalnızca puan kaydediliyor.
- **Bir ders içerikten silinirse** o derse ait kullanıcı ilerlemesi de silinir.
- **Arayüz yalnızca Türkçe.**

## 9. Sıradaki adımlar

Öncelik sırasıyla:

### A. İçerik (en çok değer katan iş)

1. ~~**Boş yolları doldur:** Veritabanları ve Bilgisayar Bilimi Temelleri.~~ **Tamamlandı (15 Kasım 2026):** iki yola 4'er ders ve 12'şer soruluk birer quiz eklendi.
2. **Tek dersli yolları derinleştir** (sıradaki adım):
   - .NET: Web API tasarımı, EF Core (izleme, N+1, migration'lar), test, performans ve gözlemlenebilirlik.
   - React: performans (`memo`, `useMemo`, geçişler), durum yönetimi, veri çekme, React 19 yenilikleri.
   - TypeScript: koşullu ve eşlenmiş tipler, `infer`, şablon değişmez tipleri.
   - C#: bellek yönetimi ve GC, eşzamanlılık (kilitler, `Channel`, eşzamanlı koleksiyonlar), modern C# (desen eşleme, `Span<T>`).
   - JavaScript: tipler ve dönüşümler, prototipler, modüller, bellek sızıntıları.
3. **Sistem tasarımı örnekleri:** haber akışı, sohbet, hız sınırlayıcı, bildirim sistemi, dağıtık önbellek; ayrıca tutarlılık ve dağıtık işlemler dersi.
4. **Algoritma dersleri:** graflar (ayrı ders), heap, geri izleme, açgözlü yöntemler, aralıklar.
5. **Yeni problemler** (numaralar bilerek boş bırakıldı): 005 en sık k eleman, 006 kendisi hariç çarpım, 007 en uzun ardışık dizi, 010 en çok su tutan kap, 017 döndürülmüş dizide arama, 020 sondan n. düğümü sil, 022 ağacı ters çevir, 025 k. en büyük eleman, 027 ders programı (topolojik sıralama), 030 en uzun artan alt dizi, 031 ev soyguncusu, 033 permütasyonlar, 036 trie. Ardından birkaç **zor** problem.
6. **Yeni quizler:** Mülakat Hazırlığı yolu için ve çok dersli yollarda bölüm başına birer quiz.

Her içerik eklemesinden sonra `dotnet test --project tests/Zirve.Tests` çalıştırılmalı; referans çözümler ve içerik biçimi orada doğrulanır.

### B. Dağıtımı doğrula

1. Docker Desktop kur; `cp .env.example .env`, `docker compose up --build`.
2. Sitenin `http://localhost:8080` adresinde açıldığını, kayıt ve kod çalıştırmanın çalıştığını doğrula.
3. Tarayıcı konsolunda CSP ihlali olup olmadığına bak (özellikle problem sayfası ve diyagramlı dersler).
4. Runner'ın salt-okunur dosya sistemi ve yetkisiz kullanıcıyla C# ve TypeScript çalıştırabildiğini doğrula.
5. README'deki "sınanmadı" notunu sonuca göre güncelle.

### C. Sürüm kontrolü ve CI

1. ~~Git kur, `git init`, ilk commit.~~ **Tamamlandı (15 Kasım 2026).**
2. GitHub'a gönder ve CI'ın iki işinin de yeşil olduğunu doğrula (Linux'ta Runner testleri ilk kez orada koşacak).

### D. Ürün özellikleri

1. Parola sıfırlama ve e-posta doğrulama (bir e-posta sağlayıcısı gerekir).
2. Profil sayfası, hesap silme.
3. Tip diline `any` ekleyip JavaScript'e özgü problemleri açmak.
4. Süreli "prova mülakatı" kipi (rastgele problem + sayaç).
5. Yanlış yapılan quiz sorularını tekrar ettirme; ders ve problemlere yer imi.
6. İngilizce arayüz ve içerik (şu an yalnızca Türkçe).
7. SQL pratiği için ayrı bir sandbox.

### E. Teknik borç

1. Tarayıcı turunu depoya Playwright e2e testi olarak eklemek ve CI'a bağlamak.
2. Yapılandırılmış günlükleme ve izleme (OpenTelemetry).
3. İnternete açık kurulum için Runner'da daha güçlü yalıtım (gVisor benzeri bir çalışma zamanı).
4. Çok örnekli kurulum için migration'ları dağıtım adımına taşımak.
5. Hız sınırlama ve hesap kilitleme için entegrasyon testleri.

## 10. Kaldığın yerden devam etmek için

```bash
cd C:\Users\HP\Desktop\github\zirve
npm run setup        # yalnızca ilk kez ya da bağımlılıklar değiştiyse
npm run dev          # site: http://localhost:5173
```

Testler (veritabanı açık olmalı; `npm run dev` ya da `npm run db` ile):

```bash
dotnet test --project tests/Zirve.Tests/Zirve.Tests.csproj
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run test
npm --prefix web run build
```

Geliştirme portları: veritabanı 5433, Runner 5081, API 5080, web 5173. Geliştirme veritabanı kullanıcı adı ve parolası (`zirve` / `zirve_dev_password`) yalnızca yerel kullanım içindir.
