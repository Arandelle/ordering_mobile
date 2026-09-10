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
├── components/        # Shared/reusable UI components
│   ├── UndoBanner.tsx
│   ├── BottomSheet.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Icon.tsx
│       ├── Input.tsx
│       ├── DynamicImage.tsx
│       └── QuantityStepper.tsx
├── hooks/             # Shared hooks (useUndo, useProducts, etc.)
├── screens/           # Screen-specific components
│   ├── cart/          # Cart screen + sub-components
│   │   ├── index.tsx       # Screen entry (layout + state wiring)
│   │   ├── CartItemCard.tsx
│   │   └── ModifierSummary.tsx
│   └── ...
├── services/
├── context/
├── constants/
├── types/
├── utils/
```

**Screen folder convention:** When a screen grows beyond ~200 lines, extract sub-components into a co-located folder (e.g. `screens/cart/`). The `index.tsx` inside the folder is the screen entry — just layout, state wiring, and composition. Shared components that are useful across screens belong in `src/components/`.

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

---

## Design System & UI Patterns

When building or redesigning any screen, follow these visual conventions to maintain consistency.

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `brand-500` | `#ef4501` | Primary accent, prices, active states |
| `brand-50` | `#fff4ee` | Light tinted backgrounds (chips, badges) |
| Hard-coded `#e13e00` | — | Used in Button primary, Input focus, QuantityStepper increment |
| `gray-50` | — | Screen backgrounds |
| `gray-100` | — | Dividers, pill badge backgrounds, secondary surfaces |
| `gray-200` | — | Borders, hairline separators |
| `gray-400` | — | Muted text (unit prices, helper text) |
| `gray-500` | — | Secondary labels, item counts |
| `gray-800` / `gray-900` | — | Headings, primary text, dark surfaces |
| `red-500` | — | Destructive actions (delete swipe, error states) |
| `orange-400` / `orange-500` | — | Progress indicators, undo banner accents |

**Rule:** Prefer Tailwind tokens (`brand-500`, `gray-400`) over hard-coded hex. Use `#e13e00` or `#ef4501` only when a Tailwind token does not exist for the exact shade needed.

### Typography

No custom fonts. Use the system font stack (San Francisco / Roboto) with weight classes.

| Context | Classes |
|---|---|
| Screen headings / empty state titles | `text-xl font-semibold text-gray-900` |
| Section headers / card titles | `text-base font-bold text-gray-900` |
| Item name in cards | `text-[15px] font-semibold text-gray-900` (2-line max) |
| Body text | `text-sm text-gray-700` |
| Prices (total, emphasized) | `text-base font-bold text-brand-500` |
| Unit price / helper | `text-xs text-gray-400` |
| Pill badge text / chip labels | `text-[11px] font-medium text-brand-500` or `text-gray-500` |
| Button text | `text-sm font-bold` (inherited from Button component) |
| Count badges | `text-xs font-medium text-gray-500` |

**Rule:** Use `font-bold` for headings and prices, `font-semibold` for item names, `font-medium` for labels and badges. Never use `font-light` or `font-extrabold`.

### Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `rounded-2xl` | 16px | Cards, floating bottom bars, undo banners, large buttons |
| `rounded-xl` | 12px | Product images, checkout buttons, inner containers |
| `rounded-lg` | 8px | Checkboxes, small buttons, undo action buttons |
| `rounded-md` | 6px | Category checkboxes, compact controls |
| `rounded-full` | 999px | Pill badges, circular icon containers, avatar-style elements |

**Rule:** Cards and floating containers use `rounded-2xl`. Images use `rounded-xl`. Buttons and interactive controls use `rounded-lg` or `rounded-xl`. Pill-style badges use `rounded-full`.

### Elevation & Shadows

| Pattern | Usage |
|---|---|
| `shadow-sm` | Item cards (subtle lift from background) |
| `shadow-md` | Floating bottom bars (checkout bar) |
| `shadow-lg` | Overlays, undo banners, bottom sheets |
| No shadow | Flat surfaces, section headers, inline elements |

**Rule:** Use shadows sparingly to create depth layers. Cards get `shadow-sm`, floating bars get `shadow-md`, overlays get `shadow-lg`. Never stack shadows.

### Spacing Conventions

| Pattern | Value | Usage |
|---|---|---|
| Card horizontal margin | `mx-3` (12px) | Cards inset from screen edges |
| Card internal padding | `p-3` (12px) | Content inside cards |
| Gap between cards | `marginBottom: 8` | Vertical spacing between list items |
| Section footer gap | `height: 8` | Space between category sections |
| Inner element gaps | `gap-2` to `gap-4` | Between related elements in a row |
| Bottom bar padding | `px-4 py-3.5` | Floating bottom bars |
| Screen padding | `px-4` or `px-8` | Content areas, empty states |
| List top padding | `paddingTop: 4` | Breathing room above first item |

### Card Pattern

Every list item card follows this structure:

```
<View className="mx-3 overflow-hidden rounded-2xl bg-white shadow-sm">
  <View className="flex-row p-3">
    <!-- leading element (checkbox, image, icon) -->
    <!-- content column (flex-1, justify-between) -->
  </View>
</View>
```

- Outer wrapper: `mx-3 rounded-2xl bg-white shadow-sm overflow-hidden`
- Inner content: `flex-row p-3` with leading element + `flex-1 justify-between` content column
- Use `justify-between` on the content column to spread name (top) and price/actions (bottom)
- Product images: `h-20 w-20 rounded-xl` (80×80)

### Floating Bottom Bar Pattern

```
<View className="mx-3 mb-2 overflow-hidden rounded-2xl bg-white shadow-md">
  <View className="flex-row items-center justify-between px-4 py-3.5">
    <!-- left section -->
    <View className="h-8 w-px bg-gray-200" />  <!-- divider -->
    <!-- right section -->
  </View>
</View>
```

- Floating card with rounded corners, not edge-to-edge
- Vertical divider (`h-8 w-px bg-gray-200`) separates logical groups
- Use `justify-between` to push groups to edges

### Pill Badge / Chip Pattern

```
<View className="rounded-full bg-gray-100 px-2.5 py-0.5">
  <Text className="text-xs font-medium text-gray-500">...</Text>
</View>
```

Or for brand-tinted chips:

```
<TouchableOpacity className="self-start flex-row items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1">
  <Ionicons name="..." size={12} color="#ef4501" />
  <Text className="text-[11px] font-medium text-brand-500">...</Text>
</TouchableOpacity>
```

### Swipe-to-Delete Pattern

```
<Swipeable friction={2} rightThreshold={40} overshootRight={false}>
  <!-- card content -->
</Swipeable>
```

- Right action: `rounded-2xl bg-red-500` container with a `rounded-full bg-red-600` circular icon button
- Only one swipeable open at a time (track via ref callback)
- Close on scroll (`onScrollBeginDrag`)
- Show undo banner with countdown after removal

### Undo Banner Pattern

The undo system is split into two **generic, reusable** pieces:

1. **`src/hooks/useUndo.ts`** — manages countdown timer + pending item state.
2. **`src/components/UndoBanner.tsx`** — animated banner UI with progress bar.

**Hook usage:**
```ts
const { pendingItem, secondsLeft, trigger, undo, isActive } = useUndo<CartItem>({
  duration: 5,
});

// Perform the destructive action, then trigger:
removeFromCart(item._id);
trigger(item);

// Restore on undo:
if (pendingItem) addToCart(pendingItem);
undo();
```

**Banner usage:**
```tsx
{pendingItem && (
  <UndoBanner
    message={<>Removed <Text className="font-semibold">{pendingItem.name}</Text></>}
    secondsLeft={secondsLeft}
    duration={5}
    onUndo={handleUndo}
    actionLabel="Undo"        // optional, defaults to "Undo"
    iconName="trash-outline"  // optional, defaults to "trash-outline"
  />
)}
```

**Props:** `message` (ReactNode), `secondsLeft`, `duration`, `onUndo`, `actionLabel?`, `iconName?`, `iconTint?`, `iconColor?`

This is **not cart-specific** — reuse it anywhere a destructive action needs an undo window (order cancellation, list deletion, etc.).

### Section Header Pattern

```
<View className="flex-row items-center justify-between px-4 pb-1 pt-3">
  <View className="flex-row items-center gap-2.5">
    <!-- checkbox -->
    <Text className="text-base font-bold text-gray-900">{categoryName}</Text>
  </View>
  <View className="rounded-full bg-gray-100 px-2.5 py-0.5">
    <Text className="text-xs font-medium text-gray-500">{count} items</Text>
  </View>
</View>
```

- Transparent background (inherits screen `bg-gray-50`)
- Category name: `text-base font-bold`
- Item count pill badge on the right

### Empty State Pattern

```
<View className="flex-1 items-center justify-center gap-4 px-8">
  <View className="h-24 w-24 items-center justify-center rounded-full bg-orange-50">
    <Ionicons name="..." size={44} color="#e13e00" />
  </View>
  <View className="items-center gap-1">
    <Text className="text-xl font-semibold text-gray-900">Title</Text>
    <Text className="text-center text-sm leading-relaxed text-gray-400">Subtitle</Text>
  </View>
  <Button ... className="mt-2 rounded-2xl px-6" />
</View>
```

- Centered layout with generous vertical gaps
- Icon inside a tinted circle (`rounded-full bg-orange-50`)
- Title + subtitle stack
- Primary action button below

### Icon Conventions

- **Ionicons** (`@expo/vector-icons`): UI chrome icons (trash, cart, layers, chevron, close)
- **Lucide** (`lucide-react-native`): Product and feature icons (via `Icon` component)
- Default icon size: 16px. Badge/chip icons: 10-12px. Empty state icons: 32-44px.
- Icon colors match the text color of their context (gray-400 for muted, brand-500 for accent, white for on-dark)

### Animation Conventions

- Use `react-native-reanimated` for UI animations
- Entry animations: `withTiming(value, { duration: 200-250 })`
- Use `useSharedValue` + `useAnimatedStyle` pattern
- Keep animations subtle and fast (200-300ms)
- Progress indicators: animate `width` percentage

### Libraries Available

These are already installed — do not add new animation/gesture/UI-kit packages:

- `react-native-gesture-handler` — Swipeable, gesture handling
- `react-native-reanimated` — UI animations, shared values
- `@expo/vector-icons` — Ionicons, MaterialIcons, etc.
- `lucide-react-native` — Lucide icon set
- `nativewind` + `tailwind-merge` — Tailwind classes in React Native
- `react-native-safe-area-context` — Safe area insets

### Before Redesigning a Screen

1. Read the existing screen to understand current behavior and state handling.
2. Read the UI components in `src/components/ui/` to understand available variants.
3. Check `tailwind.config.js` for the color palette.
4. Apply the patterns above consistently.
5. Preserve all existing UX states: loading, empty, disabled, error.
6. Do not install new packages for styling — use what is already available.
7. Run `npm run typecheck` after changes to verify.