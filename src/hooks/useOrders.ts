import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { getCustomerOrders, getGuestOrder } from '@/services/orders.service';
import { OrdersApiResponse } from '@/types/orders.type';

const ORDERS_PAGE_SIZE = 20;

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

  return useInfiniteQuery<
    OrdersApiResponse,
    Error,
    InfiniteData<OrdersApiResponse>,
    readonly unknown[],
    number
  >({
    queryKey:
      params.userType === 'customer'
        ? ['orders-infinite', 'customer']
        : ['orders-infinite', 'guest', params.referenceNumber.trim()],
    queryFn: ({ pageParam }) =>
      params.userType === 'customer'
        ? getCustomerOrders({ page: pageParam, limit: ORDERS_PAGE_SIZE })
        : getGuestOrder(params.referenceNumber, { page: pageParam, limit: ORDERS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages, hasNextPage } = lastPage.pagination;
      return hasNextPage || page < totalPages ? page + 1 : undefined;
    },
    enabled:
      params.userType === 'customer'
        ? enabled
        : enabled && params.referenceNumber.trim().length > 0,
    staleTime: 30_000,
  });
}
