---
title: Event Loop, Promise ve async/await
summary: Tek thread'li JavaScript'in eşzamansız işleri nasıl yürüttüğü. Çağrı yığını, makro ve mikro görevler, Promise zincirleri, async/await ve hata yönetimi.
minutes: 18
level: intermediate
---

JavaScript **tek thread'lidir**: aynı anda yalnızca bir iş yapar. Yine de ağ istekleri, zamanlayıcılar ve kullanıcı olayları birbirini bloklamaz. Bunu sağlayan mekanizma **event loop**'tur ve "bu kodun çıktısı nedir?" sorularının hepsi ona dayanır.

## Parçalar

- **Çağrı yığını** (call stack): o an çalışan fonksiyonlar. JavaScript bir işi bitirmeden diğerine geçmez.
- **Ortam API'leri:** zamanlayıcılar, ağ, dosya sistemi. Bunları tarayıcı ya da Node.js sağlar ve JavaScript thread'inin **dışında** çalışırlar.
- **Makro görev kuyruğu** (task queue): `setTimeout`, `setInterval`, G/Ç ve olay geri çağrıları.
- **Mikro görev kuyruğu** (microtask queue): Promise geri çağrıları (`then`, `catch`, `finally`), `await` sonrası kod, `queueMicrotask`.

Event loop şu döngüyü sürdürür:

1. Çağrı yığını boşalana kadar eşzamanlı kodu çalıştır.
2. **Bütün** mikro görevleri çalıştır (çalışırken eklenenler dahil).
3. Gerekirse ekranı boya (tarayıcıda).
4. Kuyruktan **bir** makro görev al ve 1. adıma dön.

Sonuç: **mikro görevler makro görevlerden önce çalışır.**

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Çıktı: 1 4 3 2
```

`setTimeout(fn, 0)` "hemen" demek değildir: "eşzamanlı kod ve bütün mikro görevler bittikten sonra, ilk fırsatta" demektir.

Daha zor bir örnek:

```javascript
setTimeout(() => console.log('A'), 0);

Promise.resolve()
  .then(() => {
    console.log('B');
    setTimeout(() => console.log('C'), 0);
  })
  .then(() => console.log('D'));

console.log('E');

// Çıktı: E B D A C
```

`E` eşzamanlıdır. Sonra mikro görevler: `B`, ardından zincirin devamı `D`. Sonra makro görevler **eklenme sırasıyla**: `A`, sonra `B` içinde eklenen `C`.

### Thread'i bloklamak

Tek thread olduğu için uzun süren eşzamanlı bir hesap **her şeyi** durdurur: tarayıcıda tıklamalar ve boyama, Node.js'te diğer bütün istekler bekler. Çözümler: işi parçalara bölmek, Web Worker / worker thread kullanmak ya da işi sunucuya taşımak.

Sürekli kendini yeniden ekleyen mikro görevler de makro görevleri ve boyamayı aç bırakır.

## Promise

Promise, gelecekte tamamlanacak bir işlemin sonucunu temsil eder. Üç durumu vardır: **bekliyor** (pending), **yerine getirildi** (fulfilled), **reddedildi** (rejected). Durum bir kez değişir ve bir daha değişmez.

```javascript
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

fetchUser(1)
  .then((user) => fetchOrders(user.id))     // Promise döndürmek zinciri düzleştirir
  .then((orders) => console.log(orders))
  .catch((error) => console.error(error))   // zincirin herhangi bir yerindeki hatayı yakalar
  .finally(() => hideSpinner());
```

Bilinmesi gerekenler:

- `then` her zaman **yeni** bir Promise döndürür; zincirleme bu sayede çalışır.
- `then` içinde bir değer döndürürseniz sonraki `then` onu alır; Promise döndürürseniz sonraki `then` onun sonucunu bekler.
- `then` içinde fırlatılan hata zinciri reddedilmiş duruma geçirir ve ilk `catch`'e kadar atlar.
- `then` geri çağrıları Promise çoktan tamamlanmış olsa bile **her zaman eşzamansız** (mikro görev olarak) çalışır.

### Birleştiriciler

| Metot | Ne zaman tamamlanır | Ne zaman reddedilir |
| --- | --- | --- |
| `Promise.all` | Hepsi başarılı olunca (sonuç dizisi) | **İlk** ret ile hemen |
| `Promise.allSettled` | Hepsi sonuçlanınca (her birinin durumu) | Asla |
| `Promise.race` | İlk **sonuçlanan** (başarı ya da ret) | İlk sonuçlanan ret ise |
| `Promise.any` | İlk **başarılı** olan | Hepsi reddedilirse |

"Hepsi gerekli, biri başarısızsa vazgeç" → `all`. "Bazıları başarısız olabilir, hepsinin sonucunu istiyorum" → `allSettled`. Zaman aşımı → `race`.

## async / await

`async`/`await`, Promise'ler üzerine sözdizimidir; yeni bir mekanizma değildir.

- `async` fonksiyon **her zaman** Promise döndürür.
- `await`, Promise sonuçlanana kadar **o fonksiyonu** duraklatır; thread'i bloklamaz. Fonksiyonun geri kalanı mikro görev olarak sürer.

```javascript
async function loadDashboard(userId) {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchOrders(user.id);
    return { user, orders };
  } catch (error) {
    console.error('Yüklenemedi:', error);
    throw error;                       // çağıranın da haberi olsun
  }
}
```

```javascript
async function demo() {
  console.log('1');
  await null;                // burada duraklar; geri kalan mikro görev olur
  console.log('3');
}

demo();
console.log('2');
// Çıktı: 1 2 3
```

### Sık yapılan hatalar

**Bağımsız işleri sırayla beklemek.** Süreler toplanır.

```javascript
// Yavaş: istekler art arda
const user = await fetchUser(id);
const settings = await fetchSettings(id);

// Hızlı: istekler birlikte başlar
const [user2, settings2] = await Promise.all([fetchUser(id), fetchSettings(id)]);
```

**`forEach` içinde `await`.** `forEach` dönen Promise'leri beklemez; döngü bitmeden kod devam eder.

```javascript
items.forEach(async (item) => { await save(item); });   // BEKLEMEZ

for (const item of items) { await save(item); }          // sırayla
await Promise.all(items.map((item) => save(item)));      // eşzamanlı
```

**Yakalanmayan retler.** `await` edilmeyen ve `catch` eklenmeyen bir Promise reddedilirse hata sessizce kaybolur (ya da Node.js'te süreci sonlandırabilir). Her Promise'i ya `await` edin ya da `catch` ekleyin.

**`return` ile `return await` farkı.** `try/catch` içinde Promise'i `await` etmeden döndürürseniz ret, `catch` bloğunuzun **dışında** oluşur ve yakalanmaz. `try` içinde `return await` yazın.

## Mülakatta sorulur

- **"Çıktı nedir?" soruları.** Yöntem: önce eşzamanlı satırları sırayla yazın; sonra mikro görevleri (eklenme sırasıyla, zincirleri izleyerek); en son makro görevleri.
- **"`Promise.all`'ı kendiniz yazın."** Sonuçları indeksle saklayın, tamamlanan sayısını izleyin, ilk rette reddedin.

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let remaining = promises.length;
    if (remaining === 0) return resolve(results);

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then((value) => {
        results[index] = value;                 // tamamlanma sırası değil, girdi sırası korunur
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}
```

- **"Node.js tek thread'liyse nasıl ölçeklenir?"** G/Ç işletim sistemine ve bir thread havuzuna devredilir; JavaScript thread'i beklemez, yalnızca geri çağrıları çalıştırır. İşlemci yoğun işler ise onu bloklar.

## Özet

- Tek thread, bir çağrı yığını; eşzamansız işleri ortam yürütür, sonuçlar kuyruklardan geri gelir.
- Sıra: eşzamanlı kod → bütün mikro görevler → bir makro görev → tekrar.
- Promise bir kez sonuçlanır; `then` yeni Promise döndürür ve hep eşzamansız çalışır.
- `async`/`await` Promise sözdizimidir; `await` fonksiyonu duraklatır, thread'i değil.
- Bağımsız işleri `Promise.all` ile birlikte bekleyin; `forEach` içinde `await` kullanmayın.
