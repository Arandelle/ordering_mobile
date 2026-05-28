import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export type OrderSummary = {
  pending: number;
  preparing: number;
  dispatched: number;
  completed: number;
  cancelled: number;
  total: number;
};
 
export const useCustomerOrderSummary = () => {

  return useQuery<OrderSummary, Error>({
    queryKey: ["order-summary"],
    queryFn: () => apiClient.get("/orders/summary"),
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
