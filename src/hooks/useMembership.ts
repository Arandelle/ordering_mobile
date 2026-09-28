import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  getMembershipStatus,
  getMembershipQR,
  initiateMembershipCheckout,
} from '@/services/membership.service';
import type { MembershipCheckoutResponse } from '@/types/membership.type';

export function useMembershipStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['customer', 'membership', 'status'],
    queryFn: getMembershipStatus,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: false,
  });
}

export function useMembershipQR(enabled: boolean) {
  return useQuery({
    queryKey: ['customer', 'membership', 'qr'],
    queryFn: getMembershipQR,
    enabled,
    staleTime: 19 * 60 * 1000,
    retry: false,
  });
}

export function useMembershipCheckout() {
  const queryClient = useQueryClient();

  return useMutation<
    MembershipCheckoutResponse,
    Error,
    { tierId: string; dateOfBirth?: string }
  >({
    mutationFn: ({ tierId, dateOfBirth }) =>
      initiateMembershipCheckout(tierId, dateOfBirth),
    onSuccess: async (data) => {
      if (data.redirectUrl) {
        await WebBrowser.openBrowserAsync(data.redirectUrl);
        await queryClient.invalidateQueries({
          queryKey: ['customer', 'membership', 'status'],
        });
      }
    },
  });
}
