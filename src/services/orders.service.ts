import { apiClient } from '@/lib/apiClient';
import { OrderType, OrdersApiResponse } from '@/types/orders.type';

type OrdersResponseLike =
  | OrdersApiResponse
  | { data: OrderType }
  | OrderType[]
  | OrderType;

const emptyPagination: OrdersApiResponse['pagination'] = {
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
  hasMore: false,
};

const emptyFilters: OrdersApiResponse['filters'] = {
  status: null,
  email: null,
  sortBy: 'createdAt',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeOrdersResponse(response: OrdersResponseLike): OrdersApiResponse {
  if (isRecord(response) && Array.isArray(response.data)) {
    const responseRecord = response as Record<string, unknown>;
    const pagination = isRecord(responseRecord['pagination'])
      ? (responseRecord['pagination'] as OrdersApiResponse['pagination'])
      : emptyPagination;
    const filters = isRecord(responseRecord['filters'])
      ? (responseRecord['filters'] as OrdersApiResponse['filters'])
      : emptyFilters;

    return {
      data: response.data,
      pagination,
      filters,
    };
  }

  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: { ...emptyPagination, limit: response.length, total: response.length },
      filters: emptyFilters,
    };
  }

  const order = isRecord(response) && isRecord(response.data) ? response.data : response;
  const data = isRecord(order) ? [order as unknown as OrderType] : [];

  return {
    data,
    pagination: { ...emptyPagination, limit: data.length, total: data.length },
    filters: emptyFilters,
  };
}

export async function getCustomerOrders(): Promise<OrdersApiResponse> {
  const response = await apiClient.get<OrdersResponseLike>('/customer/orders/');
  return normalizeOrdersResponse(response);
}

export async function getGuestOrder(referenceNumber: string): Promise<OrdersApiResponse> {
  const query = new URLSearchParams({ ref: referenceNumber.trim() }).toString();
  const response = await apiClient.get<OrdersResponseLike>(`/customer/orders/guest?${query}`);
  return normalizeOrdersResponse(response);
}
