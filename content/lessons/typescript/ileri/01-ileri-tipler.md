---
title: İleri Tipler
summary: keyof, typeof ve indeksli erişim tipleri, koşullu tipler ve infer, dağılımlı koşullu tipler, eşlenmiş tipler ve anahtar yeniden adlandırma, şablon literal tipler, yardımcı tiplerin kendisini yazmak, satisfies, as const, markalı tipler ve kapsamlılık kontrolü.
minutes: 22
level: advanced
---

`TypeScript Tip Sistemi` dersinde yapısal tiplemeyi, birleşimleri, daraltmayı ve generics'i gördük. Bu ders tip sistemini bir **programlama dili** gibi kullanmayı anlatır: tiplerden tip üretmek. Frontend mülakatlarında "`Partial`'ı kendin yaz" ya da "bu tipin sonucu ne olur?" soruları bu konulardan gelir. Gerçek projede ise API istemcisi, form ve durum yönetimi kodunun tip güvenli kalmasını sağlar.

## Tiplerden tip türetmek

```ts
const config = { apiUrl: 'https://api.example.com', retries: 3, debug: false };

type Config = typeof config;                 // { apiUrl: string; retries: number; debug: boolean }
type ConfigKey = keyof Config;               // "apiUrl" | "retries" | "debug"
type Retries = Config['retries'];            // number   (indeksli erişim)
type Values = Config[keyof Config];          // string | number | boolean

type Order = { id: string; lines: { sku: string; qty: number }[] };
type Line = Order['lines'][number];          // { sku: string; qty: number }
```

- `typeof` (tip bağlamında) bir **değerin** tipini alır.
- `keyof` bir nesne tipinin anahtarlarının birleşimini verir.
- `T[K]` indeksli erişimdir. `[number]` bir dizinin eleman tipini verir.

Tek kaynak ilkesi: tipi bir kez tanımlayın, diğerlerini ondan türetin. Değişiklik tek yerde yapılır.

## as const ve satisfies

```ts
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number];          // "admin" | "editor" | "viewer"
```

`as const` değeri en dar tipine sabitler: dizi salt okunur demet olur, dizgiler literal tip olur. Çalışma zamanındaki dizi ile tip aynı kaynaktan gelir.

```ts
type Route = { path: string; auth: boolean };

const routes = {
  home: { path: '/', auth: false },
  orders: { path: '/orders', auth: true },
} satisfies Record<string, Route>;

routes.orders.path;      // tip kontrolü yapıldı ve anahtarlar ("home" | "orders") korundu
```

`satisfies`, değerin bir tipe **uyduğunu denetler** ama değerin çıkarılan (daha dar) tipini **değiştirmez**. `const routes: Record<string, Route> = ...` yazsaydık `routes.orders` bilgisi kaybolur ve her anahtar geçerli sayılırdı.

## Koşullu tipler

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<'merhaba'>;   // true
type B = IsString<42>;          // false
```

`T extends U ? X : Y`: `T`, `U`'ya atanabiliyorsa `X`, değilse `Y`. Tip düzeyinde bir `if`tir.

### infer

Koşul içinde bir tipin parçasını yakalamak için:

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type Unwrap<T> = T extends Promise<infer V> ? Unwrap<V> : T;    // özyinelemeli
type ReturnOf<F> = F extends (...args: any[]) => infer R ? R : never;

type X = ElementOf<string[]>;               // string
type Y = Unwrap<Promise<Promise<number>>>;  // number
type Z = ReturnOf<() => Promise<Order>>;    // Promise<Order>
```

### Dağılımlı koşullu tipler

Koşul, çıplak bir tip parametresi üzerindeyse birleşimin **her üyesine ayrı ayrı** uygulanır:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type R1 = ToArray<string | number>;         // string[] | number[]   (dağıldı)

type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never;
type R2 = ToArrayNoDist<string | number>;   // (string | number)[]   (dağılmadı)
```

`Exclude` ve `Extract` bu davranışa dayanır:

```ts
type MyExclude<T, U> = T extends U ? never : T;
type Status = 'draft' | 'paid' | 'shipped' | 'cancelled';
type Active = MyExclude<Status, 'cancelled'>;   // "draft" | "paid" | "shipped"
```

`never` birleşimde kaybolur. Bu yüzden "bu üyeyi çıkar" demek için `never` döneriz.

## Eşlenmiş tipler

Bir tipin her anahtarı üzerinde dönüp yeni bir tip üretir:

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };     // "-?" isteğe bağlılığı kaldırır
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends PropertyKey, V> = { [P in K]: V };
type MyOmit<T, K extends PropertyKey> = MyPick<T, Exclude<keyof T, K>>;
```

### Anahtar yeniden adlandırma (`as`)

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Anahtarı never'a eşlemek onu filtreler: yalnızca fonksiyon olan alanlar
type MethodsOf<T> = { [K in keyof T as T[K] extends (...a: any[]) => any ? K : never]: T[K] };
```

## Şablon literal tipler

```ts
type HttpMethod = 'GET' | 'POST' | 'DELETE';
type ApiPath = '/orders' | '/users';
type Endpoint = `${HttpMethod} ${ApiPath}`;   // 6 kombinasyonun birleşimi

type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickHandler = EventName<'click'>;        // "onClick"

// Yol parametrelerini ayrıştırmak
type Params<P extends string> =
  P extends `${string}:${infer Name}/${infer Rest}` ? Name | Params<`/${Rest}`>
  : P extends `${string}:${infer Name}` ? Name
  : never;

type OrderParams = Params<'/users/:userId/orders/:orderId'>;   // "userId" | "orderId"
```

Yönlendirme kütüphaneleri (TanStack Router, tip güvenli API istemcileri) bu teknikle `params.orderId`'nin varlığını derleme zamanında garanti eder.

## Kapsamlılık kontrolü

Ayrık birleşimlerde (discriminated union) her durumun ele alındığını derleyiciye kontrol ettirmek:

```ts
type Payment =
  | { kind: 'card'; last4: string }
  | { kind: 'transfer'; iban: string }
  | { kind: 'wallet'; provider: 'apple' | 'google' };

function describe(p: Payment): string {
  switch (p.kind) {
    case 'card': return `Kart •••• ${p.last4}`;
    case 'transfer': return `Havale ${p.iban}`;
    case 'wallet': return `${p.provider} cüzdan`;
    default: {
      const unreachable: never = p;   // yeni bir tür eklenirse burada derleme hatası
      return unreachable;
    }
  }
}
```

Birleşime `{ kind: 'crypto' }` eklendiğinde `default` dalındaki atama hata verir ve unutulan her `switch` derleme zamanında bulunur.

## Markalı (branded) tipler

Yapısal tiplemede iki `string` her zaman birbirinin yerine geçer. Sipariş kimliğinin yanlışlıkla müşteri kimliği yerine verilmesini engellemek için:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type OrderId = Brand<string, 'OrderId'>;
type CustomerId = Brand<string, 'CustomerId'>;

const toOrderId = (s: string) => s as OrderId;   // doğrulama burada yapılır

function cancel(id: OrderId) { /* ... */ }
cancel(toOrderId('ord_42'));                 // tamam
cancel('ord_42');                            // hata: string, OrderId değil
cancel(customerId);                          // hata: CustomerId, OrderId değil
```

C#'taki strongly typed ID'nin TypeScript karşılığıdır. Çalışma zamanında maliyeti yoktur.

## Fonksiyon aşırı yükleme ve generic kısıtlar

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const total = get(order, 'total');      // number
get(order, 'totl');                      // hata: "totl" geçerli bir anahtar değil
```

`K extends keyof T` kısıtı, anahtar ile dönüş tipini birbirine bağlar.

## Ölçülü olmak

Bu araçlar güçlüdür ama okunması zordur. Kurallar:

- Uygulama kodunda basit tipler tercih edilir. İleri tipler, kütüphane sınırlarında ve paylaşılan yardımcılarda değer kazanır.
- Karmaşık bir tipe açıklayıcı ad verin ve küçük parçalara bölün.
- Hata mesajı okunamaz hale geliyorsa tip fazla zekidir.
- `any` tip güvenliğini kapatır. Bilinmeyen veri için `unknown` kullanın ve daraltın.

## Mülakatta sorulur

- **"`Partial<T>`'yi kendin yaz."** `{ [K in keyof T]?: T[K] }`.
- **"`Omit`'i yaz."** `Pick<T, Exclude<keyof T, K>>`.
- **"`infer` ne işe yarar?"** Koşullu tip içinde bir tipin parçasını yakalar: dizi elemanı, Promise değeri, dönüş tipi.
- **"`satisfies` ile tip açıklaması (`: Type`) farkı?"** Satisfies uyumu denetler ama çıkarılan dar tipi korur.
- **"Yeni bir birleşim üyesi eklendiğinde unutulan `switch`'leri nasıl bulursun?"** `default` dalında `never`'a atama ile kapsamlılık kontrolü.
- **"`string | number` için `T extends unknown ? T[] : never` sonucu ne?"** Dağılımlı koşul: `string[] | number[]`.

## Özet

- `typeof`, `keyof` ve indeksli erişimle tipleri tek kaynaktan türetin.
- `as const` değeri literal tiplere sabitler. `satisfies` denetler ama daraltmayı korur.
- Koşullu tipler tip düzeyinde `if`tir. `infer` parça yakalar. Çıplak parametrede birleşim üzerinde dağılır.
- Eşlenmiş tipler anahtarlar üzerinde döner. `as` ile yeniden adlandırır ya da filtreler.
- Şablon literal tipler dizgi kalıplarını tip düzeyinde üretir ve ayrıştırır.
- `never` ile kapsamlılık kontrolü ve markalı tiplerle anlamsal ayrım. Okunabilirlik önceliklidir.
