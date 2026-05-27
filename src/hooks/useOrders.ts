import { useQuery } from '@tanstack/react-query';
import { getCustomerOrders, getGuestOrder } from '@/services/orders.service';
import { OrdersApiResponse } from '@/types/orders.type';

type UseOrdersParams =
  | {
      userType: 'customer';
      enabled?: boolean;
    }
  | {
      userType: 'guest';
      referenceNumber: string;
      enabled?: boolean;
    };

export function useOrders(params: UseOrdersParams) {
  const enabled = params.enabled ?? true;

  return useQuery<OrdersApiResponse, Error>({
    queryKey:
      params.userType === 'customer'
        ? ['orders', 'customer']
        : ['orders', 'guest', params.referenceNumber.trim()],
    queryFn: () =>
      params.userType === 'customer'
        ? getCustomerOrders()
        : getGuestOrder(params.referenceNumber),
    enabled:
      params.userType === 'customer'
        ? enabled
        : enabled && params.referenceNumber.trim().length > 0,
    staleTime: 30_000,
  });
}
