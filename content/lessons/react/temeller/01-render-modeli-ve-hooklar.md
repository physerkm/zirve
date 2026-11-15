---
title: Render Modeli ve Hook'lar
summary: React'in bir bileşeni ne zaman ve nasıl yeniden çizdiği, key'in rolü, useState ve useEffect'in doğru kullanımı, bayat closure ve gereksiz effect hataları.
minutes: 20
level: intermediate
---

React mülakatlarında API ezberi değil, **zihinsel model** sorulur: bir bileşen ne zaman yeniden çalışır, durum neden hemen değişmez, `useEffect` ne zaman gerekir? Bu derste modeli kuruyoruz.

## Arayüz, durumun bir fonksiyonudur

React'te bir bileşen, **özellikleri (props) ve durumu (state) alıp ekranda ne olması gerektiğini döndüren** bir fonksiyondur. DOM'u elle değiştirmezsiniz; durumu değiştirirsiniz ve React ekranı ona uydurur.

Bir güncelleme üç aşamadan geçer:

1. **Tetikleme.** İlk çizim ya da bir durum güncellemesi (`setState`).
2. **Render.** React bileşen fonksiyonunuzu **çağırır** ve yeni bir öğe ağacı (JSX'in ürettiği düz nesneler) elde eder. Bu aşamada DOM'a dokunulmaz.
3. **Commit.** React yeni ağacı öncekiyle karşılaştırır (**uzlaştırma**, reconciliation) ve yalnızca **farkları** DOM'a uygular.

"Render" sözcüğü "DOM'u güncellemek" anlamına gelmez; "bileşen fonksiyonunu çağırmak" anlamına gelir. Bir bileşenin yeniden render edilmesi çoğu zaman ucuzdur; pahalı olan DOM değişiklikleridir ve React onları en aza indirir.

### Bir bileşen ne zaman yeniden render edilir

- Kendi **durumu** değiştiğinde.
- **Üst bileşeni** yeniden render edildiğinde (özellikleri değişmese bile).
- Kullandığı bir **bağlam** (context) değeri değiştiğinde.

"Özellikler değişince yeniden render olur" ifadesi yanıltıcıdır: varsayılan davranışta üst bileşen render oluyorsa alt bileşenler de olur. `React.memo` bu davranışı değiştirir: özellikler (sığ karşılaştırmayla) aynıysa render atlanır.

### Render saf olmalıdır

Bileşen gövdesi bir hesaplamadır: aynı girdiyle aynı çıktıyı vermeli ve dış dünyayı değiştirmemelidir. Render sırasında ağ isteği atmak, DOM'a dokunmak, dış değişkenleri değiştirmek hatadır. React, geliştirme kipinde (`StrictMode`) bu hataları ortaya çıkarmak için bileşenleri kasıtlı olarak **iki kez** render eder.

## key: kimlik

React, listedeki öğeleri render'lar arasında eşleştirmek için `key` kullanır. `key`, "bu öğe geçen seferki şu öğeyle aynı" demenin yoludur.

```tsx
{todos.map((todo) => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

**Dizi indeksini `key` yapmayın** (liste hiç değişmiyorsa hariç). Öğe eklendiğinde, silindiğinde ya da sıra değiştiğinde indeksler kayar; React yanlış bileşenleri eşleştirir ve bileşenin **iç durumu** (ör. bir girdi kutusundaki metin) yanlış satırda kalır.

`key` yalnızca listeler için değildir: bir bileşenin `key` değerini değiştirmek React'e onu **yok edip baştan kurmasını** söyler. Durumu sıfırlamanın en temiz yoludur:

```tsx
<ProfileForm key={userId} userId={userId} />   // kullanıcı değişince form sıfırlanır
```

## useState

```tsx
const [count, setCount] = useState(0);
```

### Durum bir anlık görüntüdür

`setCount` çağırmak `count` değişkenini **değiştirmez**; bir sonraki render'ı ister. O render'da `count` yeni değerle gelir. Mevcut render'daki bütün kod (olay işleyicileri dahil) **o render'ın** değerini görür.

```tsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  console.log(count);       // hâlâ eski değer
}
// Sonuç: count 3 değil, 1 artar.
```

Üç çağrı da aynı `count` değerini (ör. 0) okur ve üçü de "1 yap" der. Önceki değere dayanan güncellemelerde **güncelleyici fonksiyon** kullanın:

```tsx
setCount((previous) => previous + 1);   // üç kez çağrılırsa 3 artar
```

React, aynı olay içindeki güncellemeleri **toplu işler** (batching): üç `setState` tek bir render üretir.

### Durumu doğrudan değiştirmeyin

React, durumun değişip değişmediğini **referans karşılaştırmasıyla** anlar. Nesneyi ya da diziyi yerinde değiştirirseniz referans aynı kalır ve React yeniden render etmez.

```tsx
// Yanlış: aynı dizi, React değişikliği görmez
items.push(newItem);
setItems(items);

// Doğru: yeni dizi
setItems([...items, newItem]);
setUser({ ...user, name: 'Ada' });
```

### Türetilebilen şeyi duruma koymayın

Başka bir durumdan ya da özellikten **hesaplanabilen** değer durum olmamalıdır. Render sırasında hesaplayın:

```tsx
// Gereksiz durum + effect
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// Doğrusu
const fullName = `${first} ${last}`;
```

Fazladan durum, eşitlenmesi gereken fazladan şey demektir; hataların kaynağı çoğunlukla budur.

## useEffect

Effect, bileşeni **React dışındaki bir sistemle eşitlemek** içindir: ağ bağlantısı, tarayıcı API'si, zamanlayıcı, üçüncü parti bir bileşen.

```tsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();

  return () => connection.disconnect();     // temizlik
}, [roomId]);                                // bağımlılıklar
```

- Effect, render **commit edildikten sonra** çalışır.
- **Bağımlılık dizisi**, effect'in içinde kullanılan ve render'lar arasında değişebilen her değeri içermelidir. Biri değiştiğinde React önce **temizliği** (eski değerlerle), sonra effect'i (yeni değerlerle) çalıştırır.
- Dizi boşsa (`[]`) effect yalnızca bileşen ekrana geldiğinde çalışır; dizi hiç verilmezse her render'dan sonra çalışır.

Bağımlılıklar hakkında "yalan söylemeyin". Lint kuralını (`react-hooks/exhaustive-deps`) susturmak neredeyse her zaman bir hatayı gizler.

### Bayat closure

Her render kendi özelliklerini ve durumunu "yakalar". Bağımlılığı eksik bir effect, **eski render'ın** değerlerini görmeye devam eder:

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);        // count hep ilk render'daki değer: sayaç 1'de takılır
  }, 1000);
  return () => clearInterval(id);
}, []);                          // count bağımlılıklarda yok

// Çözüm: güncelleyici fonksiyon; effect'in count'a ihtiyacı kalmaz
setCount((previous) => previous + 1);
```

### Effect'e ihtiyacınız olmayabilir

En yaygın React hatası gereksiz effect yazmaktır.

| Yapmak istediğiniz | Effect yerine |
| --- | --- |
| Özellik ya da durumdan değer türetmek | Render sırasında hesaplayın |
| Pahalı bir hesabı önbelleğe almak | `useMemo` |
| Kullanıcı etkileşimine tepki vermek (tıklama, gönderme) | **Olay işleyicisinde** yapın |
| Özellik değişince durumu sıfırlamak | `key` kullanın |
| Sunucudan veri çekmek | TanStack Query gibi bir kitaplık ya da çatının veri katmanı |

Effect içinde elle veri çekiyorsanız **yarış durumunu** ele almalısınız: kullanıcı hızla A'dan B'ye geçerse A'nın yanıtı B'ninkinden sonra gelebilir ve ekranda yanlış veri kalır.

```tsx
useEffect(() => {
  let ignore = false;

  fetchUser(userId).then((user) => {
    if (!ignore) setUser(user);       // eskimiş yanıtı yok say
  });

  return () => { ignore = true; };
}, [userId]);
```

Önbellekleme, tekrar deneme ve yükleme/hata durumlarıyla birlikte bu iş hızla büyür; üretim kodunda bir veri çekme kitaplığı kullanmak bu yüzden standarttır.

## Hook kuralları

1. Hook'ları yalnızca **en üst düzeyde** çağırın: koşul, döngü ya da iç fonksiyon içinde değil.
2. Hook'ları yalnızca React bileşenlerinden ve özel hook'lardan çağırın.

Nedeni: React, bir bileşenin hook'larını **çağrı sırasına** göre eşleştirir. Sıra render'lar arasında değişirse durumlar birbirine karışır.

**Özel hook**, hook kullanan ve adı `use` ile başlayan bir fonksiyondur; durum mantığını bileşenler arasında paylaşmanın yoludur. Durumun kendisini değil, **mantığı** paylaşır: hook'u kullanan her bileşen kendi durumuna sahip olur.

## useRef

`useRef`, render'lar arasında kalıcı olan ve değişmesi **yeniden render tetiklemeyen** bir kutudur. İki kullanımı vardır: DOM düğümüne erişmek (odaklama, ölçüm) ve çizimi etkilemeyen değerleri saklamak (zamanlayıcı kimliği gibi). Render sırasında `ref.current` okumak ya da yazmak saflığı bozar; effect ve olay işleyicilerinde kullanın.

## Özet

- Render = bileşen fonksiyonunu çağırmak; DOM yalnızca commit aşamasında ve yalnızca farklar için güncellenir.
- Bileşen; durumu, üst bileşeni ya da bağlamı değiştiğinde yeniden render edilir.
- `key` kimliktir: listelerde kararlı kimlik kullanın, durumu sıfırlamak için `key` değiştirin.
- Durum anlık görüntüdür; önceki değere dayanıyorsanız güncelleyici fonksiyon kullanın ve durumu asla yerinde değiştirmeyin.
- Effect dış sistemlerle eşitleme içindir. Türetme ve olay tepkileri için effect yazmayın.
