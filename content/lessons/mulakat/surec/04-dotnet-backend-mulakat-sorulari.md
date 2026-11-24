---
title: .NET Backend Mülakatlarında Sık Sorulan Sorular
summary: Türkiye'de ve yurt dışında .NET backend ve full-stack mülakatlarında en sık sorulan teknik sorular ve kısa model cevapları, ev ödevi (take-home) ve canlı kodlama turları için ipuçları, sorulara hazırlanırken Zirve'de hangi derse bakılacağı.
minutes: 30
level: intermediate
---

Büyük teknoloji şirketlerinin mülakatları algoritma ve sistem tasarımı ağırlıklıdır. Türkiye'deki ve Avrupa'daki .NET ilanlarının çoğunda ise süreç genellikle şöyledir: İK görüşmesi, **teknik soru-cevap** turu (dil, framework, veritabanı, mimari), bir **ev ödevi** ya da canlı kodlama, son olarak takım ve yönetici görüşmesi. Bu ders teknik soru-cevap turunda en sık gelen soruları ve kısa model cevaplarını toplar. Her bölümün sonunda konuyu derinlemesine anlatan Zirve dersi belirtilir.

Cevapları ezberlemeyin. Her birini **kendi cümlelerinizle ve kendi projenizden bir örnekle** anlatabilecek hale gelin. Görüşmeci ezber cevabı bir sonraki "neden?" sorusuyla hemen fark eder.

## C# ve çalışma zamanı

**Değer tipi ile referans tipi farkı?**
Değer tipi verinin kendisini taşır ve atamada kopyalanır (`int`, `struct`). Referans tipi heap'teki nesneye işaret eder ve atamada referans kopyalanır (`class`, `string`, diziler). → *C# › Değer ve Referans Tipleri*

**`string` neden değişmez (immutable), sonucu ne?**
Thread güvenliği, hash tablosunda anahtar olarak güvenilirlik ve interning için. Sonucu: döngüde `+=` her seferinde yeni dizgi oluşturur, `StringBuilder` kullanılır.

**`class`, `struct`, `record` farkı?**
Class referans tipidir, referans eşitliği vardır. Struct değer tipidir, kopyalanır, küçük ve değişmez olmalıdır. Record değer eşitliği ve `with` ile kopyalama sağlar. → *C# › Modern C#*

**`abstract class` ile `interface` farkı?**
Soyut sınıf durum (alan) ve kurucu taşıyabilir, tek kalıtım vardır. Arayüz bir sözleşmedir, bir sınıf birden fazlasını uygulayabilir. C# 8'den beri arayüzlerde varsayılan uygulama da olabilir. "Ne"yi tanımlamak için arayüz, ortak davranışı paylaşmak için soyut sınıf.

**`IEnumerable` ile `IQueryable` farkı?**
`IEnumerable` bellekte, LINQ to Objects ile çalışır. `IQueryable` bir ifade ağacı taşır ve sağlayıcı (EF Core) tarafından SQL'e çevrilir. `IEnumerable`'a erken geçmek filtrenin bellekte çalışmasına yol açar. → *.NET › EF Core Derinlemesine*

**Ertelenmiş yürütme (deferred execution) nedir?**
LINQ sorgusu tanımlandığında değil, üzerinde dönüldüğünde (`foreach`, `ToList`) çalışır. Aynı sorguyu iki kez dönmek iki kez çalıştırır. → *C# › Delegeler, Lambda ve LINQ*

**`IDisposable` ve `using` ne işe yarar? Finalizer ile farkı?**
Yönetilmeyen kaynakları (bağlantı, dosya tanıtıcısı) deterministik olarak bırakmak için. `using` blok sonunda `Dispose` çağırır. Finalizer GC'nin ne zaman çalışacağı belli olmayan son güvenlik ağıdır ve nesnenin ömrünü uzatır.

**GC nasıl çalışır?**
Nesilsel: Gen 0, 1, 2 ve büyük nesneler için LOH. Çoğu nesne genç ölür, genç nesil sık ve ucuz toplanır. Erişilemeyen nesneler toplanır. → *C# › Performans ve Bellek*

**`async/await` arka planda ne yapar? Yeni thread açar mı?**
Derleyici metodu bir durum makinesine çevirir. `await` noktasında thread serbest kalır, iş bitince devam eder. G/Ç işlemlerinde yeni thread açılmaz. → *C# › async ve await*

**`.Result` ya da `.Wait()` neden tehlikeli?**
Thread'i bloklar. ASP.NET Core'da yük altında thread havuzu açlığına, `SynchronizationContext` olan ortamlarda kilitlenmeye yol açar. → *C# › Eşzamanlılık*

**`Task` ile `ValueTask` farkı?**
`ValueTask`, sonuç çoğu zaman senkron hazırsa (önbellek isabeti) tahsisi önler. Yalnızca bir kez beklenebilir. Varsayılan tercih `Task`'tır.

**Thread güvenliğini nasıl sağlarsın?**
Paylaşılan durumu azaltırım. Gerekirse `Interlocked`, `lock`, async kodda `SemaphoreSlim`, eşzamanlı koleksiyonlar ya da `Channel`. → *C# › Eşzamanlılık*

**Boxing nedir?**
Değer tipinin `object` ya da arayüz olarak kullanılınca heap'e kopyalanması. Generic'ler bunu önler.

## ASP.NET Core

**Middleware nedir, sıra neden önemli?**
İstek sırayla, yanıt ters sırayla geçer. Kimlik doğrulama yetkilendirmeden, hata yakalama her şeyden önce gelir. → *.NET › İstek Hattı ve DI*

**Servis ömürleri? Tutsak bağımlılık nedir?**
Singleton (uygulama), scoped (istek), transient (her çözümleme). Uzun ömürlü servis kısa ömürlüyü tutmamalıdır. Singleton içinde scoped gerekirse `IServiceScopeFactory`.

**Filtre ile middleware farkı?**
Middleware her istekte ve uç noktadan bağımsız çalışır. Filtre belirli uç noktalara bağlanır ve model bağlama sonuçlarına erişir.

**Minimal API mi, controller mı?**
Ödünleşimleri sayarım: Minimal API az kod, AOT desteği ve hız sağlar. Controller'lar büyük ve eski kod tabanlarında tanıdıktır. → *.NET › Web API Tasarımı*

**`IHttpClientFactory` neden?**
`HttpClient`'ı her seferinde oluşturmak soket tükenmesine, tek bir statik örnek DNS değişikliklerini kaçırmaya yol açar. Fabrika işleyicileri havuzlar ve yeniler.

**Arka planda iş nasıl çalıştırılır?**
`BackgroundService`. Kalıcı işler için Hangfire ya da Quartz, kaybolmaması gereken mesajlar için kuyruk ve outbox. → *.NET › Arka Plan İşleri*

**Global hata yönetimi nasıl yapılır?**
`UseExceptionHandler` ve `IExceptionHandler` ile merkezî olarak, `ProblemDetails` biçiminde. İç ayrıntıları istemciye sızdırmadan loglarım.

**Yapılandırma ve gizli bilgiler?**
Options deseni ve `ValidateOnStart`. Gizli bilgiler depoda değil, user-secrets, ortam değişkenleri ya da Key Vault'ta.

## API tasarımı ve güvenlik

**PUT, PATCH, POST farkı? Idempotent hangisi?**
PUT bütünüyle değiştirir ve idempotenttir. PATCH kısmidir. POST oluşturur ve idempotent değildir. → *.NET › Web API Tasarımı*

**401 ile 403 farkı?**
Kimlik doğrulanmamış ile yetkisiz.

**Çift ödeme nasıl önlenir?**
Idempotency anahtarı. Sunucu anahtarı sonucuyla saklar.

**JWT nedir, nerede saklanmalı?**
İmzalı (şifreli değil) token. Servisler arası ve mobil için uygun. Tarayıcıda `localStorage` XSS'e açıktır, BFF ve `HttpOnly` çerez tercih edilir. → *.NET › Kimlik Doğrulama ve Güvenlik*

**OAuth ile OpenID Connect farkı?**
OAuth yetki devridir, access token verir. OIDC kimlik ekler, ID token verir.

**SQL enjeksiyonu nasıl önlenir?**
Parametreli sorgu. EF Core ve Dapper bunu yapar. `FromSqlRaw` ile dizgi birleştirmem.

**CORS nedir?**
Tarayıcının başka kökenden gelen isteklere izin verip vermeyeceğini sunucunun başlıklarla bildirmesi. Bir güvenlik özelliği değil, tarayıcının aynı köken politikasını gevşetme mekanizmasıdır. `AllowAnyOrigin` ile kimlik bilgisi birlikte kullanılmaz.

## Veritabanı ve EF Core

**N+1 problemi nedir?**
Liste için bir, her eleman için bir sorgu daha. `Include` ya da projeksiyonla çözülür. → *.NET › EF Core Derinlemesine*

**`AsNoTracking` ne zaman?**
Güncellenmeyecek okuma sorgularında.

**İyimser ve kötümser eşzamanlılık?**
İyimser: sürüm kolonu (rowversion) ile yazarken çakışmayı tespit et. Kötümser: okurken kilitle (`SELECT ... FOR UPDATE`, `UPDLOCK`). Çakışma seyrekse iyimser.

**Transaction izolasyon seviyeleri ve anomaliler?**
Read uncommitted, read committed, repeatable read, serializable. Kirli okuma, tekrarlanamayan okuma, hayalet okuma. → *Veritabanları › Transaction'lar ve İzolasyon*

**Clustered ve nonclustered indeks farkı?**
Clustered tablonun kendisidir ve tektir. Nonclustered ayrı bir yapıdır. → *Veritabanları › SQL Server ve T-SQL*

**İndeks ne zaman zarar verir?**
Yazmaları yavaşlatır ve yer kaplar. Düşük seçicilikli kolonda kullanılmaz. Fazla indeks yazma ağırlıklı tablolarda maliyetlidir. → *Veritabanları › İndeksler ve Sorgu Planları*

**Normalizasyon ve denormalizasyon?**
Normalizasyon tekrarı ve güncelleme anomalilerini önler. Denormalizasyon okuma performansı için bilinçli tekrardır. → *Veritabanları › Veri Modelleme*

**EF Core mu, Dapper mı?**
Yazma tarafı ve domain modeli için EF Core, ağır okuma ve raporlar için Dapper ya da ham SQL. İkisi birlikte kullanılabilir.

**SQL ile NoSQL arasında nasıl seçersin?**
Erişim desenine ve tutarlılık ihtiyacına göre. → *Veritabanları › NoSQL ve Arama*

## Mimari ve dağıtık sistemler

**SOLID'i bir örnekle anlat.**
Her ilkeyi kendi projenden bir örnekle anlatabilmelisin. En çok sorulanlar: tek sorumluluk ve bağımlılığın tersine çevrilmesi. → *Bilgisayar Bilimi Temelleri › SOLID İlkeleri*

**Clean Architecture'da bağımlılık kuralı?**
Bağımlılıklar içe doğru akar. Domain hiçbir şeye bağımlı değildir. → *.NET › Clean Architecture, Vertical Slice ve CQRS*

**CQRS nedir, ayrı veritabanı gerekir mi?**
Okuma ve yazma modellerini ayırmak. Gerekmez.

**DDD'de aggregate nedir?**
Birlikte tutarlı kalması gereken nesneler. Kökten erişilir, küçük tutulur. → *.NET › Domain-Driven Design*

**Mikroservis mi, monolit mi?**
Gerekçe yoksa modüler monolit. Mikroservis organizasyonel bir ölçekleme aracıdır. → *.NET › Modüler Monolit ve Mikroservisler*

**Mikroservislerde dağıtık transaction?**
Saga ve telafi işlemleri. Mesajlar outbox ile tutarlı yayımlanır.

**Mesaj kuyruğunda aynı mesaj iki kez gelirse?**
En az bir kez teslim normaldir. Tüketici idempotent yazılır. → *.NET › Mesajlaşma*

**RabbitMQ mı, Kafka mı?**
Görev kuyruğu ve yönlendirme için RabbitMQ. Olay akışı, yeniden oynatma ve çok yüksek hacim için Kafka.

**Önbelleği nasıl tutarlı tutarsın?**
TTL ve yazmada önce veritabanı, sonra önbelleği silme. Stampede'e karşı istek birleştirme. → *.NET › Önbellekleme ve Redis*

**CAP teoremi?**
Ağ bölünmesi olduğunda tutarlılık ile erişilebilirlik arasında seçim yapılır. → *Sistem Tasarımı › Tutarlılık, Uzlaşma ve Dağıtık İşlemler*

**Retry ve circuit breaker?**
Retry geçici hatalarda, idempotent işlemde ve jitter'lı beklemeyle. Circuit breaker çöken bağımlılığa yüklenmeyi durdurur. → *.NET › Gözlemlenebilirlik ve Dayanıklılık*

## Test, DevOps ve pratikler

**Unit test ile integration test farkı? Neyi mock'larsın?**
Birim yalıtılmış davranışı, entegrasyon bileşenlerin birlikte çalışmasını test eder. Kendi soyutlamalarımı mock'larım, `DbContext`'i değil. → *.NET › .NET'te Test*

**Docker ile VM farkı? Multi-stage build neden?**
Konteyner çekirdeği paylaşır ve hafiftir. Multi-stage SDK'yı son imaja koymaz. → *DevOps ve Bulut › Docker*

**Kubernetes'te liveness ile readiness farkı?**
Liveness başarısızsa yeniden başlatır, readiness başarısızsa trafiği keser. → *DevOps ve Bulut › Kubernetes Temelleri*

**CI/CD hattında neler olmalı?**
Derleme, test, statik analiz, güvenlik taraması, tek artefakt, ortamlar ve onay, geri alma. → *DevOps ve Bulut › CI/CD Hatları*

**Merge ile rebase farkı?**
→ *Mühendislik Pratikleri › Git Derinlemesine*

**Üretimde yavaşlayan bir uç noktayı nasıl teşhis edersin?**
Metriklerle kapsamı, izlerle zamanın nerede harcandığını bulurum. Genellikle veritabanı ya da dış çağrıdır. Kodsa profil çıkarırım. → *.NET › Gözlemlenebilirlik ve Dayanıklılık*, *DevOps ve Bulut › Backend Geliştiricisi için Linux*

## Ev ödevi (take-home) turu

Türkiye'deki şirketlerin çoğu, birkaç gün süre verilen bir ev ödevi ister: "Bir sipariş API'si yaz", "Bir kütüphane yönetim sistemi yap". Ödevi değerlendiren kişi çalışmasından çok **nasıl yazıldığına** bakar. Zirve'deki *Pratik Projesi: Kütüphane Yönetim API'si* yolu tam olarak bu tür bir ödevin kapsamlı bir provasıdır.

Değerlendirmede fark yaratanlar:

- **README:** nasıl çalıştırılır (tek komut, mümkünse `docker compose up`), hangi varsayımlar yapıldı, hangi ödünleşimler seçildi, zaman olsaydı neler eklenirdi.
- **Çalışır durumda teslim.** Derlenmeyen ya da açılmayan proje genellikle orada elenir. Temiz bir makinede deneyin.
- **Testler:** en azından iş kuralları için birim testleri ve bir iki entegrasyon testi.
- **Makul ve tutarlı yapı.** Aşırı mühendislik de eksi puandır. Küçük bir ödev için on proje ve beş tasarım deseni gerekmez.
- **Doğru HTTP kullanımı, doğrulama, hata yönetimi** ve gizli bilgilerin depoda olmaması.
- **Anlamlı commit geçmişi.** Tek bir "initial commit" yerine adım adım ilerleme.
- Sonraki görüşmede kodunuzu savunmaya ve "şunu değiştirsek ne yapardın?" sorusuna hazır olun.

## Canlı kodlama turu

- Problem çözme yöntemini uygulayın: soruyu netleştir, örnekle düşün, yaklaşımı anlat, kodla, test et. → *Mülakat › Kodlama Mülakatında Problem Çözme Yöntemi*
- .NET'e özgü canlı kodlamada sık gelenler: LINQ ile veri dönüştürme, basit bir LRU önbellek, eşzamanlı güvenli sayaç, hız sınırlayıcı, bir JSON'u ayrıştırıp doğrulama, mevcut bir kodu refactor etme ya da hatasını bulma.
- Yüksek sesle düşünün. Sessiz kalan aday değerlendirilemez.

## Senin soruların

Mülakatın sonunda "Sorunuz var mı?" sorusu bir değerlendirme fırsatıdır. İyi sorular:

- "Bir özellik fikirden üretime nasıl gidiyor? Dağıtım sıklığınız ne?"
- "On-call nasıl işliyor, son büyük olaydan ne öğrendiniz?"
- "Teknik borcu nasıl önceliklendiriyorsunuz?"
- "Bu rolde ilk üç ayda başarı neye benzer?"
- "Code review ve mentorluk süreciniz nasıl?"

Cevaplar şirketin mühendislik olgunluğu hakkında çok şey söyler.

## Özet

- .NET mülakatlarının teknik turu dil, framework, veritabanı, mimari ve pratikleri kapsar. Her cevap kendi örneğinizle desteklenmelidir.
- Bu dersteki her soru Zirve'de derinlemesine anlatılan bir konuya bağlıdır. Zayıf olduğunuz bölümün dersine dönün.
- Ev ödevinde README, çalışır teslim, testler, makul yapı ve anlamlı commit geçmişi belirleyicidir.
- Canlı kodlamada yöntem ve yüksek sesle düşünmek, sonuç kadar önemlidir.
- Mülakatın sonundaki sorularınız şirketi değerlendirmenizi sağlar.
