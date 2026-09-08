import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckoutAddressDetails } from '@/context/CheckoutContext';

type AddressApiShape = Partial<{
  line1: string;
  line2: string;
  city: string;
  cityCode: string;
  province: string;
  zipCode: string;
  postalCode: string;
  country: string;
  landmark: string;
  barangayCode: string;
  subMunicipality: string;
  subMunicipalityCode: string;
  region: string;
  regionCode: string;
  placeName: string;
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

function isAddressEnvelope(
  response: AddressResponse
): response is { data?: AddressApiShape | null } {
  return Boolean(response && typeof response === 'object' && 'data' in response);
}

function isShippingAddressEnvelope(
  response: AddressResponse
): response is { shippingAddress?: AddressApiShape | null } {
  return Boolean(response && typeof response === 'object' && 'shippingAddress' in response);
}

function normalizeCoordinates(
  raw: AddressApiShape['coordinates'],
): { lat: number; lng: number } | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const [a, b] = raw;
    if (typeof a === 'number' && typeof b === 'number') {
      // GeoJSON is [lng, lat]
      return { lat: b, lng: a };
    }
    return undefined;
  }
  const lat = typeof raw.lat === 'string' ? parseFloat(raw.lat) : raw.lat;
  const lng = typeof raw.lng === 'string' ? parseFloat(raw.lng) : raw.lng;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  return undefined;
}

function normalizeAddressResponse(response: AddressResponse): CheckoutAddressDetails | null {
  if (!response) return null;

  const address = isAddressEnvelope(response)
    ? response.data
    : isShippingAddressEnvelope(response)
      ? response.shippingAddress
      : response;
  if (!address) return null;

  return {
    line1: address.line1 ?? '',
    line2: address.line2 ?? '',
    city: address.city ?? '',
    cityCode: address.cityCode ?? '',
    province: address.province ?? '',
    zipCode: address.zipCode ?? address.postalCode ?? '',
    country: address.country ?? 'Philippines',
    landmark: address.landmark ?? '',
    barangayCode: address.barangayCode ?? '',
    subMunicipality: address.subMunicipality ?? '',
    subMunicipalityCode: address.subMunicipalityCode ?? '',
    region: address.region ?? '',
    regionCode: address.regionCode ?? '',
    placeName: address.placeName ?? '',
    coordinates: normalizeCoordinates(address.coordinates),
  };
}

function toAddressPayload(address: CheckoutAddressDetails) {
  return {
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    cityCode: address.cityCode?.trim() || '',
    province: address.province.trim(),
    zipCode: address.zipCode.trim(),
    postalCode: address.zipCode.trim(),
    country: address.country.trim(),
    landmark: address.landmark.trim(),
    barangayCode: address.barangayCode?.trim() || '',
    subMunicipality: address.subMunicipality?.trim() || '',
    subMunicipalityCode: address.subMunicipalityCode?.trim() || '',
    region: address.region?.trim() || '',
    regionCode: address.regionCode?.trim() || '',
    placeName: address.placeName?.trim() || '',
    coordinates: address.coordinates
      ? { lat: address.coordinates.lat, lng: address.coordinates.lng }
      : undefined,
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

export function useUpdateMyAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: CheckoutAddressDetails) => {
      const response = await apiClient.put<AddressResponse>('/customer/address', {
        address: toAddressPayload(address),
      });

      return normalizeAddressResponse(response) ?? address;
    },
    onSuccess: (address) => {
      queryClient.setQueryData(['user_address'], address);
      queryClient.invalidateQueries({ queryKey: ['user_address'] });
    },
  });
}
