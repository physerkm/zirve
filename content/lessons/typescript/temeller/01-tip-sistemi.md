---
title: TypeScript Tip Sistemi
summary: Yapısal tipleme, birleşim tipleri ve daraltma, ayrımcı birleşimler, generics, unknown ile any farkı ve yardımcı tipler.
minutes: 18
level: intermediate
---

TypeScript, JavaScript'e **derleme zamanında** çalışan bir tip sistemi ekler. Tipler çalışma zamanında yoktur: derleme sırasında silinir ve geriye düz JavaScript kalır. Bu tek cümle, pek çok mülakat sorusunun yanıtıdır: tipler çalışma zamanında denetim yapmaz; dışarıdan gelen veriyi (API yanıtı, kullanıcı girdisi) ayrıca doğrulamanız gerekir.

## Yapısal tipleme

C# ve Java **adsal** (nominal) tipleme kullanır: iki tip, adları ve bildirimleri aynıysa uyumludur. TypeScript **yapısaldır**: bir değer, gereken **şekle** sahipse uyumludur.

```typescript
interface Point {
  x: number;
  y: number;
}

function length(p: Point): number {
  return Math.hypot(p.x, p.y);
}

const pixel = { x: 3, y: 4, color: 'red' };
length(pixel);        // geçerli: pixel, Point'in istediği her şeye sahip
```

`pixel` hiçbir yerde `Point` olduğunu bildirmedi; şekli yetiyor. Fazladan özellik sorun değildir. Tek istisna, **nesne değişmezini doğrudan** verdiğinizde yapılan fazlalık denetimidir; yazım hatalarını yakalamak içindir:

```typescript
length({ x: 3, y: 4, color: 'red' });   // Hata: 'color' Point'te yok
```

## type ve interface

İkisi de nesne şekli tanımlar ve çoğu durumda birbirinin yerine kullanılabilir.

| | `interface` | `type` |
| --- | --- | --- |
| Nesne şekli | Evet | Evet |
| Birleşim, demet, ilkel takma adı | Hayır | Evet |
| Genişletme | `extends` | `&` (kesişim) |
| Aynı adla yeniden bildirim (birleşme) | Evet | Hayır |

Pratik kural: bir ekipte tutarlı olun. Yaygın tercih, nesne şekilleri için `interface`, birleşimler ve tip hesaplamaları için `type` kullanmaktır.

## Birleşim tipleri ve daraltma

Birleşim (union), bir değerin birkaç tipten biri olabileceğini söyler. TypeScript, denetim akışını izleyerek tipi **daraltır**.

```typescript
function format(value: string | number | null): string {
  if (value === null) return '-';                // burada value: null
  if (typeof value === 'string') return value.trim();   // burada value: string
  return value.toFixed(2);                       // geriye kalan: number
}
```

Daraltma araçları: `typeof`, `instanceof`, `in`, eşitlik denetimi, doğruluk denetimi ve kendi **tip koruyucunuz** (type guard):

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

### Ayrımcı birleşimler

Durum modellemenin en güçlü yolu. Her üyede ortak bir **değişmez (literal) alan** bulunur; o alanı denetlemek tipi kesin olarak daraltır.

```typescript
type RequestState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function render(state: RequestState<string[]>): string {
  switch (state.status) {
    case 'loading':
      return 'Yükleniyor…';
    case 'success':
      return state.data.join(', ');      // data yalnızca burada var
    case 'error':
      return state.message;
    default: {
      const unreachable: never = state;  // yeni bir durum eklenirse burası derlenmez
      return unreachable;
    }
  }
}
```

Bu model, "yükleniyor ama aynı anda hata da var" gibi **geçersiz durumları tipte ifade edilemez** kılar. `isLoading`, `error`, `data` gibi birbirinden bağımsız üç alan tutmak ise sekiz olası birleşime izin verir; çoğu anlamsızdır.

`never` ile yapılan **tüketicilik denetimi**, birleşime yeni üye eklendiğinde işlenmemiş yerleri derleme hatasına çevirir.

## any, unknown, never

| Tip | Anlamı | Kullanım |
| --- | --- | --- |
| `any` | Tip denetimini **kapatır** | Kaçının; bulaşıcıdır |
| `unknown` | "Ne olduğunu bilmiyorum" | Dış veri; kullanmadan önce daraltmak **zorunludur** |
| `never` | "Hiçbir değer olamaz" | Asla dönmeyen fonksiyonlar, tüketicilik denetimi |

```typescript
const data: unknown = JSON.parse(text);

data.name;                                     // Hata: önce daraltın
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log(data.name);                      // artık güvenli
}
```

`JSON.parse`, `fetch().json()` gibi çağrılar `any` döndürür. Sonucu `as User` ile damgalamak derleyiciyi susturur ama hiçbir şeyi doğrulamaz; sistem sınırlarında gerçek bir doğrulama (elle ya da zod gibi bir şema kitaplığıyla) yapın.

## Generics

Generic, tipin kendisini parametre yapar: girdi ile çıktı arasındaki ilişkiyi korursunuz.

```typescript
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const n = first([1, 2, 3]);        // number | undefined
const s = first(['a', 'b']);       // string | undefined
```

`any` kullansaydınız dönüş tipi bilgisi kaybolurdu. **Kısıtlar** (`extends`) generic parametrenin en azından hangi şekle sahip olması gerektiğini söyler:

```typescript
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const users = [{ name: 'Ada', age: 36 }];
pluck(users, 'name');      // string[]
pluck(users, 'email');     // Hata: 'email' geçerli bir anahtar değil
```

`keyof T`, `T`'nin anahtarlarının birleşimidir; `T[K]` o anahtarın değer tipidir. Bu ikisi, tip güvenli yardımcıların temelidir.

## Yardımcı tipler

Sık kullanılan dönüşümler hazır gelir:

| Tip | Ne yapar |
| --- | --- |
| `Partial<T>` | Bütün alanları isteğe bağlı yapar |
| `Required<T>` | Bütün alanları zorunlu yapar |
| `Readonly<T>` | Bütün alanları salt okunur yapar |
| `Pick<T, K>` | Yalnızca seçilen alanları alır |
| `Omit<T, K>` | Seçilen alanları çıkarır |
| `Record<K, V>` | Anahtarları `K`, değerleri `V` olan nesne |
| `ReturnType<F>` | Fonksiyonun dönüş tipi |
| `Awaited<T>` | Promise'in çözülen tipi |

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserUpdate = Partial<Omit<User, 'id'>>;     // { name?: string; email?: string }
type UserById = Record<number, User>;
```

Bunlar sihir değildir; **eşlenmiş tipler** (mapped types) ile yazılmıştır: `type Partial<T> = { [K in keyof T]?: T[K] }`.

## Değişmez tipler ve as const

```typescript
const directions = ['north', 'south'] as const;      // readonly ['north', 'south']
type Direction = (typeof directions)[number];        // 'north' | 'south'
```

`as const`, değerlerin tipini genişletmeden (`string` yerine `'north'`) tutar. `enum` yerine dizgi birleşimleri ve `as const` nesneleri kullanmak modern tercihtir: çalışma zamanında ek kod üretmezler.

## Katı kip

`tsconfig.json` içinde `"strict": true` pazarlık konusu değildir. En önemli bileşeni `strictNullChecks`'tir: `null` ve `undefined` her tipe sessizce atanamaz; "undefined'ın özelliği okunamaz" hatalarının büyük kısmı derleme zamanında yakalanır.

```typescript
function find(users: User[], id: number): User | undefined {
  return users.find((user) => user.id === id);
}

const user = find(users, 1);
user.name;              // Hata: user undefined olabilir
user?.name ?? 'Anonim'; // güvenli
```

Sonuna `!` koymak (`user!.name`) derleyiciyi susturur ama çalışma zamanı hatasını önlemez; kaçının.

## Özet

- Tipler derleme zamanında vardır ve silinir; dış veriyi çalışma zamanında doğrulayın.
- Tipleme yapısaldır: şekil uyuyorsa tip uyar.
- Birleşim + daraltma + ayrımcı birleşimler, geçersiz durumları tipte olanaksız kılar.
- `any` yerine `unknown`; tüketicilik için `never`.
- Generics girdi–çıktı tip ilişkisini korur; `keyof` ve yardımcı tipler tekrarı önler.
- `strict` her zaman açık olmalıdır.
