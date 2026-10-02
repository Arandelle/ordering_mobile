import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavourites, toggleFavourite } from '@/services/favourites.service';
import { Product } from '@/types/products.type';

// ─── LocalStorage helpers for guest favourites ──────────────────────────────

const GUEST_FAVOURITES_KEY = 'guest_favourites';

async function getGuestFavouriteIds(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(GUEST_FAVOURITES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setGuestFavouriteIds(ids: string[]) {
  try {
    await AsyncStorage.setItem(GUEST_FAVOURITES_KEY, JSON.stringify(ids));
  } catch {
    // storage full — ignore
  }
}

// ─── Server hooks ───────────────────────────────────────────────────────────

/** Fetch the current user's favourited products */
export const useFavourites = (enabled = true) => {
  return useQuery({
    queryKey: ['favourites'],
    queryFn: getFavourites,
    enabled,
    staleTime: 30_000,
  });
};

/** Returns just the IDs of favourited products (lightweight check) */
export const useFavouriteIds = (enabled = true) => {
  const { data, ...rest } = useFavourites(enabled);
  const ids = data?.data?.map((p) => p._id) ?? [];
  return { data: ids, ...rest };
};

/** Toggle a product in/out of favourites with optimistic UI */
export const useToggleFavourite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await toggleFavourite(productId);
      return res.data.isFavourited;
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['favourites'] });
      const previous = queryClient.getQueryData<{ data: Product[] }>(['favourites']);

      queryClient.setQueryData<{ data: Product[] }>(['favourites'], (old) => {
        if (!old) return old;
        const exists = old.data.some((p) => p._id === productId);
        if (exists) {
          return { ...old, data: old.data.filter((p) => p._id !== productId) };
        }
        return old;
      });

      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favourites'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });
};

// ─── Guest favourites hook ──────────────────────────────────────────────────

/** Manages guest favourites in AsyncStorage — no API calls */
export const useGuestFavourites = () => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    getGuestFavouriteIds().then(setIds);
  }, []);

  const toggle = useCallback((productId: string): boolean => {
    let nextIds: string[] = [];
    let isNowFav = false;

    setIds((current) => {
      const exists = current.includes(productId);
      nextIds = exists ? current.filter((id) => id !== productId) : [...current, productId];
      isNowFav = !exists;
      setGuestFavouriteIds(nextIds);
      return nextIds;
    });

    return isNowFav;
  }, []);

  const isFavourited = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  return { ids, toggle, isFavourited };
};

// ─── Unified hook — picks server or guest based on auth state ──────────────

/**
 * Single hook that works for both logged-in and guest users.
 * - Logged in: uses server API with optimistic updates
 * - Guest: uses AsyncStorage, no API calls
 *
 * Returns consistent interface regardless of auth state.
 */
export const useFavouriteToggle = (isLoggedIn: boolean) => {
  const { data: serverIds } = useFavouriteIds(isLoggedIn);
  const toggleServer = useToggleFavourite();
  const guest = useGuestFavourites();

  // Local optimistic state for instant UI feedback
  const [localOverride, setLocalOverride] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<boolean | null>(null);

  // Reset local override when server/guest data refreshes
  useEffect(() => {
    setLocalOverride(null);
    setLocalValue(null);
  }, [serverIds, guest.ids]);

  const isFavourited = useCallback(
    (productId: string): boolean => {
      if (localOverride === productId && localValue !== null) {
        return localValue;
      }
      if (isLoggedIn) {
        return serverIds?.includes(productId) ?? false;
      }
      return guest.isFavourited(productId);
    },
    [isLoggedIn, serverIds, guest, localOverride, localValue],
  );

  const toggle = useCallback(
    (productId: string) => {
      const currentlyFav = isFavourited(productId);
      // Optimistic: flip instantly
      setLocalOverride(productId);
      setLocalValue(!currentlyFav);

      if (isLoggedIn) {
        toggleServer.mutate(productId);
      } else {
        guest.toggle(productId);
      }
    },
    [isLoggedIn, isFavourited, toggleServer, guest],
  );

  return { isFavourited, toggle };
};
