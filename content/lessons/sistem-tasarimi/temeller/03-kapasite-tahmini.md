---
title: Kapasite Tahmini ve Bilinmesi Gereken Sayılar
summary: Zarf arkası hesap. İkinin kuvvetleri, gecikme sayıları, tek bir makinenin gerçek kapasitesi ve QPS, depolama, bant genişliği, bellek ile sunucu sayısını birkaç dakikada tahmin etme.
minutes: 20
level: intermediate
---

Kapasite tahmininin (back-of-the-envelope) amacı doğru sayıyı bulmak değil, **doğru kararı vermektir**: tek veritabanı yeter mi, önbellek şart mı, veriyi parçalamak gerekir mi, kaç sunucu lazım? Bir hesap bu sorulardan birini yanıtlamıyorsa yapmayın.

Bu ders, mülakatta ezberden kullanabileceğiniz sayıları ve hızlı hesap yöntemini verir.

## Hesap yöntemi: yuvarla, üsle çalış

- Sayıları **10'un kuvvetine** yuvarlayın: 86.400 saniye → 10⁵, 2,6 milyon saniyelik ay → 2,5 × 10⁶.
- Çarpma ve bölmeyi üslerle yapın: 10⁸ istek / 10⁵ saniye = 10³ istek/saniye.
- Varsayımlarınızı **yüksek sesle** söyleyin ve yazın; görüşmeci farklı bir sayı verirse sonucu hızla güncelleyebilirsiniz.
- Sonucu bir karara bağlayın: "~1.000 QPS; bunu iki üç sunucu ve tek bir PostgreSQL karşılar."

## İkinin kuvvetleri ve birimler

| Kuvvet | Yaklaşık | Ad |
| --- | --- | --- |
| 2¹⁰ | 1 bin | 1 KB |
| 2²⁰ | 1 milyon | 1 MB |
| 2³⁰ | 1 milyar | 1 GB |
| 2⁴⁰ | 1 trilyon | 1 TB |
| 2⁵⁰ | 1 katrilyon | 1 PB |

Veri tipi boyutları: `int` 4 bayt, `long` / zaman damgası 8 bayt, UUID 16 bayt, ASCII karakter 1 bayt (UTF-8'de Türkçe karakterler 2 bayt). Tipik bir JSON kaydı birkaç yüz bayttan birkaç KB'a kadardır; bir küçük resim ~100 KB–1 MB, bir dakikalık HD video ~50–100 MB.

## Zaman

| | Değer | Kısayol |
| --- | --- | --- |
| Bir gündeki saniye | 86.400 | ≈ 10⁵ |
| Bir aydaki saniye | ~2,6 milyon | ≈ 2,5 × 10⁶ |
| Bir yıldaki saniye | ~31,5 milyon | ≈ 3 × 10⁷ |
| Günde 1 milyon istek | ~12 / saniye | |
| Ayda 1 milyar istek | ~400 / saniye | |

## Gecikme sayıları

Jeff Dean'in yaygınlaştırdığı tablonun güncel bir yorumu. Mutlak değerler donanımla değişir; önemli olan **aradaki mertebe farklarıdır**.

| İşlem | Süre | Ne anlama gelir |
| --- | --- | --- |
| L1 önbellek erişimi | ~1 ns | |
| Dal tahmini hatası | ~3 ns | |
| L2 önbellek erişimi | ~4 ns | |
| Mutex kilitle/aç | ~20 ns | |
| Ana bellekten okuma | ~100 ns | L1'den ~100 kat yavaş |
| 1 KB'ı sıkıştırma (hızlı algoritma) | ~2 µs | |
| 1 MB'ı bellekten sırayla okuma | ~3 µs | |
| SSD'den rastgele 4 KB okuma | ~20–100 µs | Bellekten ~1.000 kat yavaş |
| Aynı veri merkezinde gidiş dönüş | ~500 µs | |
| 1 MB'ı SSD'den sırayla okuma | ~50 µs–1 ms | |
| Diskte (HDD) arama | ~2–10 ms | |
| Redis'ten bir anahtar okuma (ağ dahil) | ~0,5–1 ms | |
| İndeksli basit SQL sorgusu | ~1–5 ms | |
| Aynı kıtada gidiş dönüş | ~20–40 ms | |
| Kıtalar arası gidiş dönüş | ~150 ms | Işık hızı sınırı; optimize edilemez |

Çıkarımlar:

- **Bellek hızlı, disk yavaş, ağ daha da yavaş.** Bir isteğin süresine en çok ağ gidiş dönüşleri ve disk erişimleri yön verir.
- Sıralı okuma rastgele okumadan çok daha hızlıdır; bu yüzden günlük (log) yapılı depolar, Kafka ve LSM ağaçları yazmaları sıralı yapar.
- Aynı veri merkezi içindeki bir ağ çağrısı ~0,5 ms'dir; bir isteğin içinde 50 servis çağrısını **sırayla** yapmak tek başına 25 ms ekler. Çağrıları paralelleştirin ya da azaltın.
- Kıtalar arası gecikme fizik kuralıdır. Küresel kullanıcıya düşük gecikme gerekiyorsa veriyi kullanıcıya yaklaştırırsınız: CDN, bölgesel kopyalar, kenar (edge) önbelleği.

## Tek bir makine ne kadar iş yapar

Mülakatlarda en sık yapılan hata, tek bir makinenin kapasitesini **küçümsemektir**. Günümüzün sıradan bir sunucusu:

| Bileşen | Kabaca kapasite |
| --- | --- |
| Uygulama sunucusu (basit JSON API) | birkaç bin – onlarca bin istek/saniye |
| PostgreSQL / MySQL (tek düğüm, indeksli okuma) | ~10.000 – 50.000 sorgu/saniye |
| PostgreSQL / MySQL (yazma) | ~birkaç bin – 10.000+ işlem/saniye |
| Redis (tek düğüm) | ~100.000+ işlem/saniye, gecikme < 1 ms |
| Kafka (tek broker) | yüz binlerce – milyon mesaj/saniye |
| Sunucu belleği | 64 GB – 1 TB+ |
| Tek makine SSD | birkaç TB – onlarca TB |
| Ağ kartı | 10 – 100 Gbit/s |

Bu sayılar şunu söyler: saniyede birkaç bin isteğe kadar çoğu sistem **tek bir iyi yapılandırılmış veritabanıyla** çalışır. Parçalama, onlarca TB veri ya da on binlerce yazma/saniye gibi gerçek bir zorunluluk doğduğunda gündeme gelir.

## Dört temel hesap

### 1. İstek hızı (QPS)

```text
ortalama QPS = günlük etkin kullanıcı × kullanıcı başına günlük işlem / 10⁵
zirve QPS    = ortalama QPS × (2 … 10)
```

Okuma ve yazmayı ayrı hesaplayın; okuma/yazma oranı önbellek ve kopya kararını belirler.

### 2. Depolama

```text
günlük depolama = günlük yeni kayıt × kayıt boyutu
toplam          = günlük × 365 × saklama yılı × kopya sayısı (genellikle 3)
```

Medyayı (görsel, video) meta veriden **ayrı** hesaplayın: meta veri veritabanına, medya nesne deposuna gider ve büyüklük mertebeleri çok farklıdır.

### 3. Bant genişliği

```text
giriş  = yazma QPS × ortalama istek boyutu
çıkış  = okuma QPS × ortalama yanıt boyutu
```

Video ve görsel servislerinde çıkış bant genişliği maliyetin büyük kısmıdır; CDN kararı buradan çıkar.

### 4. Bellek (önbellek)

80/20 kuralı: isteklerin ~%80'i verinin ~%20'sine gider. Günlük okunan verinin %20'sini önbelleğe almak çoğu zaman iyi bir başlangıçtır.

```text
önbellek boyutu ≈ günlük okuma × yanıt boyutu × 0,2
```

## Uygulamalı örnek: fotoğraf paylaşım uygulaması

Varsayımlar: 500 milyon günlük etkin kullanıcı, kullanıcı başına günde 0,2 fotoğraf yükleme ve 30 fotoğraf görüntüleme. Fotoğraf ortalama 500 KB (farklı boyutlarıyla birlikte), meta veri 1 KB.

**QPS:**

- Yükleme: 500 × 10⁶ × 0,2 = 10⁸ / gün → 10⁸ / 10⁵ = **~1.000 / saniye**, zirvede ~3.000.
- Görüntüleme: 500 × 10⁶ × 30 = 1,5 × 10¹⁰ / gün → **~150.000 / saniye**, zirvede ~500.000.
- Okuma/yazma oranı 150:1. **Sonuç:** okuma yolu her şeydir; CDN ve önbellek zorunlu.

**Depolama:**

- Medya: 10⁸ × 500 KB = 5 × 10¹³ bayt = **50 TB / gün** → yılda ~18 PB. **Sonuç:** nesne deposu (S3 benzeri), veritabanı değil.
- Meta veri: 10⁸ × 1 KB = 100 GB / gün → yılda ~36 TB. **Sonuç:** birkaç yıl içinde tek makineye sığmaz; meta veri parçalanacak.

**Bant genişliği:**

- Çıkış: 150.000 × 500 KB = 75 GB/s ≈ 600 Gbit/s. **Sonuç:** kaynak sunucudan verilemez; trafiğin büyük kısmını CDN karşılamalı.

**Önbellek:** meta veri okuması 150.000 / saniye × 1 KB × 10⁵ saniye × 0,2 ≈ 3 TB. **Sonuç:** dağıtık önbellek kümesi (ör. onlarca Redis düğümü).

Beş dakikalık bu hesap, tasarımın iskeletini çıkardı: nesne deposu + CDN, parçalanmış meta veri veritabanı, dağıtık önbellek, okuma ve yazma yollarının ayrılması.

## Sunucu sayısını tahmin etmek

```text
sunucu sayısı = zirve QPS / tek sunucunun kaldırdığı QPS × güvenlik payı (~1,5–2)
```

150.000 zirve QPS'yi saniyede 5.000 istek karşılayan sunucularla karşılamak için 30 sunucu, güvenlik payıyla ~50–60 sunucu gerekir. Bu sayı tasarımı değiştirmez; bu yüzden mülakatta çoğu zaman tek cümleyle geçilir.

## Erişilebilirlik bütçesi

| Hedef | Yıllık kesinti | Aylık kesinti |
| --- | --- | --- |
| %99 | ~3,65 gün | ~7,3 saat |
| %99,9 | ~8,8 saat | ~44 dakika |
| %99,99 | ~53 dakika | ~4,4 dakika |
| %99,999 | ~5,3 dakika | ~26 saniye |

Seri bağımlılıklarda erişilebilirlik çarpılır (0,999³ ≈ 0,997), paralel yedeklerde ise başarısızlık olasılıkları çarpılır: her biri %99 erişilebilir iki bağımsız kopyadan en az birinin ayakta olma olasılığı 1 − 0,01² = %99,99'dur.

## Sık yapılan hatalar

- **Tasarımı etkilemeyen hesaplara dakikalar harcamak.** Sayıyı hesaplayın, kararı söyleyin, ilerleyin.
- **Zirveyi unutmak.** Ortalama yükle boyutlandırılan sistem, ilk kampanya gününde çöker.
- **Kopyaları ve indeksleri unutmak.** Ham veri × 3 kopya × indeks ek yükü gerçek depolamadır.
- **Tek makineyi küçümsemek.** 500 QPS için parçalama önermek, sayıları bilmediğinizi gösterir.
- **Birimleri karıştırmak.** Bit/bayt (Gbit/s ↔ GB/s, 8 kat) ve KB/MB hatası tasarımı bir mertebe kaydırır.

## Özet

- 1 gün ≈ 10⁵ saniye; günde 1 milyon istek ≈ 12 QPS.
- Bellek ~100 ns, SSD ~100 µs, veri merkezi içi gidiş dönüş ~0,5 ms, kıtalar arası ~150 ms.
- Tek bir veritabanı on binlerce okuma/saniye kaldırır; Redis yüz binlerce.
- QPS, depolama, bant genişliği ve bellek: dört hesap, her biri bir karara bağlanır.

**Daha fazlası:** [Colin Scott'ın yıllara göre değişen etkileşimli gecikme tablosu](https://colin-scott.github.io/personal_website/research/interactive_latency.html) ve System Design Primer'ın [zarf arkası hesap bölümü](https://github.com/donnemartin/system-design-primer#appendix).
