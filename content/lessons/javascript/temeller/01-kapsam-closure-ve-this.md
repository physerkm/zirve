---
title: Kapsam, Closure ve this
summary: JavaScript mülakatlarının üç temel taşı. var/let/const ve hoisting, closure'ın ne olduğu ve neye yaradığı, this'in çağrı biçimine göre nasıl belirlendiği.
minutes: 17
level: intermediate
---

## Kapsam: var, let, const

Kapsam (scope), bir değişkenin kodun neresinden erişilebildiğini belirler. JavaScript **sözcüksel** (lexical) kapsam kullanır: bir fonksiyonun hangi değişkenlere erişeceği, **çağrıldığı** yere değil **yazıldığı** yere göre belirlenir.

| | `var` | `let` | `const` |
| --- | --- | --- | --- |
| Kapsam | Fonksiyon | Blok (`{ }`) | Blok |
| Yeniden atama | Evet | Evet | Hayır |
| Tanımdan önce erişim | `undefined` | Hata (TDZ) | Hata (TDZ) |
| Aynı kapsamda yeniden tanımlama | Serbest | Hata | Hata |

```javascript
if (true) {
  var a = 1;
  let b = 2;
}
console.log(a);            // 1: var blok tanımaz
console.log(typeof b);     // "undefined": b bloğun dışında yok
```

`const` yeniden **atamayı** engeller, değişmezlik sağlamaz: `const list = []; list.push(1);` geçerlidir. Varsayılan olarak `const`, yeniden atama gerekiyorsa `let` kullanın; `var` kullanmayın.

### Hoisting

Tanımlar, çalıştırma başlamadan önce kapsamın başına "taşınmış" gibi işlenir:

- **Fonksiyon bildirimleri** bütünüyle taşınır: tanımından önce çağrılabilir.
- **`var`** tanımı taşınır, ataması taşınmaz: tanımdan önce `undefined` okunur.
- **`let` / `const`** de taşınır, ama tanım satırına kadar erişilemez. Bu aralığa **geçici ölü bölge** (temporal dead zone, TDZ) denir.

```javascript
console.log(x);     // undefined
var x = 5;

console.log(y);     // ReferenceError: Cannot access 'y' before initialization
let y = 5;
```

## Closure

Closure, bir fonksiyonun **tanımlandığı kapsamdaki değişkenlere, o kapsam sona erdikten sonra bile** erişebilmesidir. JavaScript'te her fonksiyon bir closure'dır.

```javascript
function createCounter() {
  let count = 0;                 // createCounter bittikten sonra da yaşar
  return {
    increment: () => ++count,
    get value() { return count; },
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.value);      // 2
console.log(counter.count);      // undefined: dışarıdan erişilemez
```

Fonksiyon, değişkenin **değerinin kopyasını değil, kendisini** yakalar.

Ne işe yarar:

- **Veri gizleme.** Yukarıdaki `count` gerçekten özeldir.
- **Fonksiyon fabrikaları ve kısmi uygulama:** `const add = (a) => (b) => a + b;`
- **Durum saklayan yardımcılar:** memoize, debounce, throttle.
- **Geri çağrılar ve olay işleyicileri:** çevredeki değişkenlere erişirler.
- React'te **hook'lar** tümüyle closure üzerine kuruludur; "bayat closure" hataları da buradan gelir.

```javascript
function memoize(fn) {
  const cache = new Map();                       // closure içinde saklanır
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
```

### Klasik soru: döngü ve setTimeout

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3
```

`var` fonksiyon kapsamlıdır; üç geri çağrı da **aynı** `i` değişkenini paylaşır ve çalıştıklarında döngü bitmiştir. `let` kullanıldığında her tur kendi `i` değişkenini alır ve çıktı `0 1 2` olur.

Closure'ın bedeli: yakalanan değişkenler, onları yakalayan fonksiyon erişilebilir olduğu sürece çöp toplayıcı tarafından serbest bırakılamaz. Kaldırılmayan olay dinleyicileri ve temizlenmeyen zamanlayıcılar bu yolla bellek sızıntısına yol açar.

## this

`this`, fonksiyonun **nasıl çağrıldığına** göre belirlenir; nerede tanımlandığına göre değil (ok fonksiyonları dışında). Sırayla dört kural:

| Çağrı biçimi | `this` |
| --- | --- |
| `new Fn()` | Yeni oluşturulan nesne |
| `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)` | Açıkça verilen `obj` |
| `obj.method()` | Noktanın solundaki nesne (`obj`) |
| `fn()` | Katı kipte `undefined`; değilse global nesne |

```javascript
const user = {
  name: 'Ada',
  greet() { return `Merhaba, ${this.name}`; },
};

user.greet();                    // "Merhaba, Ada"

const greet = user.greet;        // metot nesnesinden koparıldı
greet();                         // TypeError: this undefined (modüller ve sınıflar katı kiptedir)
```

Metodu bir geri çağrı olarak vermek (`setTimeout(user.greet, 100)`, `button.onclick = user.greet`) aynı sorunu üretir: fonksiyon nesnesinden kopmuştur ve `this` artık `user` değildir (tarayıcıda `setTimeout` için `window`, `onclick` için düğmenin kendisi olur; hata fırlatmak yerine yanlış değer dönebilir).

### Ok fonksiyonları

Ok fonksiyonlarının **kendi `this` değeri yoktur**; tanımlandıkları kapsamın `this` değerini kullanırlar ve bu `call`/`bind` ile değiştirilemez.

```javascript
class Timer {
  seconds = 0;

  start() {
    setInterval(() => {
      this.seconds++;            // this, start() içindeki this'tir: Timer örneği
    }, 1000);
  }
}
```

Buradan çıkan kural: **geri çağrılar için ok fonksiyonu, nesne metotları için normal fonksiyon** kullanın. Bir nesne metodunu ok fonksiyonu olarak yazarsanız `this` nesneyi göstermez:

```javascript
const broken = {
  name: 'Ada',
  greet: () => this.name,        // this burada nesne değil, dış kapsamın this'i
};
```

Ok fonksiyonlarının ayrıca `arguments` nesnesi yoktur ve `new` ile çağrılamazlar.

### call, apply, bind

```javascript
function introduce(greeting, punctuation) {
  return `${greeting}, ben ${this.name}${punctuation}`;
}

const ada = { name: 'Ada' };

introduce.call(ada, 'Merhaba', '!');       // argümanlar tek tek
introduce.apply(ada, ['Merhaba', '!']);    // argümanlar dizi olarak
const bound = introduce.bind(ada, 'Selam'); // yeni fonksiyon döndürür; this kalıcı olarak bağlanır
bound('.');
```

## Prototipler

JavaScript'te kalıtım **prototip zinciriyle** çalışır. Her nesnenin gizli bir prototip bağlantısı vardır; bir özellik nesnede bulunamazsa zincirde yukarı doğru aranır.

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} ses çıkarıyor`; }
}

const cat = new Animal('Pamuk');
Object.getPrototypeOf(cat) === Animal.prototype;   // true
Object.hasOwn(cat, 'speak');                        // false: metot prototipte durur
```

`class` sözdizimi yeni bir kalıtım modeli getirmez; prototipler üzerine daha okunur bir sözdizimidir. Metotlar her örnekte kopyalanmaz, `Animal.prototype` üzerinde **bir kez** durur ve bütün örnekler tarafından paylaşılır.

## Mülakatta sorulur

- **"Closure nedir, nerede kullandınız?"** Tanımı verin, sonra somut bir örnek: memoize, debounce, özel durum.
- **"`==` ile `===` farkı?"** `==` karşılaştırmadan önce tip dönüştürür (`0 == ''` doğrudur); `===` dönüştürmez. Her zaman `===` kullanın.
- **"debounce yazın."** Closure'da bir zamanlayıcı kimliği tutun; her çağrıda öncekini iptal edip yenisini kurun.

```javascript
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

## Özet

- Kapsam sözcükseldir. `let` ve `const` blok kapsamlıdır ve TDZ ile korunur; `var` kullanmayın.
- Closure: fonksiyon + tanımlandığı kapsamın değişkenleri. Değişkenin kendisi yakalanır.
- `this` çağrı biçimiyle belirlenir: `new`, açık bağlama, metot çağrısı, düz çağrı.
- Ok fonksiyonları `this` değerini çevreleyen kapsamdan alır; geri çağrılar için idealdir.
- `class`, prototip zincirinin üzerine sözdizimidir.
