---
title: SQL Server ve T-SQL
summary: PostgreSQL bilen biri için SQL Server, sözdizimi farkları, clustered ve nonclustered indeksler, INCLUDE kolonları, kilit tabanlı eşzamanlılık ve RCSI, NOLOCK tehlikesi, stored procedure, parameter sniffing, execution plan okuma ve temp tablolar.
minutes: 24
level: intermediate
---

Türkiye'deki .NET ilanlarının büyük çoğunluğu **MSSQL** ister: 18 ilanın 9'unda geçer, çoğu zaman PostgreSQL'in önünde. Bankacılık, sigorta, lojistik ve kurumsal yazılımların önemli kısmı SQL Server üzerinde çalışır. Zirve'nin veritabanı dersleri PostgreSQL ile anlatıldı. Bu ders aynı kavramların SQL Server'daki karşılıklarını ve SQL Server'a özgü, mülakatta sorulan konuları anlatır.

## Sözdizimi farkları

| Konu | PostgreSQL | SQL Server (T-SQL) |
| --- | --- | --- |
| İlk N satır | `LIMIT 10` | `SELECT TOP (10) ...` |
| Sayfalama | `LIMIT 20 OFFSET 40` | `ORDER BY ... OFFSET 40 ROWS FETCH NEXT 20 ROWS ONLY` |
| Otomatik artan | `GENERATED ALWAYS AS IDENTITY` | `INT IDENTITY(1,1)` |
| Unicode metin | `text`, `varchar` (her zaman Unicode) | `NVARCHAR(n)`. `VARCHAR` tek bayt kod sayfasıdır (Türkçe karakterler için `NVARCHAR` ya da UTF-8 collation) |
| Sınırsız metin | `text` | `NVARCHAR(MAX)` |
| Tarih-saat | `timestamptz` | `DATETIME2`, saat dilimli `DATETIMEOFFSET` (`DATETIME` eski, kullanmayın) |
| Mantıksal | `boolean` | `BIT` |
| GUID | `uuid` | `UNIQUEIDENTIFIER` |
| Eklenen satırı döndürme | `RETURNING id` | `OUTPUT INSERTED.Id` |
| Tanımlayıcı tırnağı | `"Orders"` | `[Orders]` |
| Dizgi birleştirme | `\|\|` | `+` ya da `CONCAT()` |
| Upsert | `INSERT ... ON CONFLICT DO UPDATE` | `MERGE` ya da kilit ipuçlu `UPDATE` + `INSERT` |
| Büyük/küçük harf duyarlılığı | Varsayılan duyarlı | **Collation'a bağlı**, varsayılan genellikle duyarsız (`CI`) |

```sql
SELECT o.Id, o.Total, c.Name
FROM dbo.Orders AS o
JOIN dbo.Customers AS c ON c.Id = o.CustomerId
WHERE o.Status = N'Paid'
ORDER BY o.CreatedAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;
```

`N'...'` öneki dizgiyi Unicode (`NVARCHAR`) yapar. `NVARCHAR` bir kolonu `VARCHAR` bir parametreyle karşılaştırmak (ya da tersi) **örtük dönüşüme** ve indeksin kullanılamamasına yol açabilir. EF Core ve Dapper'da parametre tiplerinin kolon tipleriyle eşleşmesi bu yüzden önemlidir.

## Clustered ve nonclustered indeksler

SQL Server'ın en önemli farkı budur ve mülakatta kesin sorulur.

- **Clustered index:** tablonun **kendisidir**. Satırlar fiziksel olarak bu anahtara göre sıralı bir B-ağacında durur. Tablo başına **bir** tane olabilir. Varsayılan olarak birincil anahtar clustered olur.
- **Nonclustered index:** ayrı bir B-ağacıdır. Yaprak düğümlerinde indeks kolonları ve satırı bulmak için **clustered anahtar** bulunur.

```mermaid
flowchart LR
    Q["WHERE Email = 'ada@...'"] --> NC[Nonclustered indeks: Email]
    NC -->|Clustered anahtar: Id=8412| CI[Clustered indeks: Id]
    CI --> R[Satırın bütün kolonları]
```

Nonclustered indeksten bulunan her satır için clustered indekse dönüp diğer kolonları getirmeye **key lookup** denir. Çok satır dönen sorgularda bu pahalıdır ve optimizer indeksi hiç kullanmayıp tabloyu taramayı seçebilir.

Çözüm, **kapsayan indeks** (covering index):

```sql
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Date
ON dbo.Orders (CustomerId, CreatedAt DESC)
INCLUDE (Total, Status);       -- yaprakta saklanır, sıralamaya katılmaz
```

Sorgu yalnızca `CustomerId`, `CreatedAt`, `Total` ve `Status` istiyorsa her şey indekste bulunur ve key lookup olmaz. PostgreSQL 11'den beri `INCLUDE` destekler, ama orada tablo heap'tir ve clustered indeks kavramı yoktur. Kavram aynı, gerekçe farklıdır.

### Clustered anahtar seçimi

İyi bir clustered anahtar **dar, benzersiz, değişmeyen ve sürekli artan** olmalıdır:

- **Dar:** her nonclustered indeks clustered anahtarı taşır. Geniş anahtar bütün indeksleri büyütür.
- **Sürekli artan:** yeni satırlar sona eklenir.
- **Rastgele GUID** (`NEWID()`) clustered anahtar olursa her ekleme B-ağacının rastgele bir sayfasına gider: **sayfa bölünmeleri** ve parçalanma. Çözümler: `NEWSEQUENTIALID()`, uygulamada SQL Server'ın sıralamasına uygun sıralı GUID üretmek (EF Core'un sıralı GUID üreteci gibi; dikkat: .NET 9'daki `Guid.CreateVersion7()` zaman sıralıdır ama SQL Server `uniqueidentifier` değerlerini son baytlardan başlayarak karşılaştırdığı için orada sıralı davranmaz) ya da `BIGINT IDENTITY` clustered anahtar ve GUID ayrı bir benzersiz kolon.

## Eşzamanlılık: kilitler ve satır sürümleme

PostgreSQL **MVCC** kullanır: okuyucular yazıcıları, yazıcılar okuyucuları beklemez. SQL Server'ın varsayılanı ise **kilit tabanlıdır**: varsayılan `READ COMMITTED` seviyesinde okuma, yazılmakta olan satır üzerindeki kilidin bırakılmasını bekler. Yoğun sistemlerde bu, okuma–yazma engellemesine (blocking) ve kilitlenmelere (deadlock) yol açar.

Çözüm, satır sürümlemeyi açmaktır:

```sql
ALTER DATABASE Orders SET READ_COMMITTED_SNAPSHOT ON;
```

**RCSI** (Read Committed Snapshot Isolation) açıkken okuyucular kilit beklemez, son commit edilmiş sürümü `tempdb`'deki sürüm deposundan okur. PostgreSQL'e benzer davranış elde edilir. Azure SQL Database'de varsayılan olarak açıktır. Ayrıca `SNAPSHOT` izolasyon seviyesi transaction boyunca tutarlı bir görüntü verir.

### NOLOCK tuzağı

```sql
SELECT * FROM dbo.Orders WITH (NOLOCK) WHERE ...
```

Eski kod tabanlarında yaygındır ve "performans ipucu" sanılır. Aslında `READ UNCOMMITTED` demektir: **commit edilmemiş** (geri alınabilecek) veriyi okur, sayfa bölünmeleri sırasında aynı satırı iki kez okuyabilir ya da hiç okumayabilir. Finansal raporda yanlış toplam üretir. Engelleme sorununun doğru çözümü RCSI'dır. Mülakatta "NOLOCK kullanır mısın?" sorusunun beklenen cevabı bu açıklamadır.

### Kilit yükseltme ve deadlock

SQL Server çok sayıda satır kilidini (varsayılan eşik yaklaşık 5000) tek bir **tablo kilidine yükseltebilir** (lock escalation). Büyük bir toplu güncelleme bütün tabloyu kilitleyebilir. Toplu işleri küçük parçalara (batch) bölmek bunu önler.

Deadlock olduğunda SQL Server kurbanlardan birini seçip transaction'ını geri alır (hata 1205). Uygulama bu hatayı **yeniden denenebilir** olarak ele almalıdır. EF Core'un `EnableRetryOnFailure` ayarı bunu yapar. Kalıcı çözüm, transaction'ları kısa tutmak ve tablolara her yerde aynı sırayla erişmektir.

## Stored procedure

```sql
CREATE OR ALTER PROCEDURE dbo.GetCustomerOrders
    @CustomerId INT,
    @Since DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Total, Status, CreatedAt
    FROM dbo.Orders
    WHERE CustomerId = @CustomerId AND CreatedAt >= @Since
    ORDER BY CreatedAt DESC;
END
```

```csharp
var orders = await connection.QueryAsync<OrderRow>(
    "dbo.GetCustomerOrders", new { CustomerId = 7, Since = since }, commandType: CommandType.StoredProcedure);
// EF Core: db.Database.SqlQuery<OrderRow>($"EXEC dbo.GetCustomerOrders {customerId}, {since}")
```

| Artısı | Eksisi |
| --- | --- |
| Veriye yakın, ağ gidiş-dönüşü az | İş mantığı iki yere bölünür, test etmek zor |
| Yetki: kullanıcıya tablo değil yalnızca prosedür yetkisi verilebilir | Sürümleme ve dağıtım uygulamadan ayrı yönetilmeli |
| DBA tarafından ayarlanabilir | Taşınabilirlik yok (veritabanına bağımlı) |

Modern uygulamalarda iş mantığı genellikle uygulama katmanında tutulur. Stored procedure'lar ağır toplu işler ve raporlar için kullanılır. Kurumsal ilanlarda eski sistemlerin bakımı için bilinmesi beklenir.

Hata yönetimi `TRY...CATCH` ile, transaction'lar `BEGIN TRAN ... COMMIT` ile yapılır. `SET XACT_ABORT ON` herhangi bir hatada transaction'ın tamamen geri alınmasını sağlar ve iyi bir varsayılandır.

## Parameter sniffing

SQL Server bir sorgu ya da prosedür ilk çalıştığında, **o ilk parametre değerine göre** bir plan derler ve önbelleğe alır. Sonraki çağrılar aynı planı kullanır.

Sorun: `CustomerId = 7` olan müşterinin 3 siparişi, `CustomerId = 1` olan kurumsal müşterinin 2 milyon siparişi var. İlk çağrı 7 ile gelirse indeks arama (seek) planı önbelleğe girer. 1 ile gelen çağrı aynı planla milyonlarca key lookup yapar ve dakikalar sürer. "Dün hızlıydı, bugün yavaş ve hiçbir şey değişmedi" şikâyetinin klasik sebebidir.

Çözümler:

- `OPTION (RECOMPILE)`: her çalıştırmada yeni plan. Derleme maliyeti ekler, sık çalışan sorgularda dikkatli kullanılır.
- `OPTION (OPTIMIZE FOR (@CustomerId UNKNOWN))`: ortalama dağılıma göre plan.
- **Query Store**: plan geçmişini saklar, regresyonu gösterir ve iyi bir planı zorlamayı (force) sağlar. SQL Server 2022'de *Parameter Sensitive Plan optimization* aynı sorgu için birden fazla plan saklayabilir.

## Execution plan okumak

SSMS'te "Include Actual Execution Plan" (`Ctrl+M`) ya da `SET STATISTICS IO, TIME ON`:

| Operatör | Anlamı |
| --- | --- |
| **Index Seek** | İndeksle doğrudan konumlanma. Genellikle iyi |
| **Index Scan / Clustered Index Scan** | Bütün indeksi ya da tabloyu tarama. Büyük tabloda genellikle kötü |
| **Key Lookup** | Nonclustered indeksten sonra eksik kolonlar için clustered indekse dönüş. Çoksa `INCLUDE` düşünün |
| **Nested Loops / Hash Match / Merge Join** | Join algoritmaları. Az satırda nested loops, büyük ve sırasız veride hash |
| **Sort** | Bellek ve `tempdb` tüketebilir. İndeks sıralı veri verebiliyorsa kaçınılabilir |

Bakılacak işaretler: **tahmini ile gerçek satır sayısı arasındaki büyük fark** (bayat istatistik ya da parameter sniffing), uyarı simgeleri (örtük dönüşüm, `tempdb`'ye taşan sıralama), `STATISTICS IO` çıktısındaki yüksek "logical reads".

**SARGable** (indeks kullanılabilir) koşullar yazın: `WHERE YEAR(CreatedAt) = 2026` indeksi kullanamaz. `WHERE CreatedAt >= '2026-01-01' AND CreatedAt < '2027-01-01'` kullanır. Kolonu bir fonksiyona sokmak indeks aramasını engeller. Bu kural PostgreSQL için de geçerlidir.

## Geçici veri: temp tablo, tablo değişkeni, CTE

| | `#TempTable` | `@TableVariable` | CTE (`WITH`) |
| --- | --- | --- | --- |
| Saklandığı yer | `tempdb` | `tempdb` | Saklanmaz, sorgunun parçası |
| İstatistik ve indeks | Var | Sınırlı | Yok |
| Uygun olduğu yer | Büyük ara sonuçlar, birden fazla kez kullanılan veri | Küçük kümeler | Okunabilirlik, özyineleme |

Uygulamadan çok sayıda satırı tek seferde göndermek için **table-valued parameter** (TVP) kullanılır. Binlerce ayrı `INSERT` yerine tek çağrı yapılır. Toplu yükleme için `SqlBulkCopy` en hızlı yoldur.

## Mülakatta sorulur

- **"Clustered ile nonclustered indeks farkı?"** Clustered tablonun kendisidir ve satırları sıralı tutar, tablo başına bir tanedir. Nonclustered ayrı bir yapıdır ve clustered anahtarı işaret eder.
- **"Key lookup nedir, nasıl giderilir?"** Nonclustered indeksten sonra eksik kolonlar için clustered indekse dönüş. `INCLUDE` ile kapsayan indeks.
- **"Clustered anahtar olarak GUID kullanmalı mı?"** Rastgele GUID parçalanma yaratır. Sıralı GUID ya da `BIGINT IDENTITY` tercih ederim.
- **"NOLOCK kullanır mısın?"** Hayır. Commit edilmemiş ve tutarsız veri okur. Engelleme sorununu RCSI ile çözerim.
- **"Prosedür bazen hızlı bazen çok yavaş. Neden?"** Büyük ihtimalle parameter sniffing. Query Store ile planları karşılaştırır, `RECOMPILE` ya da plan zorlama düşünürüm.
- **"`WHERE YEAR(Tarih) = 2026` neden yavaş?"** SARGable değil. Kolonu fonksiyona soktuğu için indeks kullanılamaz. Aralık koşulu yazarım.

## Özet

- Sözdizimi farkları küçüktür: `TOP`, `OFFSET/FETCH`, `IDENTITY`, `NVARCHAR`, `OUTPUT`, collation.
- Clustered indeks tablonun kendisidir. Anahtarı dar, benzersiz, değişmez ve artan olmalıdır. Key lookup'ları `INCLUDE` ile giderin.
- Varsayılan kilit tabanlı okuma engellemeye yol açar. Çözüm RCSI'dır, NOLOCK değil.
- Stored procedure'ların yeri toplu işler ve raporlardır. `SET XACT_ABORT ON` ve `TRY...CATCH` kullanın.
- Parameter sniffing "bazen yavaş" sorunlarının klasik sebebidir. Execution plan'da tahmini ve gerçek satır farkına bakın, SARGable koşullar yazın.
