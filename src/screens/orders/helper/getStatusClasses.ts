import { OrderType, ORDER_STATUSES, OrderStatus } from '@/types/orders.type';

export default function getStatusClasses(status: OrderType['status'] | OrderStatus) {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return {
        container: 'border-amber-200/70 bg-amber-50',
        text: 'text-amber-700',
      };
    case ORDER_STATUSES.PREPARING:
      return {
        container: 'border-orange-200/70 bg-orange-50',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
      };
    case ORDER_STATUSES.READY_FOR_PICKUP:
      return {
        container: 'border-emerald-200/70 bg-emerald-50',
        text: 'text-emerald-700',
      };
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.CONFIRMED:
      return {
        container: 'border-green-200/70 bg-green-50',
        text: 'text-green-700',
      };
    case ORDER_STATUSES.CANCELLED:
    case ORDER_STATUSES.FAILED:
    case ORDER_STATUSES.EXPIRED:
      return {
        container: 'border-red-200/70 bg-red-50',
        text: 'text-red-700',
      };
    default:
      return {
        container: 'border-gray-200 bg-gray-100',
        text: 'text-gray-700',
      };
  }
}
