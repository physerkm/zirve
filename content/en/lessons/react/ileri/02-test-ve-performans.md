---
title: Testing and Performance in React
summary: Writing tests that behave like a user with Vitest and React Testing Library, query priorities, userEvent, mocking network requests with MSW, end-to-end testing with Playwright, finding unnecessary renders, memo, useMemo, useCallback, the React Compiler, code splitting, and virtualization.
---

Full-stack job postings ask for Jest, React Testing Library, and Playwright for frontend testing. On the performance side, "React performance optimization" is a frequent bullet point. This lesson covers both topics together, because the same principle applies to both: **focus on what the user sees, not on implementation details.**

## Testing tools

| Tool | Role |
| --- | --- |
| **Vitest** (or Jest) | Test runner, assertions, and mocks. Vitest is the natural choice in Vite projects, and its API is nearly identical to Jest's |
| **React Testing Library (RTL)** | Renders the component and queries the DOM **the way a user finds things** |
| **@testing-library/user-event** | Realistic user interaction: typing, clicking, tabbing |
| **MSW (Mock Service Worker)** | Intercepts network requests at the network layer and returns mock responses |
| **Playwright** | End-to-end testing in a real browser |

## Testing like a user

RTL's philosophy: "The more your tests resemble the way your software is used, the more confidence they can give you." Don't test a component's internal state, its state variables, or how many times it renders. Test what the user sees and does.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('the add-to-cart button is disabled for an invalid quantity', async () => {
  const user = userEvent.setup();
  render(<AddToCart productId="SKU-1" />);

  const quantity = screen.getByRole('spinbutton', { name: /quantity/i });
  await user.clear(quantity);
  await user.type(quantity, '0');

  expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  expect(screen.getByText(/at least 1 item/i)).toBeInTheDocument();
});
```

### Query priorities

| Priority | Query | Why |
| --- | --- | --- |
| 1 | `getByRole` (+ `name`) | Uses the accessibility tree. The way a screen reader sees the page |
| 2 | `getByLabelText` | Form fields |
| 3 | `getByPlaceholderText`, `getByText` | Visible text |
| 4 | `getByDisplayValue`, `getByAltText`, `getByTitle` | Special cases |
| Last resort | `getByTestId` | The user never sees a test ID |

An element you can't find with `getByRole` is often an **accessibility problem**: an input without a label, or a button made out of a `div`. This way, tests also improve accessibility.

### get, query, find

- `getBy...`: throws an error if it finds nothing. Use it when you expect the element to exist.
- `queryBy...`: returns `null` if it finds nothing. Use it when asserting that something is **absent**: `expect(screen.queryByText(/error/)).not.toBeInTheDocument()`.
- `findBy...`: returns a `Promise` and waits until the element appears. For asynchronous results: `await screen.findByText(/order created/i)`.

Don't test asynchronous UI with `setTimeout` or fixed waits. Use `findBy` and `waitFor`.

## Mocking network requests: MSW

Mocking `fetch` or the API module leaves out how the application actually sends requests. MSW intercepts at the network level, and the component makes a real `fetch` call:

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

test('shows an error message on a server error', async () => {
  server.use(http.get('/api/orders/:id', () => new HttpResponse(null, { status: 500 })));
  renderWithProviders(<OrderPage id="42" />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not be loaded/i);
});
```

When testing components that use TanStack Query, create a **new `QueryClient`** for each test and turn off retries (`retry: false`). Otherwise, tests see each other's cache and error tests slow down.

The same MSW handlers can also run in the browser during development: for building the UI before the backend is ready.

## End-to-end testing: Playwright

```ts
import { test, expect } from '@playwright/test';

test('the user can place an order', async ({ page }) => {
  await page.goto('/products/sku-1');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Complete order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order has been received' })).toBeVisible();
});
```

Playwright supports Chromium, Firefox, and WebKit, automatically waits for elements to be ready (auto-wait), and records screenshots, video, and a trace on failure. Cypress is another common alternative.

E2E tests are slow and expensive. Limit them to **critical user flows**: sign-in, checkout, registration. Leave edge cases to component and unit tests. To reduce flakiness, each test should set up its own data and use state-based waits instead of fixed waits.

## Performance: measure first

React is usually fast enough. When someone complains about slowness:

1. Use the **React DevTools Profiler** to see which component renders, how often, and why (the "Why did this render?" option).
2. Use the **browser's performance panel** to find long tasks.
3. Measure on the user's side with **Web Vitals**: LCP (time until the largest content is visible), INP (time to respond to an interaction), CLS (layout shift).

### When does a component re-render?

- When its own state changes.
- **When its parent renders** (even if its props haven't changed).
- When the value of a Context it uses changes.

The second item is the most common cause, and most of the time it isn't a problem: a render doesn't mean a DOM update. React computes the difference and writes only what changed to the DOM. The problem starts when rendering is expensive or there are a great many components.

### memo, useMemo, useCallback

```tsx
const OrderRow = memo(function OrderRow({ order, onSelect }: Props) { /* ... */ });

function OrderTable({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sorted = useMemo(() => [...orders].sort(byDate), [orders]);       // expensive computation
  const handleSelect = useCallback((id: string) => setSelected(id), []);   // stable reference
  return sorted.map((o) => <OrderRow key={o.id} order={o} onSelect={handleSelect} />);
}
```

- `memo`: doesn't re-render the component if its props haven't changed (by shallow comparison).
- `useMemo`: keeps the result of an expensive computation until its dependencies change.
- `useCallback`: stabilizes a function's reference. On its own it does nothing. It becomes meaningful when the function is passed to a `memo`-wrapped child or to an effect's dependency list.

Putting these everywhere complicates the code and adds comparison costs. Measure, and use them where they're needed.

### React Compiler

The React Compiler (stable release 1.0 in 2025) analyzes components at build time and **automatically** adds the equivalents of `memo`, `useMemo`, and `useCallback`. In projects where it's enabled, the need for manual memoization drops dramatically. The code must follow the Rules of React (pure rendering, the Rules of Hooks). The ESLint plugin shows violations.

### More effective optimizations

These often bring bigger gains than memoization:

- **Moving state down:** don't keep state that only one input uses at the very top of the whole page. Move the state into the component that uses it, and the rest of the page won't re-render.
- **Code splitting:** `lazy(() => import('./ReportsPage'))` and `Suspense`. On first load, the user downloads only the code they need. Route-based splitting is the easiest and most effective.
- **Virtualization:** in a 10,000-row list, render only the ~30 rows visible on screen. `@tanstack/react-virtual` or `react-window`.
- **A stable `key`:** in lists, use a persistent ID, not the array index. An index key causes the wrong state to move to the wrong row on sorting and deletion, and leads to unnecessary re-creation.
- **Deferred values:** make heavy updates low priority with `useDeferredValue` and `useTransition`. The search box doesn't stutter while you type; the results list just lags slightly behind.
- **Images:** the right size, modern formats (WebP, AVIF), `loading="lazy"`.

## Asked in interviews

- **"Why `getByRole` instead of `getByTestId` in tests?"** It queries the way the user and a screen reader see the page, and it also surfaces accessibility problems.
- **"What's the difference between `getBy`, `queryBy`, and `findBy`?"** Throws an error, returns null, waits.
- **"How do you test a component that makes an API call?"** I return mock responses at the network level with MSW. I test the success, error, and loading states.
- **"Why does a component re-render?"** When its own state, its parent, or its Context changes.
- **"Should I put `useCallback` on every function?"** No. It only helps when the function is passed to a memoized child or used as an effect dependency. If you have the React Compiler, it's usually unnecessary.
- **"A 10,000-row table is slow. What do you do?"** Virtualization, stable keys, wrapping the row component in memo, and server-side pagination if needed.

## Summary

- Test like a user: query by role and label, interact with `userEvent`, and wait for asynchronous results with `findBy`.
- Mock the network with MSW. Use a new `QueryClient` in every test.
- Use Playwright to test only critical flows end to end.
- Measure first: the Profiler and Web Vitals.
- Moving state down, code splitting, and virtualization are often more effective than memoization. The React Compiler automates memoization.
