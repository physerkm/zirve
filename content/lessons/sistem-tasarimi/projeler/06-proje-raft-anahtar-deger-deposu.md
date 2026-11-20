---
title: "Proje 5: Raft ile Kopyalanan Anahtar–Değer Deposu"
summary: Dağıtık sistemlerin zirvesi. Raft'ı sıfırdan yaz; lider seçimi, günlük kopyalama, kalıcılık ve anlık görüntü. Üstüne doğrusallaştırılabilir bir anahtar–değer deposu kur ve ağ bölünmesi, gecikme ve çökme altında doğruluğunu test et.
minutes: 35
level: advanced
---

Bu, modülün en zor ve en ödüllendirici projesidir. Raft makalesini okumak bir öğleden sonra sürer; doğru çalışan bir Raft yazmak haftalar. Aradaki fark, dağıtık sistemlerin gerçek zorluğudur: her satır kod doğru görünür, ama milyonda bir gerçekleşen bir mesaj sırası her şeyi bozar.

Bu projeyi tamamlayan biri; etcd, Consul, CockroachDB, TiKV, Kafka KRaft ve MongoDB'nin kopyalama katmanlarının nasıl çalıştığını gerçekten anlar ve mülakatta "lider seçimi nasıl yapılır?" sorusuna sıradan bir adayın veremeyeceği derinlikte yanıt verir.

## Hazırlık

1. [Raft makalesinin genişletilmiş sürümünü](https://raft.github.io/raft.pdf) oku, özellikle **Şekil 2**'yi. Şekil 2, Raft'ın neredeyse tam bir tanımıdır; kodunu yazarken her kuralı birebir uygula. "Bu kural gereksiz görünüyor" dediğin her yer, ileride bulacağın bir hatadır.
2. [Raft görselleştirmesi](https://raft.github.io/) ve [The Secret Lives of Data](https://thesecretlivesofdata.com/raft/) ile algoritmayı izle.
3. [Tutarlılık, Uzlaşma ve Dağıtık İşlemler](/tracks/sistem-tasarimi/tutarlilik-uzlasma-ve-dagitik-islemler) dersini tekrar et.

## İki yol

**A. MIT 6.5840 laboratuvarları (önerilen).** [Ders sitesindeki](https://pdos.csail.mit.edu/6.824/) Lab 3 (Raft) ve Lab 4 (Raft üzerinde KV) Go ile yazılır ve yüzlerce senaryoyu (bölünme, güvenilmez ağ, çökme, yeniden başlama) deneyen otomatik testlerle gelir. Testlerin kalitesi rakipsizdir; tek başına çalışırken en büyük eksik olan "doğru mu yazdım?" sorusunu yanıtlar.

**B. Kendi dilinde, kendi test düzeneğinle.** C# ya da TypeScript ile yazmak istersen aşağıdaki aşamaları izle. Asıl iş, ağı ve zamanı kontrol edebildiğin bir **benzetim düzeneği** kurmaktır: düğümler gerçek ağ yerine bir benzetim ağı üzerinden konuşur; bu ağ mesajları geciktirebilir, kaybedebilir, çoğaltabilir, sırasını değiştirebilir ve düğümleri bölebilir.

## Aşama 1: lider seçimi

Her düğüm şunları tutar: `currentTerm`, `votedFor`, `log[]`, rol (takipçi/aday/lider).

- Takipçi, **rastgele** bir seçim zaman aşımı (ör. 150–300 ms) boyunca liderden kalp atışı almazsa aday olur: dönemi artırır, kendine oy verir, diğerlerine `RequestVote` gönderir.
- Bir düğüm bir dönemde **en fazla bir** adaya oy verir ve yalnızca adayın günlüğü kendisininki kadar **güncelse** (son girdinin dönemi büyükse, eşitse günlük uzunluğu büyük ya da eşitse).
- Çoğunluğun oyunu alan lider olur ve hemen kalp atışı (boş `AppendEntries`) gönderir.
- Daha büyük dönemli herhangi bir mesaj gören düğüm, dönemini günceller ve takipçiye döner.

**Testler:**

- 3 düğüm başlat: tek bir lider seçiliyor mu?
- Lideri ağdan kopar: kalanlar yeni lider seçiyor mu? Eski lider geri gelince takipçiye dönüyor mu?
- Çoğunluğu kopar: hiçbir lider seçilmemeli (azınlık lider seçemez).
- Aynı dönemde **iki lider** olmadığını her adımda denetleyen bir değişmez yaz.

## Aşama 2: günlük kopyalama

- İstemci komutu lidere gelir; lider girdiyi `(term, komut)` olarak günlüğüne ekler ve `AppendEntries` ile takipçilere gönderir.
- Her `AppendEntries` önceki girdinin indeksini ve dönemini taşır; takipçi kendi günlüğünde bu girdi yoksa reddeder. Lider o takipçi için `nextIndex`'i geri alıp yeniden dener; böylece ayrışmış günlükler liderinkine **zorla** eşitlenir.
- Bir girdi, **lider kendi döneminden** olduğu sürece çoğunluğa kopyalanınca kesinleşir (commit). Eski dönemden kalan girdiler yalnızca dolaylı olarak kesinleşir (makaledeki Şekil 8 inceliği: bunu atlamak, en ünlü Raft hatasıdır).
- Kesinleşen girdiler sırayla **durum makinesine** uygulanır.

**Testler:**

- Normal durumda 1.000 komut: bütün düğümlerin uygulanmış komut dizisi aynı mı?
- Takipçiyi kopar, 100 komut gönder, geri bağla: yetişiyor mu?
- Lideri komut ortasında kopar, yeni lider seçilsin, eski lideri geri bağla: eski liderin kesinleşmemiş girdileri silinip yenileriyle değiştiriliyor mu?
- **Güvenilmez ağ:** mesajların %10'unu kaybet, %10'unu geciktir, sırasını karıştır. Değişmez: kesinleşmiş bir girdi hiçbir düğümde değişmez.

## Aşama 3: kalıcılık

`currentTerm`, `votedFor` ve `log[]` her değişiklikte, **yanıt göndermeden önce** diske yazılmalı. Neden? Bir düğüm oy verip çöküp yeniden başlarsa ve oyunu unutursa, aynı dönemde ikinci bir adaya oy verebilir: iki lider.

**Test:** düğümleri rastgele anlarda çökert ve yeniden başlat (diskteki durumla). Bütün değişmezler tutmaya devam etmeli.

## Aşama 4: anlık görüntü (snapshot)

Günlük sonsuza kadar büyüyemez. Durum makinesi belirli aralıklarla anlık görüntüsünü alır ve o noktaya kadarki girdiler silinir. Çok geride kalan (ya da yeni katılan) takipçiye lider `InstallSnapshot` ile anlık görüntüyü gönderir. İndeks hesapları artık günlüğün başından değil, anlık görüntünün bittiği yerden yapılır; hataların çoğu buradan çıkar.

## Aşama 5: anahtar–değer servisi

Raft'ın üstüne `Get`, `Put`, `Append` sunan bir servis kur:

- İstemci isteği lidere gider; lider değilse istemciyi lidere yönlendirir.
- Her işlem Raft günlüğüne girer ve kesinleşince uygulanır. **Okumalar da** günlükten geçer (ya da lider, okumadan önce hâlâ lider olduğunu çoğunluktan bir kalp atışı turuyla doğrular: *read index*). Aksi halde bölünmüş eski bir lider bayat veri döndürebilir ve doğrusallaştırılabilirlik bozulur.
- **Tam bir kez semantiği:** istemci her isteğe `(clientId, seq)` ekler; servis istemci başına son uygulanan `seq`'i durum makinesinde saklar. Zaman aşımından sonra yeniden gönderilen `Append` iki kez uygulanmaz.

## Aşama 6: doğrusallaştırılabilirliği denetle

Testin sonunda bütün istemci işlemlerinin geçmişini (başlangıç zamanı, bitiş zamanı, girdi, çıktı) kaydet ve bir **doğrusallaştırılabilirlik denetleyicisinden** geçir: [Porcupine](https://github.com/anishathalye/porcupine) (Go, MIT laboratuvarlarının kullandığı) ya da Jepsen'in [Knossos/Elle](https://github.com/jepsen-io/elle) araçları. Denetleyici, geçmişin tek bir kopyalı sistemde gerçekleşebilecek bir sıraya sahip olup olmadığını söyler. Gecikme, bölünme ve çökmeler altında bu denetim **yüzlerce kez** geçmeli.

## Hata ayıklama ipuçları

- Her düğüm için yapılandırılmış günlük: `[t=1234ms] [S2] [term 5] [Lider] AppendEntries -> S3 prevIndex=41 entries=3`. Hataları günlükten zaman çizelgesi çıkararak bulursun.
- Testleri tek seferde değil, **döngüde** çalıştır (ör. 500 kez); dağıtık hatalar nadiren ortaya çıkar. Başarısız koşunun tohum (seed) değeriyle tekrar üretebilmek için benzetimi belirlenimci yap.
- Kilitleri tutarken ağ çağrısı yapma ve kanal beklemede kilit tutma; kilitlenmelerin (deadlock) büyük kısmı buradan çıkar.

## Bonus görevler

- **Üyelik değişikliği:** kümeye çalışırken düğüm ekle/çıkar (tek düğüm değişikliği yöntemi).
- **Parçalı depo:** anahtar aralıklarını birden çok Raft grubuna böl ve aralıkları gruplar arasında taşı (MIT Lab 5; PingCAP TinyKV'nin konusu).
- **Performans:** toplu gönderme (batching) ve boru hattı ile iş hacmini artır; gecikme–iş hacmi grafiği çiz.
- Raft yerine **Gossip Glomers'ın Kafka-Style Log** bulmacasını, ya da aynı servisi Maelstrom'un `lin-kv` iş yükü ile test et.

## Teslim ölçütleri

- [ ] Lider seçimi, kopyalama, kalıcılık ve anlık görüntü testleri; güvenilmez ağ altında 500 ardışık başarılı koşu.
- [ ] Doğrusallaştırılabilirlik denetleyicisinden geçen KV servisi.
- [ ] Bulduğun en zor hatanın hikâyesi: belirti, sebep, çözüm. (Mülakatta "en zor hata ayıklama deneyimin" sorusunun yanıtı.)
