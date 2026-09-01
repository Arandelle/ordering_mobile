import { OrderType } from '@/types/orders.type';
import { PAYMENT_STATUSES } from '@/types/payment.type';

export function formatDisplayLabel(value?: string | null) {
  if (!value) return 'Pending';

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Human-readable status label for pills — prefixes "Paid" when
 * the Maya payment already succeeded so unpaid/paid orders read differently.
 */
export function getOrderStatusLabel(order: OrderType) {
  const statusLabel = formatDisplayLabel(order.status);
  const isPaid = order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS;

  return isPaid ? `Paid - ${statusLabel}` : statusLabel;
}
