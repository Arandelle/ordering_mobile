import { ORDER_STATUSES, OrderStatus } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';

export function getStatusClasses(status: OrderType['status'] | OrderStatus) {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return {
        container: 'border-amber-200/70 bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
      };
    case ORDER_STATUSES.PREPARING:
      return {
        container: 'border-orange-200/70 bg-orange-50',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
      };
    case ORDER_STATUSES.READY:
      return {
        container: 'border-emerald-200/70 bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case ORDER_STATUSES.COMPLETED:
      return {
        container: 'border-green-200/70 bg-green-50',
        text: 'text-green-700',
        dot: 'bg-green-500',
      };
    case ORDER_STATUSES.CANCELLED:
    case ORDER_STATUSES.FAILED:
    case ORDER_STATUSES.EXPIRED:
      return {
        container: 'border-red-200/70 bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500',
      };
    default:
      return {
        container: 'border-gray-200 bg-gray-100',
        text: 'text-gray-700',
        dot: 'bg-gray-400',
      };
  }
}
