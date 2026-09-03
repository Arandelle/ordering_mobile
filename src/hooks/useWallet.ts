import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  getWallet,
  getWalletTransactions,
  initiateWalletTopup,
  type WalletResponse,
  type WalletTransactionsResponse,
  type WalletTransaction,
} from '@/services/wallet.service';

const WALLET_TX_PAGE_SIZE = 5;

// ─── Wallet Balance ──────────────────────────────────────────────────────────

export function useWallet(options?: { enabled?: boolean }) {
  return useQuery<WalletResponse, Error>({
    queryKey: ['wallet'],
    queryFn: getWallet,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// ─── Wallet Transactions (infinite) ──────────────────────────────────────────

export function useWalletTransactions(initialEnabled = true) {
  return useInfiniteQuery<
    WalletTransactionsResponse,
    Error,
    { pages: WalletTransactionsResponse[]; pageParams: number[] },
    readonly unknown[],
    number
  >({
    queryKey: ['wallet-transactions'],
    queryFn: ({ pageParam }) =>
      getWalletTransactions({ page: pageParam, limit: WALLET_TX_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages, hasNextPage } = lastPage.pagination;
      return hasNextPage || page < totalPages ? page + 1 : undefined;
    },
    enabled: initialEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

// ─── Wallet Topup ────────────────────────────────────────────────────────────

export function useWalletTopup() {
  const queryClient = useQueryClient();

  return useMutation<
    { redirectUrl: string; referenceNumber: string; amount: number },
    Error,
    number
  >({
    mutationFn: initiateWalletTopup,
    onSuccess: async (data) => {
      if (data.redirectUrl) {
        await WebBrowser.openBrowserAsync(data.redirectUrl);
        // Refetch wallet balance after returning from Maya
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function flattenTransactions(data: InfiniteData<WalletTransactionsResponse> | undefined): WalletTransaction[] {
  return data?.pages.flatMap((page) => page.transactions) ?? [];
}
