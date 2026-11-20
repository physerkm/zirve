---
title: "Proje 4: Kendi Redis'ini Yaz"
summary: Gerçek redis-cli ile konuşabilen bir bellek içi anahtar–değer sunucusu. TCP ve RESP protokolü, eşzamanlı istemciler, TTL ve süre dolumu, LRU çıkarma, AOF ile kalıcılık ve lider–takipçi kopyalama.
minutes: 30
level: advanced
---

Redis, sistem tasarımı mülakatlarında en çok adı geçen bileşendir: önbellek, oturum deposu, hız sınırlayıcı, sıralı küme ile lider tablosu, pub/sub, kilit. Bu projede onun küçük ama gerçek bir kopyasını yazacaksın. Sonunda "Redis neden tek iş parçacıklı olduğu halde bu kadar hızlı?", "AOF ile RDB arasındaki fark ne?", "kopyalama eşzamansız mı?" sorularına ezberden değil, deneyimden yanıt vereceksin.

Bu proje [CodeCrafters'ın Build your own Redis](https://codecrafters.io/challenges/redis) meydan okumasıyla aynı yolu izler; istersen oradaki otomatik testlerle de ilerleyebilirsin. Aşağıdaki aşamalar ise sistem tasarımı açısından en öğretici noktalara odaklanır.

## Hedef

```text
$ redis-cli -p 6380
127.0.0.1:6380> SET kullanici:42 "Ayşe" EX 60
OK
127.0.0.1:6380> GET kullanici:42
"Ayşe"
127.0.0.1:6380> TTL kullanici:42
(integer) 57
```

Sunucuyu C#, Go, Rust ya da TypeScript ile yazabilirsin. İstemci olarak gerçek `redis-cli` ve `redis-benchmark` kullanacaksın; böylece protokol uyumluluğu kendiliğinden test edilir.

## Aşama 1: TCP sunucusu ve RESP

Redis istemcileri **RESP** (Redis Serialization Protocol) konuşur. Metin tabanlı ve basittir:

```text
İstemci:  *2\r\n$3\r\nGET\r\n$12\r\nkullanici:42\r\n      → ["GET", "kullanici:42"] dizisi
Sunucu:   $5\r\nAyşe\r\n                                 → 5 baytlık dizgi (UTF-8 "Ayşe")
          +OK\r\n                                         → basit dizgi
          :57\r\n                                         → tam sayı
          $-1\r\n                                         → null
          -ERR unknown command\r\n                        → hata
```

Dikkat: uzunluk öneki **bayt** cinsindendir, karakter değil ("Ayşe" 4 karakter, 5 bayt). Ayrıştırıcın parçalı gelen verilere dayanıklı olmalı: TCP mesaj sınırı tanımaz; bir komut iki okumaya bölünebilir ya da tek okumada üç komut gelebilir (**boru hattı**, pipelining). .NET'te `System.IO.Pipelines` bu iş için tasarlanmıştır.

`PING`, `ECHO`, `SET`, `GET`, `DEL`, `EXISTS` ile başla.

## Aşama 2: eşzamanlılık modeli

Binlerce istemci aynı anda bağlanacak. İki seçenek:

1. **Kilitli paylaşılan sözlük:** her bağlantı kendi görevinde, veri `ConcurrentDictionary` ya da kilitle korunur.
2. **Redis'in yolu: tek iş parçacıklı olay döngüsü.** Ağ G/Ç'si eşzamansız; komutlar ise tek bir iş parçacığında sırayla yürütülür (ör. bir `Channel<Command>` kuyruğundan). Kilit yoktur ve her komut kendiliğinden **atomiktir**; `INCR` için yarış durumu düşünmen gerekmez.

İkisini de dene ve `redis-benchmark -p 6380 -t set,get -n 1000000 -c 50 -P 16` ile karşılaştır. Neden tek iş parçacıklı model çoğu zaman yeterince hızlı? (İpucu: darboğaz CPU değil, ağ ve bellek erişimidir; komutlar mikrosaniyeler sürer.) Boru hattı (`-P 16`) iş hacmini ne kadar artırdı? Bu, ağ gidiş dönüşünün maliyetini gösterir.

## Aşama 3: TTL ve süre dolumu

`SET ... EX`, `EXPIRE`, `TTL`, `PERSIST`. Süresi dolan anahtarlar nasıl silinir?

- **Tembel silme:** anahtara erişildiğinde süresi dolmuşsa sil ve yok say. Ucuz, ama hiç erişilmeyen anahtarlar bellekte kalır.
- **Etkin örnekleme:** Redis'in yaptığı gibi saniyede birkaç kez, süreli anahtarlardan rastgele 20 tanesine bak, süresi dolanları sil; dolanların oranı %25'in üstündeyse hemen tekrarla.

İkisini birlikte uygula. 1 milyon anahtarı 1 saniyelik TTL ile ekleyip bellek kullanımının zamanla düştüğünü izle.

## Aşama 4: bellek sınırı ve çıkarma

`maxmemory` yapılandırmasını ekle. Sınır aşıldığında:

- `noeviction`: yazmaları hata ile reddet.
- `allkeys-lru`: en uzun süredir kullanılmayanı çıkar. Gerçek LRU, hash tablosu + çift yönlü bağlı listeyle O(1)'dir (klasik [LRU Önbellek](/problems/lru-onbellek) problemi). Redis ise bellek tasarrufu için **yaklaşık LRU** kullanır: rastgele 5 anahtar örnekler, en eskisini çıkarır.

İkisini uygula ve çarpık bir erişim deseninde (anahtarların %20'si isteklerin %80'i) isabet oranlarını karşılaştır. Yaklaşık LRU ne kadar kötü?

## Aşama 5: kalıcılık (AOF)

Süreç yeniden başladığında veri kaybolmamalı. **Yalnızca ekleme dosyası** (append-only file): her yazma komutunu RESP biçiminde bir dosyanın sonuna ekle; açılışta dosyayı baştan oynat.

Asıl soru, diske **ne zaman** zorla yazılacağıdır (`fsync`):

| Ayar | Dayanıklılık | Hız |
| --- | --- | --- |
| `always` | Her komuttan sonra fsync: komut kaybı yok | Çok yavaş |
| `everysec` | Saniyede bir: çökmede en fazla ~1 saniyelik kayıp | Redis'in varsayılanı |
| `no` | İşletim sistemine bırak | En hızlı, kayıp belirsiz |

Üçünü uygula, `redis-benchmark` ile yazma hızını ölç ve süreci `kill -9` ile öldürerek kaç komut kaybettiğini say. Bu tablo, "dayanıklılık ile gecikme arasındaki ödünleşim" cümlesinin somut halidir.

**Bonus: yeniden yazma.** AOF sonsuza kadar büyür (aynı anahtara 1 milyon `INCR`). Arka planda mevcut durumu en kısa komut dizisiyle yeni bir dosyaya yaz ve eskisiyle değiştir. Yeniden yazma sırasında gelen komutları kaybetmemek için ne yapman gerekiyor?

## Aşama 6: lider–takipçi kopyalama

İkinci bir sunucuyu `--replicaof localhost 6380` ile başlat:

1. Takipçi lidere bağlanır ve `PSYNC` ister.
2. Lider mevcut veri kümesinin **anlık görüntüsünü** gönderir, ardından gelen her yazma komutunu takipçiye **akıtır**.
3. Takipçi yalnızca okuma kabul eder.

Gözlemle ve ölç:

- **Kopyalama gecikmesi:** liderde `SET` yaptıktan kaç milisaniye sonra takipçide görünüyor? Lideri yapay olarak yük altına sok; gecikme ne oluyor?
- **Eşzamansız kopyalamanın bedeli:** liderde yazmayı onayla, takipçiye ulaşmadan lideri öldür. Takipçiyi lider yap: yazma kayboldu mu?
- **Kısmi yeniden eşitleme:** takipçinin bağlantısını kısa süre kes. Lider bütün veriyi yeniden mi gönderiyor, yoksa yalnızca kaçırılan kısmı mı? (Redis bunun için bir **kopyalama tamponu** ve konum (offset) tutar; uygula.)
- `WAIT 1 100` komutunu uygula: istemci, yazmasının en az bir takipçiye ulaştığını bekleyebilsin. Bu, yarı eşzamanlı kopyalamanın istemci tarafından seçilmesidir.

## Bonus görevler

- **Veri yapıları:** listeler (`LPUSH`, `LRANGE`), sıralı kümeler (`ZADD`, `ZRANGE`; atlama listesi ile) ve bunlarla bir lider tablosu.
- **Pub/Sub:** `SUBSCRIBE`, `PUBLISH`. Abone yavaşsa ne olur? Çıkış tamponu sınırı uygula.
- **Transaction'lar:** `MULTI`/`EXEC` ve `WATCH` ile iyimser kilit.
- **Streams:** `XADD`, `XREADGROUP`; tüketici grupları ve onaylanmamış mesaj listesi ile küçük bir mesaj kuyruğu.
- **Küme:** 16.384 slot, `CRC16(anahtar) % 16384`, `MOVED` yönlendirmesi.

## Teslim ölçütleri

- [ ] `redis-cli` ve `redis-benchmark` ile çalışan sunucu; boru hattı desteği.
- [ ] Eşzamanlılık modellerinin karşılaştırmalı benchmark sonuçları.
- [ ] AOF fsync ayarlarının hız/kayıp tablosu.
- [ ] Kopyalama gecikmesi ölçümü ve lider çöküşünde kayıp deneyi.
- [ ] README: "Redis'i bir sistem tasarımında kullanırken artık neye dikkat ederim?"
