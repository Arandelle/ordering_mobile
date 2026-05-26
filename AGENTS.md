# Expo Mobile App Instructions

## Project Context

This is the Expo React Native mobile app for the restaurant ordering system.

Stack:
- Expo
- React Native
- TypeScript
- Expo Router
- TanStack Query
- NativeWind
- AsyncStorage
- Next.js API backend
- Maya payment redirect flow

---

## Mobile Architecture Rules

- Follow Expo Router conventions.
- Use React Native components only.
- Keep screens focused on routing and layout.
- Move reusable UI into components.
- Move API calls into services.
- Move server-state logic into hooks.
- Avoid putting business logic directly inside screens.

---

## File Organization Rules

Prefer this structure:

```txt
app/
├── (tabs)/
├── product/
│   └── [id].tsx
├── checkout/
│   └── index.tsx
src/
├── components/
├── hooks/
├── services/
├── context/
├── constants/
├── types/
├── utils/
```

---

## Data Fetching Rules

- Use TanStack Query for server state.
- Do not fetch API data directly inside `useEffect` if a query hook can be used.
- Keep fetch logic inside `services/`.
- Keep query logic inside `hooks/`.
- Use stable query keys.
- Consider cache invalidation after cart, checkout, branch, and order changes.
- Preserve loading, empty, error, and refetch states.

---

## API Integration Rules

- The mobile app consumes the existing Next.js API routes.
- Do not recreate backend routes inside the Expo app.
- Use service functions for API calls.
- Handle failed network requests gracefully.
- Do not trust mobile-side validation only; backend validation is still required.
- Avoid hardcoded API URLs except through constants/config.

---

## Navigation Rules

- Use `expo-router` for navigation.
- Use `router.push()` for normal navigation.
- Use `router.back()` for return behavior.
- Use route params carefully and validate them before use.
- For dynamic pages, follow Expo Router file-based routing.
- Avoid manually creating navigation containers unless the app is intentionally using React Navigation directly.

---

## UI Rules

- Use NativeWind where the project already uses it.
- Preserve safe area handling.
- Preserve keyboard behavior on forms.
- Preserve scroll behavior on small screens.
- Avoid fixed heights that break on different devices.
- Keep touch targets large enough for mobile use.
- Always consider loading, empty, disabled, and error states.

---

## Forms & Validation Rules

- Validate required fields before allowing the next checkout step.
- Show user-friendly validation messages.
- Avoid allowing checkout if:
  - no branch is selected
  - cart is empty
  - product is out of stock
  - store is closed
  - minimum order amount is not met
  - required customer details are missing

---

## Cart & Checkout Rules

Checkout is production-sensitive.

Before modifying checkout logic, identify:
- selected branch behavior
- cart state behavior
- stock availability behavior
- store open/closed behavior
- minimum order amount
- personal details validation
- payment redirect flow
- order creation flow

Do not assume payment success from the mobile app alone.

---

## Payment Rules

- Maya payment should be treated as an external redirect flow.
- Handle return/cancel/failure states carefully.
- Do not mark an order as paid from frontend redirect alone.
- Payment status should be confirmed by backend/webhook logic.
- Preserve pending, paid, failed, cancelled, and expired states.

---

## AsyncStorage Rules

- Use AsyncStorage only for non-sensitive persisted state.
- Do not store secrets, raw tokens, payment data, or sensitive user data insecurely.
- Validate parsed AsyncStorage data before using it.
- Handle missing or corrupted stored data safely.

---

## Performance Rules

- Avoid unnecessary re-renders in lists.
- Use `FlatList` for large lists.
- Use stable `keyExtractor`.
- Use `useMemo` and `useCallback` only when they solve actual rendering issues.
- Avoid heavy computation inside render.
- Optimize images when possible.
- follow the twMerge if needed
---

## Error Handling Rules

- Handle offline or unstable network conditions.
- Show retry options when practical.
- Avoid silent failures.
- Log errors only when safe.
- Do not expose internal backend errors directly to users.

---

## Dependency Rules

- Do not install new packages unless necessary.
- Explain why a new package is needed before adding it.
- Prefer Expo-supported libraries.
- Avoid packages that require unsupported native configuration unless clearly needed.

---

## Before Editing

Before changing code, identify:
- what screen/component/hook/service is affected
- what files should change
- what files should not change
- possible regressions
- whether checkout, payment, auth, branch, or inventory behavior is affected

---

## Preferred Workflow

1. Inspect existing implementation.
2. Explain current behavior.
3. Identify the safest change.
4. Make minimal edits.
5. Preserve existing UX states.
6. Summarize risks and follow-up improvements.

---

## Important Rule

Act like a senior React Native engineer building a production ordering app, not just generating UI.