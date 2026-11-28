---
title: Docker ile Konteynerler
summary: Konteyner ile sanal makine farkı, imaj ve katmanlar, .NET için çok aşamalı Dockerfile, katman önbelleği, küçük ve güvenli imajlar, root olmayan kullanıcı, docker compose ile yerel ortam ve sık yapılan hatalar.
minutes: 22
level: beginner
---

18 ilanın 7'si Docker'ı açıkça ister. Geri kalanların çoğu "konteyner tabanlı dağıtım" ya da Kubernetes der ki bu da Docker bilgisini varsayar. Zirve'nin kendisi de `docker-compose.yml` ve Dockerfile'larla dağıtılır. Bu ders bir .NET servisini doğru paketlemeyi ve mülakattaki temel soruları anlatır.

## Konteyner nedir?

Bir konteyner, uygulamayı **bağımlılıklarıyla birlikte** paketleyip işletim sisteminden yalıtılmış bir süreç olarak çalıştırır. "Benim makinemde çalışıyordu" sorununu, makinenin kendisini paketleyerek çözer.

| | Sanal makine | Konteyner |
| --- | --- | --- |
| Neyi sanallaştırır | Donanımı | İşletim sistemini |
| Çekirdek | Her VM'in kendi çekirdeği | Ana makinenin çekirdeği paylaşılır |
| Boyut | GB'lar | MB'lar |
| Açılış | Dakikalar | Saniyeler |
| Yalıtım | Güçlü | Daha zayıf (aynı çekirdek) |

Linux'ta konteyner yalıtımını iki çekirdek özelliği sağlar: **namespace'ler** (süreç neyi görebilir: süreç listesi, ağ, dosya sistemi) ve **cgroup'lar** (ne kadar kullanabilir: CPU, bellek).

## İmaj, katman, konteyner

- **İmaj:** salt okunur bir şablon. Katmanlardan oluşur.
- **Katman:** Dockerfile'daki her talimat (`RUN`, `COPY`) bir katman üretir. Katmanlar önbelleğe alınır ve imajlar arasında paylaşılır.
- **Konteyner:** imajın çalışan bir örneği. Üstüne yazılabilir ince bir katman eklenir. Konteyner silinince bu katman da gider.
- **Registry:** imajların saklandığı depo (Docker Hub, GitHub Container Registry, Azure Container Registry, Amazon ECR).

Sonuç: **konteynerler geçicidir.** Kalıcı olması gereken veri (veritabanı dosyaları, yüklemeler) **volume**'da ya da dış bir serviste durur.

## .NET için çok aşamalı Dockerfile

```dockerfile
# 1) Derleme aşaması: SDK büyük (~800 MB), yalnızca burada
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Önce yalnızca proje dosyaları: bağımlılıklar değişmedikçe restore katmanı önbellekten gelir
COPY Directory.Packages.props Directory.Build.props ./
COPY src/Orders.Api/Orders.Api.csproj src/Orders.Api/
RUN dotnet restore src/Orders.Api/Orders.Api.csproj

# Sonra kaynak kod: kod değişince yalnızca buradan sonrası yeniden çalışır
COPY src/ src/
RUN dotnet publish src/Orders.Api/Orders.Api.csproj -c Release -o /app --no-restore

# 2) Çalışma aşaması: yalnızca çalışma zamanı (~100 MB'ın altında)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS final
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Orders.Api.dll"]
```

Bu dosyadaki her karar bir mülakat sorusudur:

- **Çok aşamalı derleme (multi-stage):** SDK, kaynak kod ve ara dosyalar son imaja girmez. İmaj küçülür ve saldırı yüzeyi azalır.
- **Katman sırası:** sık değişen şey (kaynak kod) en sona. `COPY . .` ile başlayıp sonra `restore` etmek, her kod değişikliğinde bütün paketleri yeniden indirtir.
- **Chiseled imaj:** Ubuntu tabanlı, kabuk (shell) ve paket yöneticisi olmayan minimal imaj. Güvenlik taramalarında daha az açık çıkar. Ödünleşim: konteynerin içine girip `bash` ile hata ayıklayamazsınız.
- **Root olmayan kullanıcı:** .NET 8'den beri resmi imajlarda `app` kullanıcısı hazırdır (`$APP_UID`). Konteyner ele geçirilirse saldırgan root olmaz.
- **Port 8080:** .NET 8'den beri ASP.NET Core imajları varsayılan olarak 80 değil **8080**'i dinler, çünkü root olmayan kullanıcı 1024 altındaki portları açamaz.

`.dockerignore` dosyası da şarttır: `bin/`, `obj/`, `.git/`, `node_modules/` ve gizli dosyalar derleme bağlamına gönderilmez.

Alternatif: .NET SDK Dockerfile olmadan da imaj üretebilir: `dotnet publish -t:PublishContainer`. Basit servisler için pratik bir seçenektir.

## Temel komutlar

```bash
docker build -t orders-api:1.4.2 .
docker run -d --name orders -p 5000:8080 -e ConnectionStrings__Db="Host=db;..." orders-api:1.4.2
docker ps                      # çalışan konteynerler
docker logs -f orders          # logları izle
docker exec -it orders sh      # içine gir (chiseled imajda kabuk yok)
docker stop orders && docker rm orders
docker image prune             # etiketsiz (dangling) imajları temizle (-a: kullanılmayan bütün imajlar)
```

- `-p 5000:8080`: ana makinenin 5000 portunu konteynerin 8080 portuna bağlar.
- `-e`: ortam değişkeni. ASP.NET Core'da `__` (iki alt çizgi) yapılandırmadaki `:` ayracının yerini tutar.
- Etiket olarak `latest` kullanmak hangi sürümün çalıştığını belirsizleştirir. Üretimde sürüm numarası ya da commit hash'i kullanın.

## docker compose ile yerel ortam

Uygulama, veritabanı, Redis ve RabbitMQ'yu tek komutla kaldırmak için:

```yaml
services:
  api:
    build: .
    ports: ["5000:8080"]
    environment:
      ConnectionStrings__Db: "Host=db;Database=orders;Username=app;Password=dev-only"
      ConnectionStrings__Redis: "redis:6379"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: dev-only
      POSTGRES_DB: orders
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

- Aynı compose dosyasındaki servisler **servis adıyla** birbirine ulaşır (`Host=db`). Konteyner içinde `localhost` konteynerin kendisidir, ana makine değil. Bu, en sık yapılan bağlantı hatasıdır.
- `depends_on` yalnızca başlama sırasını belirler. Veritabanının **hazır** olmasını beklemek için `condition: service_healthy` ve bir `healthcheck` gerekir. Yine de uygulama, bağımlılık geç hazır olursa yeniden denemeye dayanıklı yazılmalıdır.

## Güvenlik ve iyi uygulamalar

- **Gizli bilgileri imaja gömmeyin.** `ENV PASSWORD=...` ya da `COPY appsettings.Production.json` ile gelen parola, imajı çeken herkesin elindedir. Katmanlar silinse bile geçmişte kalır. Gizli değerler çalışma zamanında ortam değişkeni, Docker/Kubernetes secret ya da bir kasa servisiyle verilir.
- **İmajları tarayın:** Trivy, Docker Scout ya da registry'nin yerleşik tarayıcısı ile bilinen açıklara bakın. Temel imajı düzenli güncelleyin.
- **Bir konteynerde bir süreç.** Birden fazla şeyi aynı konteynerde çalıştırmak ölçeklemeyi ve log toplamayı zorlaştırır.
- **Loglar stdout'a.** Konteyner içinde dosyaya log yazmak yerine standart çıktıya yazın. Platform onları toplar.
- **Sinyalleri doğru işleyin.** `docker stop` önce `SIGTERM` gönderir, süre dolunca (`10 sn`) `SIGKILL`. .NET host `SIGTERM`'i alıp düzgün kapanır. `ENTRYPOINT`'in exec biçiminde (`["dotnet", "..."]`) yazılması bu yüzden önemlidir: kabuk biçimi sinyali uygulamaya iletmeyebilir.
- **Kaynak sınırları:** `--memory` ve `--cpus`. .NET çalışma zamanı konteyner sınırlarını algılar ve GC ile thread havuzunu buna göre ayarlar.

## Mülakatta sorulur

- **"Konteyner ile sanal makine farkı?"** VM donanımı sanallaştırır ve kendi çekirdeğini taşır. Konteyner çekirdeği paylaşır, daha hafiftir ama yalıtımı daha zayıftır.
- **"Multi-stage build neden?"** SDK ve kaynak kod son imaja girmez. İmaj küçülür ve daha güvenli olur.
- **"Dockerfile'da katman sırası neden önemli?"** Değişen katmandan sonraki her şey yeniden çalışır. Önce proje dosyaları ve restore, sonra kaynak kod.
- **"Konteyner silinince veri ne olur?"** Yazılabilir katman gider. Kalıcı veri volume'da ya da dış serviste tutulur.
- **"API konteyneri veritabanına `localhost` ile bağlanamıyor. Neden?"** Konteynerde `localhost` kendisidir. Compose'da servis adını kullanırım.

## Özet

- Konteyner, uygulamayı bağımlılıklarıyla paketleyen ve çekirdeği paylaşan yalıtılmış bir süreçtir.
- İmaj katmanlardan oluşur. Sık değişen şeyi en sona koyun.
- .NET için çok aşamalı derleme, küçük (chiseled) çalışma imajı, root olmayan kullanıcı ve 8080 portu.
- Compose'da servisler adla konuşur. Hazır olmayı health check ile bekleyin.
- Gizli bilgi imaja girmez, imajlar taranır, loglar stdout'a yazılır ve sinyaller doğru işlenir.
