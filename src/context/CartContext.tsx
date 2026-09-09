// import { authClient } from "@/lib/auth-client";
import { CartItem } from '../types/menu-types';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/apiClient';
import { authClient } from '@/lib/auth-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => Promise<void>;
  totalProducts: number;
  totalItems: number;
  vatableSales: number;
  vatAmount: number;
  totalPrice: number;
  selectedItemIds: Set<string>;
  selectedItems: CartItem[];
  selectedTotal: number;
  selectedCount: number;
  isAllSelected: boolean;
  toggleItemSelection: (id: string) => void;
  toggleCategorySelection: (categoryId: string) => void;
  isCategorySelected: (categoryId: string) => boolean;
  selectAll: () => void;
  deselectAll: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSyncing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASYNC_STORAGE_KEY = 'cart_guest';
const DEBOUNCE_MS = 800;

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * CartProvider
 *
 * Strategy:
 * - Authenticated users  → DB is source of truth. Loads from DB on mount,
 *                          syncs to DB (debounced) on every change.
 *                          localStorage is NOT used.
 * - Guest users          → localStorage is source of truth.
 *
 * Optimistic updates: state is mutated instantly; DB sync is fire-and-forget
 * with a debounce so rapid clicks produce only one network request.
 *
 * On login: call mergeGuestCartOnLogin() once after session is established.
 *
 * @param session - pass the authenticated user's id (or null/undefined for guests)
 */
export const CartProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: session } = authClient.useSession();

  // Holds the pending debounce timer for DB sync
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the last items array that was successfully synced to DB
  const lastSyncedRef = useRef<CartItem[]>([]);
  // Tracks whether we're currently authenticated
  // const isAuthenticated = Boolean(session?.user);

  const isAuthenticated = Boolean(session?.user);
  // ─── Mount: load initial cart ───────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      if (isAuthenticated) {
        // Authenticated: fetch from DB, ignore localStorage
        try {
          const data = await apiClient.get<{ items: CartItem[] }>('/customer/cart');
          const items: CartItem[] = data?.items ?? [];
          setCartItems(items);
          lastSyncedRef.current = items;
          await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);

          console.log(data)
        } catch (err) {
          console.error('[CartContext] Failed to load cart from DB:', err);
        }
      } else {
        // Guest: load from localStorage
        try {
          const raw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setCartItems(parsed);
          } else {
            setCartItems([]);
          }
          lastSyncedRef.current = [];
        } catch (err) {
          console.error('[CartContext] Failed to load guest cart:', err);
          setCartItems([]);
        }
      }
      setIsHydrated(true);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // re-run when userId changes (e.g. login / logout) // CHANGE BACK TO SESSION?.USER ONCE AUTH IS OK

  // ─── Auto-select all items when cart loads or changes ──────────────────────

  useEffect(() => {
    if (!isHydrated) return;
    setSelectedItemIds(new Set(cartItems.map((item) => String(item._id))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length, isHydrated]);

  // ─── Sync: persist cart whenever it changes ─────────────────────────────────

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated) {
      // Debounced DB sync — replaces the entire cart in one PUT
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncToDb(cartItems);
      }, DEBOUNCE_MS);
    } else {
      // Guest: immediately persist to localStorage

      AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(cartItems)).catch((err) =>
        console.error('[CartContext] Failed to save guest cart:', err)
      );
    }

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, isHydrated, isAuthenticated]);

  // ─── DB sync helper ─────────────────────────────────────────────────────────

  const syncToDb = useCallback(async (items: CartItem[]) => {
    // Skip if nothing actually changed
    if (JSON.stringify(items) === JSON.stringify(lastSyncedRef.current)) return;

    setIsSyncing(true);
    try {
      await apiClient.put('/customer/cart', { items });
      lastSyncedRef.current = items;
    } catch (err) {
      console.error('[CartContext] Failed to sync cart to DB:', err);
      // Optionally: surface a toast notification here
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ─── Cart actions (always optimistic) ───────────────────────────────────────

  const addToCart = useCallback((item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) {
        return prev.map((c) => (c._id === item._id ? { ...c, quantity: c.quantity + item.quantity } : c));
      }
      return [...prev, { ...item }];
    });
  }, []);

  const removeFromCart = useCallback((id: string | number) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string | number, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(id);
        return;
      }
      setCartItems((prev) => prev.map((item) => (item._id === id ? { ...item, quantity } : item)));
    },
    [removeFromCart]
  );

  const clearCart = useCallback(async () => {
    setCartItems([]);
    setSelectedItemIds(new Set());

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    if (isAuthenticated) {
      lastSyncedRef.current = cartItems; // ensure guard doesn't skip it
      await syncToDb([]);
    } else {
      await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
    }
  }, [syncToDb, cartItems, isAuthenticated]);

  // ─── Selection actions ─────────────────────────────────────────────────────

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleCategorySelection = useCallback(
    (categoryId: string) => {
      setSelectedItemIds((prev) => {
        const categoryItemIds = cartItems
          .filter((item) => item.category?._id === categoryId)
          .map((item) => String(item._id));

        const allSelected = categoryItemIds.every((id) => prev.has(id));
        const next = new Set(prev);

        if (allSelected) {
          categoryItemIds.forEach((id) => next.delete(id));
        } else {
          categoryItemIds.forEach((id) => next.add(id));
        }

        return next;
      });
    },
    [cartItems]
  );

  const isCategorySelected = useCallback(
    (categoryId: string) => {
      const categoryItemIds = cartItems
        .filter((item) => item.category?._id === categoryId)
        .map((item) => String(item._id));
      return categoryItemIds.length > 0 && categoryItemIds.every((id) => selectedItemIds.has(id));
    },
    [cartItems, selectedItemIds]
  );

  const selectAll = useCallback(() => {
    setSelectedItemIds(new Set(cartItems.map((item) => String(item._id))));
  }, [cartItems]);

  const deselectAll = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  // ─── Derived values ──────────────────────────────────────────────────────────

  const totalProducts = cartItems.length;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vatableSales = totalPrice / 1.12;
  const vatAmount = totalPrice - vatableSales;

  const selectedItems = cartItems.filter((item) => selectedItemIds.has(String(item._id)));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAllSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalProducts,
        totalItems,
        vatableSales,
        vatAmount,
        totalPrice,
        selectedItemIds,
        selectedItems,
        selectedTotal,
        selectedCount,
        isAllSelected,
        toggleItemSelection,
        toggleCategorySelection,
        isCategorySelected,
        selectAll,
        deselectAll,
        isCartOpen,
        setIsCartOpen,
        isSyncing,
      }}>
      {children}
    </CartContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// ─── Guest cart merge utility ─────────────────────────────────────────────────

/**
 * Call this once after a user logs in to merge their guest cart into their
 * DB cart. Clears localStorage afterward so the guest cart isn't re-applied.
 *
 * Usage:
 *   await mergeGuestCartOnLogin();
 *   // then re-mount CartProvider with the userId so it fetches the merged cart
 */
export async function mergeGuestCartOnLogin(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (!raw) return;

    const guestItems: CartItem[] = JSON.parse(raw);
    if (!Array.isArray(guestItems) || guestItems.length === 0) return;

    await apiClient.post('/customer/cart/merge', { guestItems });

    await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
  } catch (err) {
    console.error('[CartContext] Failed to merge guest cart on login:', err);
  }
}
