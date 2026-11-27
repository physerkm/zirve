---
title: React'te Test ve Performans
summary: Vitest ve React Testing Library ile kullanıcı gibi test yazmak, sorgu öncelikleri, userEvent, ağ isteklerini MSW ile taklit etmek, Playwright ile uçtan uca test, gereksiz render'ları bulmak, memo, useMemo, useCallback, React Compiler, kod bölme ve sanallaştırma.
minutes: 22
level: intermediate
---

Full-stack ilanları frontend testi için Jest, React Testing Library ve Playwright ister. Performans tarafında "React performans optimizasyonu" maddesi sık geçer. Bu ders iki konuyu birlikte anlatır, çünkü ikisinde de aynı ilke geçerlidir: **uygulama ayrıntısına değil, kullanıcının gördüğüne odaklan.**

## Test araçları

| Araç | Görevi |
| --- | --- |
| **Vitest** (ya da Jest) | Test çalıştırıcı, assert ve mock. Vite projelerinde Vitest doğal seçimdir, API'si Jest ile neredeyse aynıdır |
| **React Testing Library (RTL)** | Bileşeni render eder ve DOM'u **kullanıcının bulduğu gibi** sorgular |
| **@testing-library/user-event** | Gerçekçi kullanıcı etkileşimi: yazma, tıklama, sekme |
| **MSW (Mock Service Worker)** | Ağ isteklerini ağ katmanında yakalayıp sahte yanıt döner |
| **Playwright** | Gerçek tarayıcıda uçtan uca test |

## Kullanıcı gibi test etmek

RTL'nin felsefesi: "Testleriniz yazılımın kullanılma biçimine ne kadar benzerse size o kadar güven verir." Bileşenin iç durumunu, state değişkenlerini ya da kaç kez render olduğunu test etmeyin. Kullanıcının gördüğünü ve yaptığını test edin.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('geçersiz adetle sepete ekleme butonu devre dışı kalır', async () => {
  const user = userEvent.setup();
  render(<AddToCart productId="SKU-1" />);

  const quantity = screen.getByRole('spinbutton', { name: /adet/i });
  await user.clear(quantity);
  await user.type(quantity, '0');

  expect(screen.getByRole('button', { name: /sepete ekle/i })).toBeDisabled();
  expect(screen.getByText(/en az 1 adet/i)).toBeInTheDocument();
});
```

### Sorgu öncelikleri

| Öncelik | Sorgu | Neden |
| --- | --- | --- |
| 1 | `getByRole` (+ `name`) | Erişilebilirlik ağacını kullanır. Ekran okuyucunun gördüğü gibi |
| 2 | `getByLabelText` | Form alanları |
| 3 | `getByPlaceholderText`, `getByText` | Görünen metin |
| 4 | `getByDisplayValue`, `getByAltText`, `getByTitle` | Özel durumlar |
| Son çare | `getByTestId` | Kullanıcı test kimliğini görmez |

`getByRole` ile bulunamayan bir öğe çoğu zaman **erişilebilirlik sorunudur**: etiketsiz bir girdi ya da `div`'den yapılmış bir buton. Testler bu yolla erişilebilirliği de iyileştirir.

### get, query, find

- `getBy...`: bulamazsa hata fırlatır. Öğenin var olduğunu beklediğinizde.
- `queryBy...`: bulamazsa `null` döner. **Olmadığını** doğrularken: `expect(screen.queryByText(/hata/)).not.toBeInTheDocument()`.
- `findBy...`: `Promise` döner, öğe görünene kadar bekler. Asenkron sonuçlar için: `await screen.findByText(/sipariş oluşturuldu/i)`.

Asenkron arayüzü `setTimeout` ya da sabit beklemelerle test etmeyin. `findBy` ve `waitFor` kullanın.

## Ağ isteklerini taklit etmek: MSW

`fetch`'i ya da API modülünü mock'lamak, uygulamanın gerçekte nasıl istek attığını test dışı bırakır. MSW ağ düzeyinde yakalar. Bileşen gerçek `fetch` çağrısını yapar:

```ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/orders/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'Paid', total: 250 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('sunucu hatasında hata mesajı gösterilir', async () => {
  server.use(http.get('/api/orders/:id', () => new HttpResponse(null, { status: 500 })));
  renderWithProviders(<OrderPage id="42" />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/yüklenemedi/i);
});
```

TanStack Query kullanan bileşenleri test ederken her test için **yeni bir `QueryClient`** oluşturun ve yeniden denemeyi kapatın (`retry: false`). Aksi halde testler birbirinin önbelleğini görür ve hata testleri yavaşlar.

Aynı MSW tanımları geliştirme ortamında tarayıcıda da çalışabilir: backend hazır olmadan arayüz geliştirmek için.

## Uçtan uca test: Playwright

```ts
import { test, expect } from '@playwright/test';

test('kullanıcı sipariş verebilir', async ({ page }) => {
  await page.goto('/products/sku-1');
  await page.getByRole('button', { name: 'Sepete ekle' }).click();
  await page.getByRole('link', { name: 'Sepet' }).click();
  await page.getByRole('button', { name: 'Siparişi tamamla' }).click();
  await expect(page.getByRole('heading', { name: 'Siparişiniz alındı' })).toBeVisible();
});
```

Playwright Chromium, Firefox ve WebKit'i destekler, öğelerin hazır olmasını otomatik bekler (auto-wait), hata anında ekran görüntüsü, video ve iz (trace) kaydeder. Cypress de yaygın bir alternatiftir.

E2E testleri yavaş ve pahalıdır. **Kritik kullanıcı akışlarıyla** sınırlayın: giriş, ödeme, kayıt. Kenar durumlarını bileşen ve birim testlerine bırakın. Kararsızlığı azaltmak için her test kendi verisini hazırlamalı ve sabit beklemeler yerine durum bazlı beklemeler kullanmalıdır.

## Performans: önce ölç

React genellikle yeterince hızlıdır. Yavaşlık şikâyeti geldiğinde:

1. **React DevTools Profiler** ile hangi bileşenin, ne sıklıkla ve neden render olduğuna bakın ("Why did this render?" seçeneği).
2. **Tarayıcı performans paneli** ile uzun görevleri (long task) bulun.
3. **Web Vitals** ile kullanıcı tarafı ölçün: LCP (en büyük içeriğin görünme süresi), INP (etkileşime yanıt süresi), CLS (düzen kayması).

### Bir bileşen ne zaman yeniden render olur?

- Kendi durumu değişince.
- **Üst bileşeni render olunca** (prop'ları değişmese bile).
- Kullandığı Context'in değeri değişince.

İkinci madde en sık sebeptir ve çoğu zaman sorun değildir: render, DOM güncellemesi demek değildir. React farkı hesaplar ve yalnızca değişeni DOM'a yazar. Sorun, render pahalı olduğunda ya da çok sayıda bileşen olduğunda başlar.

### memo, useMemo, useCallback

```tsx
const OrderRow = memo(function OrderRow({ order, onSelect }: Props) { /* ... */ });

function OrderTable({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sorted = useMemo(() => [...orders].sort(byDate), [orders]);       // pahalı hesap
  const handleSelect = useCallback((id: string) => setSelected(id), []);   // sabit referans
  return sorted.map((o) => <OrderRow key={o.id} order={o} onSelect={handleSelect} />);
}
```

- `memo`: prop'lar (sığ karşılaştırmayla) değişmediyse bileşeni yeniden render etmez.
- `useMemo`: pahalı bir hesabın sonucunu bağımlılıklar değişene kadar saklar.
- `useCallback`: fonksiyonun referansını sabitler. Tek başına bir işe yaramaz. `memo`'lu bir çocuğa ya da bir efektin bağımlılık listesine verildiğinde anlam kazanır.

Bunları her yere koymak kodu karmaşıklaştırır ve karşılaştırma maliyeti ekler. Ölçüp gerekli yerde kullanın.

### React Compiler

React Compiler (2025'te kararlı sürüm 1.0), derleme zamanında bileşenleri analiz eder ve `memo`, `useMemo`, `useCallback` eşdeğerlerini **otomatik** ekler. Etkin olduğu projelerde elle memoizasyon ihtiyacı büyük ölçüde azalır. Kodun React kurallarına (saf render, hook kuralları) uyması gerekir. ESLint eklentisi ihlalleri gösterir.

### Daha etkili optimizasyonlar

Çoğu zaman memoizasyondan daha büyük kazanç sağlayanlar:

- **Durumu aşağı taşımak:** yalnızca bir girdinin kullandığı durumu bütün sayfanın en üstünde tutmayın. Durumu kullanan bileşene taşıyın, sayfanın geri kalanı render olmaz.
- **Kod bölme (code splitting):** `lazy(() => import('./ReportsPage'))` ve `Suspense`. Kullanıcı ilk açılışta yalnızca ihtiyacı olan kodu indirir. Rota bazlı bölme en kolay ve en etkili olandır.
- **Sanallaştırma:** 10 000 satırlık bir listede yalnızca ekranda görünen ~30 satırı render etmek. `@tanstack/react-virtual` ya da `react-window`.
- **Kararlı `key`:** listelerde dizi indeksi değil, kalıcı kimlik. İndeks anahtarı, sıralama ve silmede yanlış durumun yanlış satıra taşınmasına ve gereksiz yeniden oluşturmaya yol açar.
- **Ertelenmiş değerler:** `useDeferredValue` ve `useTransition` ile ağır güncellemeyi düşük öncelikli yapın. Arama kutusu yazarken takılmaz, sonuç listesi biraz geriden gelir.
- **Görseller:** doğru boyut, modern biçim (WebP, AVIF), `loading="lazy"`.

## Mülakatta sorulur

- **"Testte neden `getByTestId` yerine `getByRole`?"** Kullanıcının ve ekran okuyucunun gördüğü gibi sorgular, erişilebilirlik sorunlarını da ortaya çıkarır.
- **"`getBy`, `queryBy`, `findBy` farkı?"** Hata fırlatır, null döner, bekler.
- **"API çağrısı yapan bileşeni nasıl test edersin?"** MSW ile ağ düzeyinde sahte yanıt veririm. Başarı, hata ve yükleniyor durumlarını test ederim.
- **"Bir bileşen neden yeniden render olur?"** Kendi durumu, üst bileşeni ya da Context'i değişince.
- **"`useCallback`'i her fonksiyona koymalı mıyım?"** Hayır. Yalnızca memo'lu bir çocuğa ya da efekt bağımlılığına verildiğinde fayda sağlar. React Compiler varsa çoğu zaman gerekmez.
- **"10 000 satırlık tablo yavaş. Ne yaparsın?"** Sanallaştırma, kararlı anahtarlar, satır bileşenini memo ile sarmak ve gerekirse sunucu tarafı sayfalama.

## Özet

- Kullanıcı gibi test edin: rol ve etiketle sorgulayın, `userEvent` ile etkileşin, asenkron sonuçları `findBy` ile bekleyin.
- Ağı MSW ile taklit edin. Her testte yeni `QueryClient` kullanın.
- Playwright ile yalnızca kritik akışları uçtan uca test edin.
- Önce ölçün: Profiler ve Web Vitals.
- Durumu aşağı taşımak, kod bölme ve sanallaştırma çoğu zaman memoizasyondan etkilidir. React Compiler memoizasyonu otomatikleştirir.
