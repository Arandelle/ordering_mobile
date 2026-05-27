import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { CreateOrderPayload, CreateOrderResponse } from '@/types/orders.type';

const CHECKOUT_DRAFT_KEY = 'checkout_draft';

export type CheckoutPaymentMethod = CreateOrderPayload['paymentMethod'];

export interface CheckoutPersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note: string;
}

export interface CheckoutAddressDetails {
  line1: string;
  line2: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  landmark: string;
  coordinates: {
    lat: string;
    lng: string;
  };
}

export interface CheckoutDraft {
  personalDetails?: CheckoutPersonalDetails;
  shippingAddress?: CheckoutAddressDetails;
  paymentMethod?: CheckoutPaymentMethod;
}

type AddressApiShape = Partial<{
  line1: string;
  line2: string;
  city: string;
  province: string;
  zipCode: string;
  postalCode: string;
  country: string;
  landmark: string;
  coordinates:
    | {
        lat?: number | string;
        lng?: number | string;
      }
    | [number, number];
}>;

type AddressResponse =
  | AddressApiShape
  | { data?: AddressApiShape | null }
  | { shippingAddress?: AddressApiShape | null }
  | null;

export const emptyPersonalDetails: CheckoutPersonalDetails = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  note: '',
};

export const emptyAddressDetails: CheckoutAddressDetails = {
  line1: '',
  line2: '',
  city: '',
  province: '',
  zipCode: '',
  country: 'Philippines',
  landmark: '',
  coordinates: {
    lat: '',
    lng: '',
  },
};

async function getCheckoutDraft(): Promise<CheckoutDraft> {
  const raw = await AsyncStorage.getItem(CHECKOUT_DRAFT_KEY);
  if (!raw) return {};
  return JSON.parse(raw) as CheckoutDraft;
}

async function setCheckoutDraft(nextDraft: CheckoutDraft): Promise<CheckoutDraft> {
  await AsyncStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(nextDraft));
  return nextDraft;
}

function isAddressEnvelope(response: AddressResponse): response is { data?: AddressApiShape | null } {
  return Boolean(response && typeof response === 'object' && 'data' in response);
}

function isShippingAddressEnvelope(
  response: AddressResponse,
): response is { shippingAddress?: AddressApiShape | null } {
  return Boolean(response && typeof response === 'object' && 'shippingAddress' in response);
}

function normalizeAddressResponse(response: AddressResponse): CheckoutAddressDetails | null {
  if (!response) return null;

  const address = isAddressEnvelope(response)
    ? response.data
    : isShippingAddressEnvelope(response)
      ? response.shippingAddress
      : response;
  if (!address) return null;

  const coordinates = address.coordinates;
  const lat = Array.isArray(coordinates) ? coordinates[1] : coordinates?.lat;
  const lng = Array.isArray(coordinates) ? coordinates[0] : coordinates?.lng;

  return {
    line1: address.line1 ?? '',
    line2: address.line2 ?? '',
    city: address.city ?? '',
    province: address.province ?? '',
    zipCode: address.zipCode ?? address.postalCode ?? '',
    country: address.country ?? 'Philippines',
    landmark: address.landmark ?? '',
    coordinates: {
      lat: lat === undefined || lat === null ? '' : String(lat),
      lng: lng === undefined || lng === null ? '' : String(lng),
    },
  };
}

export function useMyAddress(enabled = true) {
  return useQuery({
    queryKey: ['user_address'],
    queryFn: async () => {
      const response = await apiClient.get<AddressResponse>('/customer/address');
      return normalizeAddressResponse(response);
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

export function useCheckoutDraft() {
  const queryClient = useQueryClient();

  const draftQuery = useQuery({
    queryKey: ['checkout-draft'],
    queryFn: getCheckoutDraft,
    staleTime: Infinity,
  });

  const savePersonalDetails = useMutation({
    mutationFn: async (personalDetails: CheckoutPersonalDetails) => {
      const currentDraft = await getCheckoutDraft();
      return setCheckoutDraft({ ...currentDraft, personalDetails });
    },
    onSuccess: (draft) => queryClient.setQueryData(['checkout-draft'], draft),
  });

  const saveAddressDetails = useMutation({
    mutationFn: async (shippingAddress: CheckoutAddressDetails) => {
      const currentDraft = await getCheckoutDraft();
      return setCheckoutDraft({ ...currentDraft, shippingAddress });
    },
    onSuccess: (draft) => queryClient.setQueryData(['checkout-draft'], draft),
  });

  const savePaymentMethod = useMutation({
    mutationFn: async (paymentMethod: CheckoutPaymentMethod) => {
      const currentDraft = await getCheckoutDraft();
      return setCheckoutDraft({ ...currentDraft, paymentMethod });
    },
    onSuccess: (draft) => queryClient.setQueryData(['checkout-draft'], draft),
  });

  const clearCheckoutDraft = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(CHECKOUT_DRAFT_KEY);
      return {};
    },
    onSuccess: (draft) => queryClient.setQueryData(['checkout-draft'], draft),
  });

  return {
    draft: draftQuery.data,
    isLoading: draftQuery.isLoading,
    savePersonalDetails,
    saveAddressDetails,
    savePaymentMethod,
    clearCheckoutDraft,
  };
}

export function useSubmitCheckout(paymentMethod: CheckoutPaymentMethod) {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) =>
      paymentMethod === 'cod'
        ? apiClient.post<CreateOrderResponse, CreateOrderPayload>('/customer/cod-checkout', payload)
        : apiClient.post<CreateOrderResponse, CreateOrderPayload>('/paymaya/checkout', payload),
  });
}
