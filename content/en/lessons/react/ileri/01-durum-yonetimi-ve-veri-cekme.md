---
title: State Management and Data Fetching
summary: Separating server state from client state, where state should live, the limits of Context, Redux Toolkit, Zustand, caching with TanStack Query, invalidation and optimistic updates, state in the URL, and form state.
---

In full-stack job postings, the terms that most often appear alongside React are "Redux/Flux," "TanStack Query (React Query)," and "state management." Kozak's job posting asks for React + Redux, and Zirve's own UI uses TanStack Query. The real interview question isn't about the tool: "Where should this data live, and why?"

## Two kinds of state

| | Server state | Client state |
| --- | --- | --- |
| Example | Order list, user profile, product details | Open modal, selected tab, form draft, theme |
| Owner | The server. What the client has is a **copy** | The client |
| Problems | Staleness, caching, refetching, concurrent requests, pagination, error and loading states | Sharing between components |
| Right tool | TanStack Query, RTK Query, SWR | `useState`, `useReducer`, Context, Zustand, Redux |

The mistake made for years was to put server data in Redux and hand-write the caching, loading flags, and refetching. Today's approach: **leave server state to a data-fetching library; the client state that remains is usually small.**

## Where should state live?

Think through this list in order and pick the first one that fits:

1. **Can it be computed?** Then it isn't state. Compute it during render (`const total = items.reduce(...)`). Use `useMemo` if needed.
2. **Should it be in the URL?** Filters, sorting, page number, selected tab. It's shareable and survives a refresh (`useSearchParams`).
3. **Does it belong to a single component?** `useState` or `useReducer`.
4. **Is it shared by a few sibling components?** Move it to their common parent (lifting state up).
5. **Is it shared by distant components and does it change rarely?** Context (theme, signed-in user, language).
6. **Is it shared by distant components and does it change often?** A store with selector support, such as Zustand or Redux.

## The limits of Context

Context is a **dependency injection** tool, not a state manager. When a Context value changes, **every** component that uses that Context re-renders:

```tsx
const CartContext = createContext<{ items: Item[]; add: (i: Item) => void } | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  // A new object on every render: every consumer re-renders every time
  return <CartContext value={{ items, add: (i) => setItems((s) => [...s, i]) }}>{children}</CartContext>;
}
```

Improvements: stabilize the value with `useMemo`, or split the changing state and the stable actions into two separate Contexts. For state that changes often and is read in many places, a store with selectors is a better fit: a component re-renders only when the slice it reads changes.

## Redux Toolkit

Redux provides predictable state management with a single store, pure reducers, and actions. Modern Redux means **Redux Toolkit (RTK)**. The old hand-written switch-based reducers and action type constants are no longer recommended.

```ts
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as CartItem[] },
  reducers: {
    added(state, action: PayloadAction<CartItem>) {
      state.items.push(action.payload);          // Immer: written "as if mutating," updated immutably
    },
    removed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.sku !== action.payload);
    },
  },
});

export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;

// In a component
const count = useSelector((s: RootState) => s.cart.items.length);   // re-renders only when this value changes
const dispatch = useDispatch();
dispatch(cartSlice.actions.added(item));
```

Redux's strengths: time travel and action history with Redux DevTools, strict one-way data flow, and predictability on large teams. The cost: more concepts and more code. For server data, you use **RTK Query**, which ships inside RTK.

## Zustand

A small, popular alternative with less ceremony:

```ts
type CartState = { items: CartItem[]; add: (i: CartItem) => void; clear: () => void };

export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  clear: () => set({ items: [] }),
}));

const count = useCart((s) => s.items.length);   // selector: re-renders only when this changes
```

It needs no Provider, it has selectors, and it takes a few minutes to learn. It's a frequent choice for client state in new projects.

## Server state with TanStack Query

```tsx
function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: ({ signal }) => api.get<Order>(`/api/orders/${id}`, { signal }),
    staleTime: 30_000,          // considered fresh for 30 s, not refetched
  });
}

function OrderPage({ id }: { id: string }) {
  const { data, isPending, error } = useOrder(id);
  if (isPending) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <OrderDetails order={data} />;
}
```

What the library does for you:

- **Caching and deduplication:** ten components using the same `queryKey` send a single request.
- **Stale-while-revalidate:** shows the cached data immediately and refreshes it in the background.
- **Refetching:** when you return to the window, when the network comes back, at set intervals.
- **Cancellation:** when the component unmounts, the request is canceled via `signal`.
- **Retries**, pagination (`useInfiniteQuery`), prefetching (`prefetchQuery`).

**`queryKey` design matters:** every parameter the query depends on must be in the key (`['orders', { status, page }]`). Otherwise, different filters share the same cache entry.

The difference between `staleTime` and `gcTime`: `staleTime` is how long the data is considered fresh (it isn't refetched during that time). `gcTime` (formerly `cacheTime`) is how long unused data is kept in the cache.

### Mutations and invalidation

```tsx
const queryClient = useQueryClient();

const cancelOrder = useMutation({
  mutationFn: (id: string) => api.post(`/api/orders/${id}/cancellation`),
  onSuccess: (_, id) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });   // the list and details are refetched
  },
});
```

### Optimistic updates

The UI updates without waiting for the server and rolls back if there's an error:

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

This fits operations that rarely fail and are easy to undo, such as liking or adding to favorites. It isn't for operations like payments.

## Form state

Re-rendering the whole form on every keystroke and writing validation by hand is clunky. **React Hook Form** works with uncontrolled inputs and reduces the number of renders. Schema-based validation with **Zod** defines both the types and the rules in one place:

```ts
const schema = z.object({ email: z.email(), quantity: z.number().int().min(1).max(100) });
type FormValues = z.infer<typeof schema>;
const form = useForm<FormValues>({ resolver: zodResolver(schema) });
```

The server still validates. Client-side validation is for user experience, not for security.

## Asked in interviews

- **"Would you put everything in Redux?"** No. Server data goes in TanStack Query or RTK Query, long-lived shared client state in a store, and the rest in local state and the URL.
- **"Why can Context cause performance problems?"** When the value changes, every consumer re-renders. I stabilize the value, split the Context, or use a store with selectors.
- **"What does TanStack Query solve?"** Caching server state, deduplication, staleness, refetching, cancellation, and error and loading states.
- **"What's the difference between `staleTime` and `gcTime`?"** One is how long the data is considered fresh; the other is how long unused data stays in the cache.
- **"Where should filters be kept?"** In the URL. It's shareable, survives a refresh, and the back button works.
- **"What is an optimistic update, and when shouldn't you use it?"** Updating the UI immediately and rolling back if there's an error. I don't use it for irreversible or critical operations.

## Summary

- Separate server state from client state. Server state belongs to a data-fetching library.
- A value that can be computed isn't state. Filters live in the URL. State is kept as close as possible to where it's used.
- Context is for values that change rarely. For shared state that changes often, use a store with selectors (Zustand, Redux).
- Modern Redux means Redux Toolkit. For server data, there's RTK Query.
- TanStack Query: a meaningful `queryKey`, `staleTime`, invalidation after mutations, and optimistic updates when appropriate.
