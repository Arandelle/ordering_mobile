import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Product } from "@/types/products";
import { PaginationMeta } from "@/utils/query-helpers";
import { StockStatus } from "@/types/inventories";

interface ProductResponse {
  data: Product[];
  pagination: PaginationMeta;
}

interface SpecificProductResponse {
  data: Product;
}

interface ProductParams {
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  productType?: string;
  categoryName?: string;
  enabled?: boolean;
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return "";
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (!filtered.length) return "";
  return "?" + new URLSearchParams(Object.fromEntries(filtered)).toString();
}

export const useProductsInfinite = (params?: ProductParams) => {
  // Pull enabled out so it never leaks into the query string
  const { enabled = true, ...queryParams } = params ?? {};

  return useInfiniteQuery<ProductResponse, Error>({
    queryKey: ["products-infinite", queryParams],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<ProductResponse>(
        `/products${buildQueryString({
          ...queryParams,
          page: pageParam,
          limit: queryParams.limit ?? 20,
        })}`
      ),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
    enabled,
  });
};

export type BranchProduct = Product & {
  quantity?: number;
  status?: StockStatus;
};

export type BranchProductResponse = {
  success: boolean;
  branchId: string;
  data: BranchProduct[];
  pagination: PaginationMeta
};

// hooks/api/useBranchProductInfinite.ts
export const useBranchProductInfinite = (branchId: string, params?: {
  categoryName?: string;
  subcategoryName?: string;
  limit?: number;
  enabled: boolean
}) => {
  return useInfiniteQuery({
    queryKey: ["branch-products-infinite", branchId, params],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<BranchProductResponse>(`/customer/branch/products${buildQueryString({
        branchId,
        page: pageParam,
        limit: params?.limit ?? 1,
        categoryName: params?.categoryName,
        subcategoryName: params?.subcategoryName,
      })}`),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!branchId && (params?.enabled ?? true),
    staleTime: 30_000,
  });
};

export const useProduct = (id: string, branchId?: string | undefined) => {
  return useQuery({
    queryKey: ["products", id, branchId], // ['products', '123'] is different from ['products', '456']
    queryFn: () => apiClient.get<SpecificProductResponse>(`/products/${id}${buildQueryString({branchId})}`),
    enabled: !!id, // Only run query if ID exists
  });
};