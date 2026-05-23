import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Days = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface SettingsType {
  _id?: string;
  storeName: string;
  address: string;
  contact: {
    phone?: string;
    email?: string;
    viber?: string;
  };
  operatingHours: {
    days: Days[];      // which days are active
    openTime: string;  // shared open time for all active days
    closeTime: string; // shared close time for all active days
    isClosed: boolean; // override: mark entire store as temporarily closed
  };
}

interface SettingsResponse {
  data: SettingsType | null;
}


// ─── Query Keys ───────────────────────────────────────────────────────────────

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch the current store settings. Returns null on first-time setup. */
export function useSettings() {
  return useQuery<SettingsResponse, Error, SettingsType | null>({
    queryKey: settingsKeys.detail(),
    queryFn: () => apiClient.get<SettingsResponse>("/settings"),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    select: (res) => res.data
  });
}