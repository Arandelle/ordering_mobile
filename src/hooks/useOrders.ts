import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  cancelCustomerOrder,
  createMayaCheckoutForOrder,
  getCustomerOrder,
  getCustomerOrders,
  getGuestOrder,
  submitOrderReview,
} from '@/services/orders.service';
import { ORDER_STATUSES, OrderStatus } from '@/types/order-constant';
import { CreateOrderResponse, OrderType, OrdersApiResponse } from '@/types/orders.type';
import { SubmitReviewPayload, SubmitReviewResponse } from '@/types/review.type';

const ORDERS_PAGE_SIZE = 20;
const ACTIVE_ORDER_REFETCH_INTERVAL_MS = 10_000;
const ORDERS_REFETCH_INTERVAL_MS = 15_000;

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
]);

function hasActiveOrders(response?: OrdersApiResponse) {
  return response?.data.some((order) => ACTIVE_ORDER_STATUSES.has(order.status)) ?? false;
}

function isActiveOrder(order?: OrderType | null) {
  return order ? ACTIVE_ORDER_STATUSES.has(order.status) : false;
}

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
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.pages.some(hasActiveOrders) ? ORDERS_REFETCH_INTERVAL_MS : false,
  });
}

export function useOrder(id?: string) {
  return useQuery<OrderType | null, Error>({
    queryKey: ['order-detail', id],
    queryFn: () => getCustomerOrder(id ?? ''),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      isActiveOrder(query.state.data) ? ACTIVE_ORDER_REFETCH_INTERVAL_MS : false,
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

export function useSubmitReview(orderId?: string) {
  const queryClient = useQueryClient();

  return useMutation<SubmitReviewResponse, Error, SubmitReviewPayload>({
    mutationFn: (payload) => submitOrderReview(orderId ?? '', payload),
    onSuccess: () => {
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['orders-infinite'] });
      void queryClient.invalidateQueries({ queryKey: ['order-summary'] });
    },
  });
}

export function useCreateMayaCheckout() {
  const queryClient = useQueryClient();

  return useMutation<CreateOrderResponse, Error, string>({
    mutationFn: createMayaCheckoutForOrder,
    onSuccess: (_response, orderId) => {
      void queryClient.invalidateQueries({ queryKey: ['orders-infinite'] });
      void queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
    },
  });
}
