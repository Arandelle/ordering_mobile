import { apiClient } from '@/lib/apiClient';
import type {
  MembershipStatusResponse,
  MembershipCheckoutResponse,
} from '@/types/membership.type';

export async function getMembershipStatus(): Promise<MembershipStatusResponse> {
  return apiClient.get<MembershipStatusResponse>('/customer/membership/status');
}

export async function getMembershipQR(): Promise<{ memberId: string }> {
  return apiClient.get<{ memberId: string }>('/customer/membership/qr');
}

export async function initiateMembershipCheckout(
  selectedTierId: string,
  dateOfBirth?: string,
): Promise<MembershipCheckoutResponse> {
  const payload: Record<string, string> = { selectedTierId };
  if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
  return apiClient.post<MembershipCheckoutResponse, Record<string, string>>(
    '/paymaya/membership/checkout',
    payload,
  );
}
