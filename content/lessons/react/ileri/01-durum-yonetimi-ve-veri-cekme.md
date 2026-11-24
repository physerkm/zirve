---
title: Durum Yönetimi ve Veri Çekme
summary: Sunucu durumu ile istemci durumunu ayırmak, durumun nerede yaşayacağı, Context'in sınırları, Redux Toolkit, Zustand, TanStack Query ile önbellek, geçersiz kılma ve iyimser güncelleme, URL'de durum ve form durumu.
minutes: 22
level: intermediate
---

Full-stack ilanlarında React ile birlikte en sık "Redux/Flux", "TanStack Query (React Query)" ve "state management" geçer. Kozak'ın ilanı React + Redux ister, Zirve'nin kendi arayüzü TanStack Query kullanır. Mülakattaki asıl soru araç değildir: "Bu veri nerede yaşamalı ve neden?"

## İki tür durum

| | Sunucu durumu | İstemci durumu |
| --- | --- | --- |
| Örnek | Sipariş listesi, kullanıcı profili, ürün detayı | Açık modal, seçili sekme, form taslağı, tema |
| Sahibi | Sunucu. İstemcideki bir **kopyadır** | İstemci |
| Sorunları | Bayatlama, önbellek, yeniden çekme, eşzamanlı istekler, sayfalama, hata ve yükleniyor durumu | Bileşenler arası paylaşım |
| Doğru araç | TanStack Query, RTK Query, SWR | `useState`, `useReducer`, Context, Zustand, Redux |

Yıllarca yapılan hata, sunucu verisini Redux'a koyup önbelleği, yükleniyor bayraklarını ve yeniden çekmeyi elle yazmaktı. Bugünkü yaklaşım: **sunucu durumunu bir veri çekme kütüphanesine bırak, geriye kalan istemci durumu genellikle küçüktür.**

## Durum nerede yaşamalı?

Şu sırayla düşünün, ilk uyanı seçin:

1. **Hesaplanabiliyor mu?** O zaman durum değildir. Render sırasında hesaplayın (`const total = items.reduce(...)`). Gerekirse `useMemo`.
2. **URL'de olmalı mı?** Filtre, sıralama, sayfa numarası, seçili sekme. Paylaşılabilir ve yenilemede korunur (`useSearchParams`).
3. **Tek bileşene mi ait?** `useState` ya da `useReducer`.
4. **Birkaç kardeş bileşen mi paylaşıyor?** Ortak üst bileşene taşıyın (lifting state up).
5. **Uzak bileşenler mi paylaşıyor ve seyrek mi değişiyor?** Context (tema, oturum açmış kullanıcı, dil).
6. **Uzak bileşenler mi paylaşıyor ve sık mı değişiyor?** Zustand ya da Redux gibi seçici (selector) destekli bir mağaza.

## Context'in sınırı

Context bir **bağımlılık enjeksiyonu** aracıdır, durum yöneticisi değil. Context değeri değişince o Context'i kullanan **bütün** bileşenler yeniden render edilir:

```tsx
const CartContext = createContext<{ items: Item[]; add: (i: Item) => void } | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  // Her render'da yeni nesne: bütün tüketiciler her seferinde yeniden render olur
  return <CartContext value={{ items, add: (i) => setItems((s) => [...s, i]) }}>{children}</CartContext>;
}
```

İyileştirmeler: değeri `useMemo` ile sabitlemek, değişen durum ile sabit eylemleri iki ayrı Context'e bölmek. Sık değişen ve çok yerde okunan durum için seçicili bir mağaza daha uygundur: bileşen yalnızca okuduğu parça değişince render olur.

## Redux Toolkit

Redux, tek bir mağaza, saf reducer'lar ve eylemlerle (action) öngörülebilir durum yönetimi sağlar. Modern Redux, **Redux Toolkit (RTK)** demektir. Eski elle yazılmış switch'li reducer'lar ve action type sabitleri artık önerilmez.

```ts
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as CartItem[] },
  reducers: {
    added(state, action: PayloadAction<CartItem>) {
      state.items.push(action.payload);          // Immer: "değiştiriyor gibi" yazılır, değişmez güncellenir
    },
    removed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.sku !== action.payload);
    },
  },
});

export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;

// Bileşende
const count = useSelector((s: RootState) => s.cart.items.length);   // yalnızca bu değer değişince render
const dispatch = useDispatch();
dispatch(cartSlice.actions.added(item));
```

Redux'ın güçlü yanları: Redux DevTools ile zaman yolculuğu ve eylem geçmişi, katı tek yönlü veri akışı, büyük ekiplerde öngörülebilirlik. Maliyeti: daha fazla kavram ve kod. Sunucu verisi için RTK'nin içindeki **RTK Query** kullanılır.

## Zustand

Daha az törenli, küçük ve popüler bir alternatif:

```ts
type CartState = { items: CartItem[]; add: (i: CartItem) => void; clear: () => void };

export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  clear: () => set({ items: [] }),
}));

const count = useCart((s) => s.items.length);   // seçici: yalnızca bu değişince render
```

Provider gerektirmez, seçicileri vardır ve öğrenmesi birkaç dakikadır. Yeni projelerde istemci durumu için sık tercih edilir.

## TanStack Query ile sunucu durumu

```tsx
function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: ({ signal }) => api.get<Order>(`/api/orders/${id}`, { signal }),
    staleTime: 30_000,          // 30 sn boyunca taze sayılır, yeniden çekilmez
  });
}

function OrderPage({ id }: { id: string }) {
  const { data, isPending, error } = useOrder(id);
  if (isPending) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <OrderDetails order={data} />;
}
```

Kütüphanenin sizin yerinize yaptıkları:

- **Önbellek ve tekilleştirme:** aynı `queryKey`'i kullanan on bileşen tek istek atar.
- **Stale-while-revalidate:** önbellekteki veriyi hemen gösterir, arka planda tazeler.
- **Yeniden çekme:** pencereye dönünce, ağ geri gelince, belirli aralıklarla.
- **İptal:** bileşen ayrılınca `signal` ile istek iptal edilir.
- **Yeniden deneme**, sayfalama (`useInfiniteQuery`), ön yükleme (`prefetchQuery`).

**`queryKey` tasarımı önemlidir:** bağımlı olduğu her parametre anahtarın içinde olmalıdır (`['orders', { status, page }]`). Yoksa farklı filtreler aynı önbellek girdisini paylaşır.

`staleTime` ile `gcTime` farkı: `staleTime` verinin ne kadar süre taze sayılacağıdır (bu sürede yeniden çekilmez). `gcTime` (eski adıyla `cacheTime`) kullanılmayan verinin önbellekte ne kadar tutulacağıdır.

### Mutasyon ve geçersiz kılma

```tsx
const queryClient = useQueryClient();

const cancelOrder = useMutation({
  mutationFn: (id: string) => api.post(`/api/orders/${id}/cancellation`),
  onSuccess: (_, id) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });   // liste ve detaylar yeniden çekilir
  },
});
```

### İyimser güncelleme

Kullanıcı arayüzü sunucuyu beklemeden güncellenir, hata olursa geri alınır:

```tsx
useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (productId) => {
    await queryClient.cancelQueries({ queryKey: ['favorites'] });
    const previous = queryClient.getQueryData<string[]>(['favorites']);
    queryClient.setQueryData<string[]>(['favorites'], (old = []) =>
      old.includes(productId) ? old.filter((x) => x !== productId) : [...old, productId]);
    return { previous };
  },
  onError: (_err, _id, context) => queryClient.setQueryData(['favorites'], context?.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
});
```

Beğenme, favoriye ekleme gibi hatası nadir ve geri alınması kolay işlemler için uygundur. Ödeme gibi işlemler için değildir.

## Form durumu

Her tuş vuruşunda bütün formu yeniden render etmek ve doğrulamayı elle yazmak hantaldır. **React Hook Form** kontrolsüz girdilerle çalışır ve render sayısını azaltır. **Zod** ile şema tabanlı doğrulama hem tipleri hem kuralları tek yerde tanımlar:

```ts
const schema = z.object({ email: z.email(), quantity: z.number().int().min(1).max(100) });
type FormValues = z.infer<typeof schema>;
const form = useForm<FormValues>({ resolver: zodResolver(schema) });
```

Sunucu yine doğrular. İstemci doğrulaması kullanıcı deneyimi içindir, güvenlik için değil.

## Mülakatta sorulur

- **"Redux'a her şeyi koyar mısın?"** Hayır. Sunucu verisi TanStack Query ya da RTK Query'de, kalıcı paylaşılan istemci durumu mağazada, geri kalanı yerel durumda ve URL'de.
- **"Context neden performans sorunu yaratabilir?"** Değer değişince bütün tüketiciler render olur. Değeri sabitler, Context'i böler ya da seçicili bir mağaza kullanırım.
- **"TanStack Query neyi çözer?"** Sunucu durumunun önbelleğini, tekilleştirmeyi, bayatlamayı, yeniden çekmeyi, iptali ve hata ve yükleniyor durumlarını.
- **"`staleTime` ile `gcTime` farkı?"** Biri verinin taze sayıldığı süre, diğeri kullanılmayan verinin önbellekte kaldığı süre.
- **"Filtreler nerede tutulmalı?"** URL'de. Paylaşılabilir, yenilemede korunur, geri tuşu çalışır.
- **"İyimser güncelleme nedir, ne zaman kullanılmaz?"** Arayüzü hemen güncelleyip hata olursa geri almak. Geri alınamaz ya da kritik işlemlerde kullanmam.

## Özet

- Sunucu durumu ile istemci durumunu ayırın. Sunucu durumu bir veri çekme kütüphanesine aittir.
- Hesaplanabilen değer durum değildir. Filtreler URL'de yaşar. Durum mümkün olan en yakın yerde tutulur.
- Context seyrek değişen değerler içindir. Sık değişen paylaşılan durum için seçicili mağaza (Zustand, Redux) kullanılır.
- Modern Redux, Redux Toolkit demektir. Sunucu verisi için RTK Query vardır.
- TanStack Query: anlamlı `queryKey`, `staleTime`, mutasyon sonrası geçersiz kılma ve gerektiğinde iyimser güncelleme.
