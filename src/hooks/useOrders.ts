import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  cancelCustomerOrder,
  getCustomerOrder,
  getCustomerOrders,
  getGuestOrder,
} from '@/services/orders.service';
import { OrderType, OrdersApiResponse } from '@/types/orders.type';

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

export function useOrder(id?: string) {
  return useQuery<OrderType | null, Error>({
    queryKey: ['order-detail', id],
    queryFn: () => getCustomerOrder(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation<OrderType | null, Error, string>({
    mutationFn: cancelCustomerOrder,
    onSuccess: (order, orderId) => {
      if (order) {
        queryClient.setQueryData(['order-detail', orderId], order);
      }
      void queryClient.invalidateQueries({ queryKey: ['orders-infinite'] });
      void queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
    },
  });
}
