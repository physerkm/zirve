---
title: Olay Yönetimi ve On-Call
summary: SLI, SLO ve hata bütçesi, iyi alarm tasarımı, on-call nöbeti, olay anında roller ve iletişim, önce hafifletme, runbook, kök neden analizi ve beş neden, suçlamasız postmortem.
minutes: 18
level: intermediate
---

Microsoft'un ilanlarında "live site", "on-call rotation", "incident response" gibi maddeler sabittir. Senior rol tanımları "üretim sistemlerinin sahipliği ve olay müdahalesi" ister. Bir servisi yazan ekip onu işletir de ("you build it, you run it"). Bu ders, gece saat 3'te telefon çaldığında ne yapacağını ve sonrasında aynı olayın tekrarlanmaması için ne yapılacağını anlatır.

## Güvenilirliği ölçmek: SLI, SLO, SLA

| Kavram | Tanım | Örnek |
| --- | --- | --- |
| **SLI** (gösterge) | Kullanıcı deneyimini ölçen metrik | Başarılı isteklerin oranı, isteklerin 300 ms altında yanıtlanma oranı |
| **SLO** (hedef) | SLI için iç hedef | 28 günde isteklerin %99,9'u başarılı |
| **SLA** (anlaşma) | Müşteriye verilen, yaptırımı olan söz | %99,5 altına düşerse ücret iadesi |

SLO, SLA'dan daha sıkı tutulur: iç hedef kaçırıldığında müşteri sözü hâlâ tutuluyor olmalıdır.

**Hata bütçesi** = 100% − SLO. %99,9 SLO, 28 günde yaklaşık **40 dakika** kesinti ya da her bin istekten birinin başarısız olması demektir.

- Bütçe varken ekip hızlı dağıtım yapar ve risk alabilir.
- Bütçe tükenince öncelik güvenilirliğe kayar: riskli dağıtımlar durur, güvenilirlik işleri öne alınır.

Bu mekanizma "hızlı mı gidelim, güvenli mi?" tartışmasını veriye dayalı bir karara dönüştürür. %100 hedefi yanlıştır: her ek "dokuz" maliyeti katlar ve kullanıcı zaten kendi ağından kaynaklı hataları görür.

## Alarm tasarımı

Kötü alarmlar on-call'un en büyük düşmanıdır. Sürekli çalan ve çoğu zaman bir şey gerektirmeyen alarmlar **alarm yorgunluğuna** yol açar: gerçek alarm geldiğinde de görmezden gelinir.

İlkeler:

- **Belirtiye göre alarm, sebebe göre değil.** "CPU %90" değil, "kullanıcılar hata alıyor" ya da "gecikme SLO'yu tehdit ediyor". CPU yüksekken kullanıcı etkilenmiyorsa kimseyi uyandırmaya gerek yok.
- **Her alarm eyleme dönüştürülebilir olmalı.** Alarmı alan kişi ne yapacağını bilmeli. Bilmiyorsa ya alarm gereksizdir ya da runbook eksiktir.
- **Aciliyete göre ayırın:** kullanıcıyı şimdi etkileyen durumlar kişiyi uyandırır (page). Beklemeyi kaldırabilecek durumlar iş saatinde bakılacak bir kayıt (ticket) olur.
- **Hata bütçesi tüketim hızına göre alarm** (burn rate): "Bu hızla giderse bütçe 2 günde biter" alarmı hem hızlı hem gürültüsüzdür.
- **Her alarm bir runbook'a bağlansın.**

## On-call

- **Nöbet döngüsü** adil olmalıdır (genellikle haftalık). Birincil ve ikincil (yedek) kişi olur.
- **Devir teslim:** açık sorunlar, devam eden işler ve dikkat edilecekler bir sonraki kişiye yazılı aktarılır.
- **Sürdürülebilirlik:** bir nöbette çok sayıda gece alarmı varsa bu bir kişisel değil sistemsel sorundur ve iyileştirme işi olarak ele alınır.
- On-call kişisinin görevi her şeyi kendisi çözmek değildir. Durumu değerlendirmek, hafifletmek ve gerekirse doğru kişileri çağırmaktır (escalation).

## Olay anında

### Önem dereceleri

| Seviye | Örnek | Müdahale |
| --- | --- | --- |
| **SEV1** | Ödeme alınamıyor, sistemin tamamı erişilemez, veri kaybı | Hemen, bütün gerekli kişiler, düzenli durum güncellemesi |
| **SEV2** | Önemli bir özellik çalışmıyor ya da kullanıcıların bir kısmı etkileniyor | Hemen, ilgili ekip |
| **SEV3** | Küçük etki, geçici çözüm var | İş saatinde |

### Roller

Büyük olaylarda roller ayrılır, çünkü aynı kişinin hem hata ayıklaması hem iletişim kurması hem karar vermesi çalışmaz:

- **Olay komutanı (incident commander):** koordinasyon ve kararlar. Kendisi hata ayıklamaz.
- **Operasyon / teknik sorumlu:** sorunu araştırır ve müdahale eder.
- **İletişim sorumlusu:** paydaşlara ve müşterilere düzenli güncelleme. Durum sayfası.
- **Kayıt tutucu:** zaman çizelgesi: ne zaman ne görüldü, ne yapıldı.

### Önce hafiflet, sonra teşhis et

Olay anındaki amaç **kullanıcı etkisini en hızlı şekilde durdurmaktır**, kök nedeni bulmak değil. Kök neden sonra bulunur.

Hızlı hafifletme seçenekleri:

- **Son dağıtımı geri al.** Olayların büyük kısmı bir değişiklikten sonra başlar. "Ne değişti?" ilk sorudur.
- **Feature flag'i kapat.**
- **Ölçekle:** daha fazla örnek, daha büyük veritabanı.
- **Trafiği yönlendir:** sağlıklı bölgeye ya da örneğe.
- **Yükü azalt:** önemsiz işleri durdur, hız sınırını sıkılaştır, düşük öncelikli özellikleri kapat (graceful degradation).
- **Bağımlılığı devre dışı bırak:** çöken öneri servisini atla, ödeme yine çalışsın.

### İletişim

- Ortak bir olay kanalı açın. Herkes orada konuşsun.
- Düzenli aralıklarla (ör. SEV1 için 30 dakikada bir) durum güncellemesi: ne biliyoruz, ne yapıyoruz, bir sonraki güncelleme ne zaman. "Henüz bilmiyoruz" da geçerli bir güncellemedir. Sessizlik değildir.
- Varsayımları değil gözlemleri yazın.

## Runbook

Belirli bir alarm ya da durum için adım adım müdahale belgesi:

```markdown
# Alarm: orders-api yüksek 5xx oranı

## Etki
Müşteriler sipariş oluşturamıyor olabilir.

## İlk kontroller
1. Panoda hata hangi uç noktada? (link)
2. Son 1 saatte dağıtım var mı? `kubectl rollout history deploy/orders-api`
3. Veritabanı bağlantı havuzu doygun mu? (link: DB panosu)
4. Ödeme sağlayıcısının durum sayfası (link)

## Hafifletme
- Son dağıtımdan sonra başladıysa: `kubectl rollout undo deploy/orders-api`
- Ödeme sağlayıcısı kaynaklıysa: `payments.fallback` bayrağını aç

## Kime ulaşılır
- Ödeme ekibi: #payments-oncall
```

Runbook'lar her olaydan sonra güncellenir. En iyi runbook adımları zamanla **otomasyona** dönüşür.

## Olaydan sonra: postmortem

Her önemli olaydan sonra yazılı bir postmortem yapılır. Amacı suçlu bulmak değil, **sistemi** iyileştirmektir.

### Suçlamasız (blameless) kültür

İnsanlar o anda ellerindeki bilgiyle makul görünen kararları verir. "Bir geliştirici yanlış komutu çalıştırdı" bir kök neden değildir. Asıl sorular şunlardır: Neden yanlış komutu çalıştırmak bu kadar kolaydı? Neden bir onay adımı yoktu? Neden hata üretimde fark edilmeden önce staging'de yakalanmadı?

Suçlama olan yerde insanlar hatalarını gizler ve organizasyon öğrenemez.

### Kök neden analizi: beş neden

```text
Sorun: Sipariş servisi 40 dakika boyunca hata verdi.
1. Neden? Veritabanı bağlantı havuzu tükendi.
2. Neden? Yeni rapor uç noktası her istekte uzun süren bir sorgu çalıştırdı ve bağlantıları tuttu.
3. Neden? Sorgu büyük müşterilerde tam tablo taraması yapıyordu.
4. Neden? Testler yalnızca küçük veri kümesiyle çalışıyordu ve eksik indeks fark edilmedi.
5. Neden? Staging ortamında üretime benzer veri hacmi yok.
```

Gerçek olaylarda genellikle tek bir kök neden değil, **katkıda bulunan birden fazla etken** vardır. Beş neden, bunları bulmak için bir başlangıç aracıdır.

### Postmortem belgesi

- **Özet:** ne oldu, ne kadar sürdü, kaç kullanıcı ve ne kadar gelir etkilendi.
- **Zaman çizelgesi:** ilk belirti, fark edilme, müdahale adımları, hafifletme, çözüm. Fark etme ve hafifletme süreleri ayrıca ölçülür.
- **Kök neden ve katkıda bulunan etkenler.**
- **Ne iyi gitti, ne kötü gitti, nerede şanslıydık.**
- **Eylemler:** her birinin sahibi ve tarihi var. Örnek: rapor uç noktasına zaman aşımı ekle, bağlantı havuzu doygunluğu için alarm kur, staging'e anonimleştirilmiş üretim hacminde veri yükle, rapor sorgularını okuma kopyasına taşı.

Eylemleri takip edilmeyen postmortem bir ritüelden ibarettir. Aynı olayın tekrarlanması, eylemlerin kapanmadığının işaretidir.

## Mülakatta sorulur

- **"SLO ve hata bütçesi nedir?"** SLO kullanıcı deneyimi için iç hedeftir. Hata bütçesi hedefin izin verdiği başarısızlık miktarıdır. Bütçe hız ile güvenilirlik arasındaki dengeyi yönetir.
- **"İyi bir alarm nasıl olur?"** Kullanıcı etkisine (belirtiye) dayanır, eyleme dönüştürülebilir ve bir runbook'a bağlıdır.
- **"Gece 3'te alarm geldi. İlk ne yaparsın?"** Etkiyi ve kapsamı anlarım, "ne değişti?" diye bakarım ve önce hafifletirim: genellikle geri alma ya da bayrağı kapatma. Gerekirse yardım çağırırım ve durumu duyururum.
- **"Postmortem neden suçlamasız olmalı?"** İnsanlar hatalarını gizlemesin ve sistemdeki zayıflıklar ortaya çıksın diye. Soru "kim" değil, "sistem bunu neden mümkün kıldı?".
- **"Üretimde çözdüğün bir sorunu anlat."** STAR ile: belirti, teşhis adımları, hafifletme, kalıcı çözüm ve sonrasında yapılan iyileştirmeler.

## Özet

- SLI kullanıcı deneyimini ölçer, SLO onun hedefidir, hata bütçesi hız ile güvenilirlik arasındaki dengeyi yönetir.
- Alarmlar belirtiye dayanır, eyleme dönüştürülebilir ve bir runbook'a bağlıdır. Alarm yorgunluğu gerçek bir risktir.
- Olay anında önce hafifletilir (geri alma, bayrak, ölçekleme), sonra teşhis edilir. Roller ayrılır, iletişim düzenlidir.
- Runbook'lar her olaydan sonra güncellenir ve zamanla otomasyona dönüşür.
- Postmortem suçlamasızdır, katkıda bulunan etkenleri bulur ve sahibi ve tarihi belli eylemlerle biter.
