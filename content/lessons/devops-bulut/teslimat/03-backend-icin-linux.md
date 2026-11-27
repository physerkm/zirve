---
title: Backend Geliştiricisi için Linux
summary: Dosya sistemi ve izinler, süreçler ve sinyaller, systemd, log okuma, ağ teşhis araçları, kaynak kullanımını izleme, metin işleme komutları ve üretimde bir sorunu adım adım teşhis etmek.
minutes: 18
level: beginner
---

.NET servisleri artık büyük çoğunlukla Linux üzerinde, konteynerlerde çalışır. İlanların bir kısmı "Linux bilgisi" ister, ama asıl ihtiyaç mülakatta değil olay anında ortaya çıkar: servis yanıt vermiyor ve elinizde yalnızca bir terminal var. Bu ders o anda gereken komutları ve düşünme biçimini toplar.

## Dosya sistemi

| Dizin | İçerik |
| --- | --- |
| `/etc` | Yapılandırma dosyaları |
| `/var/log` | Loglar |
| `/var/lib` | Uygulama verileri (ör. veritabanı dosyaları) |
| `/opt`, `/srv` | Elle kurulan uygulamalar, sunulan veriler |
| `/tmp` | Geçici dosyalar |
| `/proc` | Çekirdeğin süreçler hakkında sunduğu sanal dosyalar |
| `/home/<kullanıcı>` | Kullanıcı dizinleri |

```bash
pwd; ls -la; cd /var/log
du -sh *                 # klasör boyutları
df -h                    # disk doluluğu: "disk dolu" hatalarının ilk adresi
find / -name "*.log" -size +500M 2>/dev/null   # büyük log dosyalarını bul
```

## İzinler

```text
-rwxr-x---  1 app  app  4096 Nov 24 10:00 run.sh
 │  │  │
 │  │  └── diğerleri: hiçbir şey
 │  └───── grup: oku + çalıştır
 └──────── sahip: oku + yaz + çalıştır
```

Sayısal gösterim: r=4, w=2, x=1. `750` = sahip 7 (rwx), grup 5 (r-x), diğerleri 0.

```bash
chmod 750 run.sh
chmod +x deploy.sh
chown app:app /var/lib/orders
sudo -u app whoami       # komutu başka kullanıcı olarak çalıştır
```

Servisleri **root olarak çalıştırmayın**. Her servis yalnızca kendi dosyalarına yazabilen ayrı bir kullanıcıyla çalışmalıdır. Gizli bilgi içeren dosyalar `600` (yalnızca sahip okur ve yazar) olmalıdır.

## Süreçler ve sinyaller

```bash
ps aux | grep Orders     # süreçleri listele
top                      # canlı CPU ve bellek (htop daha okunaklı)
kill <pid>               # SIGTERM: "lütfen düzgün kapan"
kill -9 <pid>            # SIGKILL: anında öldür (temizlik yapılamaz)
```

| Sinyal | Anlamı |
| --- | --- |
| `SIGTERM` (15) | Düzgün kapanma isteği. Docker ve Kubernetes önce bunu gönderir |
| `SIGKILL` (9) | Zorla öldürme, yakalanamaz |
| `SIGINT` (2) | `Ctrl+C` |
| `SIGHUP` (1) | Terminal kapandı. Bazı servisler bunu "yapılandırmayı yeniden oku" diye yorumlar |

.NET host `SIGTERM`'i yakalar, `IHostApplicationLifetime.ApplicationStopping`'i tetikler ve hosted service'lere kapanma süresi verir. `kill -9` ile öldürülen servis yarım kalan işini bitiremez. Bu yüzden ilk tercih her zaman `SIGTERM`'dir.

**Çıkış kodları:** `0` başarı, diğer her şey hata. `137` = 128 + 9, yani süreç `SIGKILL` ile öldürüldü (konteynerlerde çoğu zaman bellek limiti aşımı, OOM). `143` = 128 + 15, `SIGTERM` ile kapandı.

## systemd ile servis çalıştırmak

Konteyner kullanılmayan sunucularda .NET uygulaması bir systemd servisi olarak çalıştırılır:

```ini
# /etc/systemd/system/orders.service
[Unit]
Description=Orders API
After=network.target

[Service]
User=app
WorkingDirectory=/opt/orders
ExecStart=/usr/bin/dotnet /opt/orders/Orders.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now orders     # açılışta başlat ve şimdi başlat
systemctl status orders
journalctl -u orders -f                # servisin logları, canlı
journalctl -u orders --since "10 min ago"
```

Uygulamada `builder.Host.UseSystemd()` (Microsoft.Extensions.Hosting.Systemd paketi) systemd'ye "hazırım" bildirimi gönderir ve logları uygun biçime çevirir. Önünde genellikle bir ters vekil (nginx) TLS'i sonlandırır.

## Log okumak

```bash
tail -f /var/log/nginx/error.log                 # canlı izle
tail -n 200 app.log | less                       # son 200 satır, sayfalı
grep -i "timeout" app.log | wc -l                # kaç kez zaman aşımı oldu
grep -C 5 "TraceId=4bf92f" app.log               # eşleşmenin 5 satır öncesi ve sonrası
zgrep "OrderId=8412" app.log.*.gz                # sıkıştırılmış eski loglarda ara
```

### Metin işleme ile hızlı analiz

```bash
# En çok istek atan 10 IP
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head

# 5xx yanıtlarının uç noktalara göre dağılımı
awk '$9 ~ /^5/ {print $7}' access.log | sort | uniq -c | sort -rn | head

# JSON loglarda seviyesi Error olanlar (jq ile)
jq -c 'select(.Level == "Error") | {time: .Timestamp, msg: .RenderedMessage}' app.json | head
```

Boru (`|`) ile küçük araçları birleştirmek Unix felsefesinin özüdür: her araç tek bir iş yapar, çıktısı bir sonrakinin girdisi olur.

## Ağ teşhisi

```bash
curl -v https://api.example.com/health           # isteğin ayrıntısı: DNS, TLS, başlıklar
curl -w "%{time_total}\n" -o /dev/null -s https://api.example.com   # toplam süre
dig api.example.com                               # DNS çözümlemesi
nc -zv db.internal 5432                           # port açık mı?
ss -tlnp                                          # bu makinede hangi süreç hangi portu dinliyor
ss -s                                             # bağlantı özeti (TIME_WAIT yığılması?)
ping, traceroute                                  # erişilebilirlik ve yol
```

"Veritabanına bağlanamıyorum" sorusunun teşhis sırası: DNS çözülüyor mu (`dig`), port erişilebilir mi (`nc`), TLS sorunsuz mu (`openssl s_client`), kimlik bilgileri doğru mu (uygulama logu).

## Kaynak kullanımı

```bash
free -h                  # bellek
uptime                   # yük ortalaması (load average): 1, 5, 15 dakika
vmstat 1                 # CPU, bellek, takas (swap), G/Ç saniye saniye
iostat -x 1              # disk G/Ç beklemesi
lsof -p <pid> | wc -l    # süreç kaç dosya ve soket açmış (dosya tanımlayıcı sızıntısı?)
ulimit -n                # açık dosya sınırı
```

Yük ortalaması CPU çekirdek sayısıyla birlikte okunur: 4 çekirdekli makinede `4.0` tam kullanım demektir, `12.0` ciddi kuyruk demektir.

.NET'e özgü araçlar: `dotnet-counters` (GC, thread havuzu, istek sayısı canlı), `dotnet-trace` (performans izi), `dotnet-dump` (bellek dökümü alıp analiz etmek). Konteyner içinde de çalışırlar.

## Bir olayın teşhisi: örnek akış

"API yavaşladı" alarmı geldi:

1. **Kapsam:** her uç nokta mı, biri mi? Bütün örnekler mi, biri mi? (Metrik panosu)
2. **Kaynak:** `top`, `free -h`, `df -h`. CPU %100 mü, bellek dolu mu, disk dolu mu?
3. **Uygulama:** `dotnet-counters monitor -p <pid>`. GC süresi arttı mı, thread havuzu kuyruğu büyüyor mu (sync-over-async ile thread açlığı)?
4. **Bağımlılıklar:** veritabanı ve dış servis gecikmeleri (izler, `curl -w`).
5. **Değişiklik:** son dağıtım ne zamandı? Çoğu olayın sebebi son değişikliktir.

## Mülakatta sorulur

- **"`kill` ile `kill -9` farkı?"** İlki SIGTERM gönderir ve uygulamanın düzgün kapanmasına izin verir. İkincisi SIGKILL'dir ve anında öldürür.
- **"Konteyner 137 koduyla çıktı. Ne olmuş?"** SIGKILL ile öldürülmüş. Çoğu zaman bellek limiti aşılmıştır (OOMKilled).
- **"Disk doldu. Nasıl bulursun?"** `df -h` ile hangi bölüm, `du -sh` ile hangi klasör. Genellikle döndürülmeyen (rotate edilmeyen) loglardır.
- **"Hangi süreç 8080 portunu kullanıyor?"** `ss -tlnp | grep 8080` ya da `lsof -i :8080`.
- **"Bir logdaki hataları uç noktaya göre nasıl sayarsın?"** `grep`, `awk`, `sort`, `uniq -c` zinciriyle ya da JSON loglar için `jq` ile.

## Özet

- Disk, log ve yapılandırma yerlerini bilin. "Disk dolu" `df` ve `du` ile bulunur.
- Servisler root olarak çalışmaz. Gizli dosyalar `600` izinli olur.
- Önce SIGTERM, son çare SIGKILL. 137 çıkış kodu genellikle bellek aşımıdır.
- systemd ve journalctl, konteynersiz sunucularda servis yönetiminin temelidir.
- `grep`, `awk`, `sort`, `uniq`, `jq` ve `curl`, `dig`, `ss` teşhisin günlük araçlarıdır. .NET için `dotnet-counters` ve `dotnet-trace` vardır.
