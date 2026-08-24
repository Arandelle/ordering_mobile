import { ORDER_STATUSES } from "@/types/order-constant";
import { OrderType } from "@/types/orders.type";

export function getStatusClasses(status: OrderType['status']) {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return { container: 'bg-amber-50', text: 'text-amber-700' };
    case ORDER_STATUSES.PREPARING:
      return { container: 'bg-orange-50', text: 'text-orange-700' };
    case ORDER_STATUSES.READY:
      return { container: 'bg-emerald-50', text: 'text-emerald-700' };
    case ORDER_STATUSES.COMPLETED:
      return { container: 'bg-green-50', text: 'text-green-700' };
    case ORDER_STATUSES.CANCELLED:
    case ORDER_STATUSES.FAILED:
    case ORDER_STATUSES.EXPIRED:
      return { container: 'bg-red-50', text: 'text-red-700' };
    default:
      return { container: 'bg-gray-100', text: 'text-gray-700' };
  }
}