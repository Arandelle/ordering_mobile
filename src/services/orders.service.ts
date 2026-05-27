import { apiClient } from '@/lib/apiClient';
import { OrderType, OrdersApiResponse } from '@/types/orders.type';
import { SubmitReviewPayload, SubmitReviewResponse } from '@/types/review.type';

type OrdersResponseLike =
  | OrdersApiResponse
  | { data: OrderType }
  | OrderType[]
  | OrderType;

type OrdersQueryParams = {
  page?: number;
  limit?: number;
};

const emptyPagination: OrdersApiResponse['pagination'] = {
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const emptyFilters: OrdersApiResponse['filters'] = {
  status: null,
  email: null,
  sortBy: 'createdAt',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function buildQueryString(params: OrdersQueryParams & { ref?: string }) {
  const filtered = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );

  if (!filtered.length) return '';

  return `?${new URLSearchParams(
    filtered.map(([key, value]) => [key, String(value)]),
  ).toString()}`;
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

function normalizeOrderResponse(response: OrdersResponseLike): OrderType | null {
  if (isRecord(response) && Array.isArray(response.data)) {
    return response.data[0] ?? null;
  }

  if (Array.isArray(response)) {
    return response[0] ?? null;
  }

  const order = isRecord(response) && isRecord(response.data) ? response.data : response;
  return isRecord(order) ? (order as unknown as OrderType) : null;
}

export async function getCustomerOrders(params: OrdersQueryParams = {}): Promise<OrdersApiResponse> {
  const response = await apiClient.get<OrdersResponseLike>(
    `/customer/orders/${buildQueryString(params)}`,
  );
  return normalizeOrdersResponse(response);
}

export async function getCustomerOrder(id: string): Promise<OrderType | null> {
  const response = await apiClient.get<OrdersResponseLike>(`/customer/orders/${id}`);
  return normalizeOrderResponse(response);
}

export async function cancelCustomerOrder(id: string): Promise<OrderType | null> {
  const response = await apiClient.patch<OrdersResponseLike>(`/customer/orders/${id}/cancel`);
  return normalizeOrderResponse(response);
}

export async function submitOrderReview(
  orderId: string,
  payload: SubmitReviewPayload,
): Promise<SubmitReviewResponse> {
  return apiClient.post<SubmitReviewResponse, SubmitReviewPayload>(
    `/customer/orders/${orderId}/review`,
    payload,
  );
}

export async function getGuestOrder(
  referenceNumber: string,
  params: OrdersQueryParams = {},
): Promise<OrdersApiResponse> {
  const response = await apiClient.get<OrdersResponseLike>(
    `/customer/orders/guest${buildQueryString({
      ref: referenceNumber.trim(),
      ...params,
    })}`,
  );
  return normalizeOrdersResponse(response);
}
