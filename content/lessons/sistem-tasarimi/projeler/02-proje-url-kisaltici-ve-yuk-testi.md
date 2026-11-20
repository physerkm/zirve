---
title: "Proje 1: Ölçeklenebilir URL Kısaltıcı ve Yük Testi"
summary: URL kısaltıcı tasarımını .NET, PostgreSQL, Redis ve Docker ile gerçekten kur; k6 ile yük altında ölç. Aralık dağıtan kimlik üreteci, cache-aside, yatay ölçek, okuma kopyası, kuyrukla analitik ve kaos testleri.
minutes: 30
level: intermediate
---

Bu projede [URL Kısaltıcı](/tracks/sistem-tasarimi/url-kisaltici) dersindeki tasarımı adım adım kuracak ve her adımın etkisini **sayılarla** göreceksin. Amaç çalışan bir servis değil; "önbellek ekledim, p99 gecikme 38 ms'den 4 ms'ye düştü, darboğaz veritabanı bağlantı havuzundan Redis ağ gidiş dönüşüne kaydı" diyebilmek.

## Teknoloji

| Parça | Seçim |
| --- | --- |
| Servis | .NET 10 Minimal API (istersen Node/TypeScript ya da Go) |
| Veritabanı | PostgreSQL 18 |
| Önbellek | Redis (StackExchange.Redis) |
| Yük dengeleyici | nginx |
| Yük testi | [k6](https://grafana.com/docs/k6/latest/) |
| Gözlemlenebilirlik | OpenTelemetry + .NET Aspire panosu ya da Prometheus + Grafana |
| Ortam | Docker Compose |

## Aşama 0: tasarım belgesi

Kod yazmadan önce bir sayfalık `DESIGN.md` yaz: gereksinimler, kapasite tahmini, API, veri modeli, kod üretim yöntemi ve neden onu seçtiğin. Projenin sonunda bu belgeyi gerçek ölçümlerle karşılaştıracaksın.

## Aşama 1: çalışan en basit sürüm

İki uç nokta: `POST /v1/links` ve `GET /{code}` (302 yönlendirme). Tek servis, tek PostgreSQL.

```sql
CREATE TABLE links (
    code        text PRIMARY KEY,
    long_url    text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz
);

-- Kimlik blokları: her nextval çağrısı 1.000'lik yeni bir blok başlangıcı verir.
CREATE SEQUENCE link_id_blocks INCREMENT BY 1000;
```

**Kimlik üreteci:** her servis örneği `SELECT nextval('link_id_blocks')` ile 1.000'lik bir blok alır ve blok bitene kadar veritabanına sormadan kimlik üretir. Ardışık kimlikleri tahmin edilemez yapmak için kimliği kodlamadan önce tersinir biçimde karıştır:

```csharp
public static class ShortCode
{
    private const string Alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const long Mask = (1L << 41) - 1;       // 2^41 < 62^7: sonuç en fazla 7 karakter
    private const long Multiplier = 0x5DEECE66DL;   // tek sayı -> mod 2^41'de tersinir (bijektif)

    public static string FromId(long id)
    {
        var scrambled = unchecked(id * Multiplier) & Mask; // taşma mod 2^64 sarar, maske mod 2^41 alır
        Span<char> buffer = stackalloc char[7];
        var position = buffer.Length;

        do
        {
            buffer[--position] = Alphabet[(int)(scrambled % 62)];
            scrambled /= 62;
        }
        while (scrambled > 0);

        return new string(buffer[position..]);
    }
}
```

Tek sayıyla çarpma, 2'nin kuvveti modülünde **bire bir** eşlemedir: iki farklı kimlik asla aynı koda düşmez, yani çakışma denetimi gerekmez. Bu şifreleme değildir; yalnızca sıralı gezinmeyi zorlaştırır.

**Bitti sayılır:** birim testleri (aynı kimlik iki kez üretilmiyor, kodlar ≤ 7 karakter), uçtan uca bir entegrasyon testi.

## Aşama 2: ilk ölçüm

Yük testinden önce **test verisini** hazırla: 1 milyon bağlantı oluştur ve kodlarını bir dosyaya yaz. Gerçek trafik çarpıktır: az sayıda bağlantı tıklamaların çoğunu alır. Bunu k6 betiğinde kuvvet yasasıyla taklit et:

```javascript
import http from 'k6/http';
import { check } from 'k6';

const codes = JSON.parse(open('./codes.json'));

export const options = {
  scenarios: {
    redirects: {
      executor: 'constant-arrival-rate', // kapalı döngü değil, sabit gelen istek hızı
      rate: 2000,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 300,
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<50'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Math.random() ** 3 küçük indekslere yığılır: ilk bağlantılar çok popüler.
  const code = codes[Math.floor(codes.length * Math.random() ** 3)];
  const res = http.get(`http://localhost:8080/${code}`, { redirects: 0 });
  check(res, { 'yönlendirme': (r) => r.status === 302 });
}
```

`constant-arrival-rate` önemlidir: sabit sayıda sanal kullanıcı yerine sabit **istek hızı** üretir. Sistem yavaşladığında yük azalmaz; gerçek dünyadaki gibi istekler birikir ve kuyruk gecikmesini görürsün.

Hızı kademeli artır (500, 1.000, 2.000, 4.000 …) ve her adımda bir satır doldur:

| Aşama | Hedef RPS | Ulaşılan RPS | p50 | p99 | Hata % | CPU (API / DB) | Darboğaz |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2: yalnız DB | | | | | | | |
| 3: + Redis | | | | | | | |
| 4: 3 örnek | | | | | | | |
| 5: + okuma kopyası | | | | | | | |

**Darboğazı bul.** Sistem doyduğunda nerede bekleniyor? Npgsql bağlantı havuzu (`Max Pool Size`), PostgreSQL CPU'su, iş parçacığı havuzu, ağ? `EXPLAIN ANALYZE` ile yönlendirme sorgusunun indeks kullandığını doğrula.

## Aşama 3: cache-aside

```csharp
app.MapGet("/{code}", async (string code, IDatabase redis, NpgsqlDataSource db) =>
{
    var key = $"link:{code}";
    var cached = await redis.StringGetAsync(key);
    if (cached.HasValue)
    {
        return cached == "-" ? Results.NotFound() : Results.Redirect(cached.ToString(), permanent: false);
    }

    await using var command = db.CreateCommand(
        "SELECT long_url FROM links WHERE code = $1 AND (expires_at IS NULL OR expires_at > now())");
    command.Parameters.Add(new NpgsqlParameter { Value = code });
    var url = (string?)await command.ExecuteScalarAsync();

    // Var olmayan kodları da kısa süreli önbelleğe al ("-"): var olmayan anahtar saldırısına karşı.
    var ttl = url is null ? TimeSpan.FromMinutes(1) : TimeSpan.FromHours(24) + TimeSpan.FromSeconds(Random.Shared.Next(0, 600));
    await redis.StringSetAsync(key, url ?? "-", ttl);

    return url is null ? Results.NotFound() : Results.Redirect(url, permanent: false);
});
```

TTL'e eklenen rastgele pay (jitter), aynı anda yazılmış anahtarların aynı anda düşmesini önler.

**Ölç:** önbellek isabet oranı (Redis `INFO stats` → `keyspace_hits` / `keyspace_misses`), p99 değişimi, veritabanı CPU'su. Ardından önbellek boyutunu sınırla (`maxmemory 50mb`, `maxmemory-policy allkeys-lru`) ve isabet oranının çarpık dağılım sayesinde hâlâ yüksek kaldığını gör.

## Aşama 4: yatay ölçek

API'yi üç örnekle nginx arkasına koy:

```yaml
services:
  api:
    build: .
    deploy:
      replicas: 3
    environment:
      ConnectionStrings__Db: Host=postgres;Database=links;Username=app;Password=app;Maximum Pool Size=50
      ConnectionStrings__Redis: redis:6379
  nginx:
    image: nginx:1.29
    ports: ["8080:80"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]
  postgres:
    image: postgres:18
  redis:
    image: redis:8
```

Doğrula: servis durumsuz mu? Her örnek kendi kimlik bloğunu alıyor mu? Üç örneğin bağlantı havuzlarının toplamı PostgreSQL'in `max_connections` sınırını aşıyor mu? (Aşıyorsa PgBouncer ekle; bu, gerçek hayatta en sık karşılaşılan darboğazlardan biridir.)

## Aşama 5: okuma kopyası

PostgreSQL akış kopyalaması (streaming replication) ile bir kopya ekle; yönlendirme okumalarını kopyaya, yazmaları birincile gönder. Sonra **kopyalama gecikmesini kendi gözünle gör:** bir bağlantı oluşturduktan hemen sonra kopyadan okumayı dene. Ne zaman 404 alıyorsun? Çözümü uygula: yeni oluşturulan kodları birkaç saniye birincilden oku ya da oluşturma anında önbelleğe yaz.

## Aşama 6: kuyrukla analitik

Her yönlendirmede bir tıklama olayı üret. Önce bunu yönlendirme isteğinin içinde **eşzamanlı** olarak veritabanına yaz ve p99'u ölç. Sonra olayı Redis Streams'e (ya da RabbitMQ/Kafka) bırak ve ayrı bir tüketici süreçte toplu yaz. Farkı tabloya ekle.

Tüketiciyi durdur: yönlendirme çalışmaya devam ediyor mu? Tüketiciyi yeniden başlat: biriken olaylar işleniyor mu? Aynı olay iki kez işlenirse sayım bozuluyor mu? (Olay kimliğiyle idempotent yaz.)

## Aşama 7: kaos ve gözlemlenebilirlik

- OpenTelemetry ile istek izlerini topla; bir yönlendirmenin Redis ve PostgreSQL'de ne kadar zaman harcadığını izde gör.
- `docker compose stop redis`: servis yavaşlıyor ama çalışıyor mu (açık başarısızlık)? Redis çağrılarına kısa zaman aşımı koydun mu?
- `docker compose pause postgres`: istekler ne kadar bekliyor? Zaman aşımı ve devre kesici ekle (`Microsoft.Extensions.Http.Resilience` ya da Polly).
- Bir API örneğini öldür: nginx sağlık denetimiyle trafiği diğerlerine kaydırıyor mu?

## Bonus görevler

- `POST /v1/links` için IP başına hız sınırı (Proje 2'ye köprü).
- Süresi dolan bağlantıları toplu silen arka plan işi.
- Özel takma ad: benzersizlik kısıtıyla yarışsız ekleme; aynı takma adı aynı anda isteyen iki istemciyle test et.
- 301 ile 302'yi karşılaştır: tarayıcıda ikinci tıklamada sunucuya istek geliyor mu?

## Teslim ölçütleri

- [ ] `DESIGN.md`: tasarım, ödünleşimler ve **tahmin ile ölçüm karşılaştırması**.
- [ ] Doldurulmuş ölçüm tablosu ve her aşamadaki darboğazın açıklaması.
- [ ] `docker compose up` ile tek komutta ayağa kalkan ortam ve k6 betikleri.
- [ ] README'de "öğrendiklerim" bölümü: en şaşırtıcı bulgu neydi?
