import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/lib/auth-client";
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

  const {data: session} = authClient.useSession();
  const userId = session?.user?.id;

  return useQuery<OrderSummary, Error>({
    queryKey: ["order-summary", userId],
    queryFn: () => apiClient.get("/orders/summary"),
    staleTime: 30_000,
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
