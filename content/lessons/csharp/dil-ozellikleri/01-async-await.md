---
title: async ve await
summary: Asenkron programlamanın C#'taki modeli. Task nedir, await ne yapar, thread ile farkı, sık yapılan hatalar (deadlock, async void, fire-and-forget) ve iptal.
minutes: 18
level: intermediate
---

`async`/`await`, C# mülakatlarında en çok derinleşilen konudur; çünkü kullanması kolay, yanlış anlaması daha da kolaydır. Temel yanılgı şudur: **`async` yeni bir thread başlatmaz.**

## Hangi sorunu çözer

Bir web sunucusu veritabanı yanıtını beklerken thread'i bloklarsa, o thread hiçbir iş yapmadan bekler. Bin eşzamanlı istek, bekleyen bin thread demektir; her biri bellek tüketir ve thread havuzu tükendiğinde yeni istekler kuyrukta bekler.

Asenkron kodda thread, G/Ç (I/O) beklenirken **havuza geri döner** ve başka bir isteğe hizmet eder. Yanıt geldiğinde iş, havuzdaki herhangi bir thread'de kaldığı yerden sürer. Amaç tek bir isteği hızlandırmak değil, **aynı donanımla daha çok eşzamanlı isteğe** hizmet etmektir (ölçeklenebilirlik). Masaüstü uygulamalarında amaç, arayüz thread'ini bloklamamaktır.

## Task ve await

`Task`, henüz tamamlanmamış olabilecek bir işlemi temsil eder (JavaScript'teki `Promise` karşılığı). `Task<T>` tamamlandığında bir değer üretir.

```csharp
public async Task<string> GetTitleAsync(string url, CancellationToken cancellationToken)
{
    using var client = new HttpClient();
    var html = await client.GetStringAsync(url, cancellationToken);   // thread burada serbest kalır
    return ExtractTitle(html);                                        // yanıt gelince devam eder
}
```

`await` şunu yapar:

1. Görev **zaten tamamlanmışsa** eşzamanlı olarak devam eder.
2. Tamamlanmamışsa metodun geri kalanını bir **devam** (continuation) olarak kaydeder ve denetimi çağırana döndürür. Thread bloklanmaz.
3. Görev bitince devam çalışır; bir istisna oluştuysa `await` satırında yeniden fırlatılır.

Derleyici `async` metodu bir **durum makinesine** dönüştürür: yerel değişkenler bir nesnenin alanları olur ve her `await` bir duraklama noktasıdır.

## G/Ç ile işlemci işi arasındaki fark

| | G/Ç'ye bağlı iş | İşlemciye bağlı iş |
| --- | --- | --- |
| Örnek | HTTP isteği, veritabanı sorgusu, dosya okuma | Görüntü işleme, büyük hesaplama |
| Beklerken thread | **Kullanılmaz** | Sürekli çalışır |
| Doğru araç | `await` ile gerçek asenkron API | `Task.Run` ile havuz thread'ine taşıma (arayüz uygulamalarında) |

G/Ç için `Task.Run(() => client.GetString(url))` yazmak yanlıştır: bloklayan çağrıyı başka bir thread'e taşır ama o thread yine bekler. ASP.NET Core'da işlemci işini `Task.Run` ile sarmak da yarar sağlamaz; zaten bir havuz thread'indesiniz.

## Sık yapılan hatalar

### 1. Asenkron kodu bloklamak: `.Result` ve `.Wait()`

```csharp
var title = GetTitleAsync(url, ct).Result;      // KAÇININ
```

Thread'i bloklar ve asenkron olmanın bütün yararını yok eder. Bir **eşitleme bağlamı** (SynchronizationContext) olan ortamlarda (WPF, WinForms, klasik ASP.NET) **deadlock**'a yol açar: bloklanan thread görevin bitmesini bekler; görevin devamı ise o thread'e dönmeyi bekler.

Kural: **baştan sona asenkron.** Bir metot `await` kullanıyorsa onu çağıran da `await` etmelidir. ASP.NET Core'da eşitleme bağlamı yoktur, bu yüzden klasik deadlock görülmez; ama bloklama yine thread havuzunu tüketir.

### 2. `async void`

```csharp
async void Process() { await DoWorkAsync(); }    // KAÇININ
```

Çağıran bu metodu `await` edemez ve bitip bitmediğini bilemez. İçinde fırlayan istisna yakalanamaz ve süreci çökertebilir. `async void` yalnızca **olay işleyicileri** içindir; onun dışında `async Task` döndürün.

### 3. Görevi beklemeyi unutmak (fire-and-forget)

```csharp
SaveAsync(order);            // await yok: hata sessizce kaybolur
```

Görev arka planda çalışır; istisnası gözlenmez ve istek bittikten sonra, kapsamı sona ermiş servisleri (ör. `DbContext`) kullanmaya çalışabilir. Gerçekten arka plan işi gerekiyorsa bir kuyruk ve `BackgroundService` kullanın.

### 4. Sırayla beklemek

Birbirinden bağımsız işlemleri art arda `await` etmek sürelerini **toplar**. Önce hepsini başlatın, sonra birlikte bekleyin:

```csharp
// Sırayla: ~süre(A) + süre(B)
var user = await GetUserAsync(id, ct);
var orders = await GetOrdersAsync(id, ct);

// Eşzamanlı: ~max(süre(A), süre(B))
var userTask = GetUserAsync(id, ct);
var ordersTask = GetOrdersAsync(id, ct);
await Task.WhenAll(userTask, ordersTask);
var (user2, orders2) = (userTask.Result, ordersTask.Result);   // tamamlandıkları için güvenli
```

Dikkat: EF Core'un `DbContext`'i thread güvenli değildir; aynı bağlam üzerinde iki sorguyu eşzamanlı çalıştıramazsınız.

### 5. Döngüde sınırsız eşzamanlılık

Bin öğe için bin isteği aynı anda başlatmak karşı servisi ya da kendi kaynaklarınızı boğar. `Parallel.ForEachAsync` ya da `SemaphoreSlim` ile eşzamanlılığı sınırlayın.

## İptal: CancellationToken

Kullanıcı sayfayı kapattığında sunucunun pahalı bir sorguyu sürdürmesi israftır. İptal **iş birliğine dayalıdır**: belirteci (token) aşağıya doğru her asenkron çağrıya geçirirsiniz.

```csharp
app.MapGet("/reports/{id}", async (int id, ReportService reports, CancellationToken cancellationToken) =>
    await reports.BuildAsync(id, cancellationToken));
```

ASP.NET Core, istemci bağlantıyı kopardığında bu belirteci iptal eder. İptal edilen işlem `OperationCanceledException` fırlatır; bu bir hata değil, beklenen bir sonuçtur.

## ConfigureAwait(false)

`await` varsayılan olarak, varsa, yakalanan eşitleme bağlamına geri döner (arayüz uygulamalarında arayüz thread'ine). `ConfigureAwait(false)` "bağlama dönmem gerekmiyor" der.

- **Kitaplık kodunda** kullanın: çağıranın bağlamını bilemezsiniz; deadlock riskini ve gereksiz geçişi önler.
- **ASP.NET Core uygulama kodunda** gerekmez: eşitleme bağlamı yoktur.
- **Arayüz kodunda** kullanmayın: `await`'ten sonra arayüz bileşenlerine dokunmanız gerekir.

## ValueTask

`Task` bir sınıftır; her asenkron çağrı bir bellek ayırma demektir. Sonucun çoğu zaman **eşzamanlı** hazır olduğu sıcak yollarda (ör. önbellekten okuma) `ValueTask<T>` bu ayırmayı önler. Kısıtları vardır: yalnızca **bir kez** beklenebilir. Ölçmeden kullanmayın; varsayılan `Task`'tır.

## Asenkron akışlar

Sonuçları tek tek, geldikçe işlemek için `IAsyncEnumerable<T>` ve `await foreach` kullanılır:

```csharp
await foreach (var row in ReadRowsAsync(cancellationToken))
{
    Process(row);
}
```

Bütün veriyi belleğe almadan büyük sonuç kümelerini işlemenin yoludur.

## Mülakatta sorulur

- **"async metot yeni thread açar mı?"** Hayır. Görev tamamlanana kadar thread serbest kalır; devam, havuzdaki bir thread'de (ya da eşitleme bağlamında) çalışır.
- **"`Task.Run` ile `await` farkı?"** `Task.Run` işi havuz thread'ine verir (işlemci işi için); `await` bir görevin sonucunu bloklamadan bekler.
- **"Deadlock nasıl oluşur?"** Eşitleme bağlamı olan bir thread `.Result` ile bloklanır; görevin devamı aynı thread'i bekler.
- **"İstisnalar nereye gider?"** Görevin içine kaydedilir ve `await` anında yeniden fırlatılır. `Task.WhenAll`'da `await` yalnızca ilk istisnayı fırlatır; hepsi görevin `Exception` özelliğindedir.

## Özet

- `async`/`await` thread'leri bloklamadan beklemeyi sağlar; kazanç ölçeklenebilirliktir.
- Baştan sona asenkron yazın; `.Result` ve `.Wait()` kullanmayın.
- `async void` yalnızca olay işleyicileri içindir.
- Bağımsız işleri `Task.WhenAll` ile eşzamanlı bekleyin; eşzamanlılığı sınırlayın.
- `CancellationToken`'ı her katmana geçirin.
