import { PAYMENT_STATUSES } from '@/types/payment.type';

/** Friendly label for a payment method key — "cod" -> "Cash on Delivery" */
export function getPaymentMethodLabel(method?: string | null) {
  switch (method?.toLowerCase()) {
    case 'maya':
      return 'Maya';
    case 'cod':
      return 'Cash on Delivery';
    case 'wallet':
      return 'Wallet';
    default:
      return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Not available';
  }
}

/** Presentation meta for a payment status — avoids exposing raw API values */
export function getPaymentStatusMeta(status?: string | null) {
  switch (status) {
    case PAYMENT_STATUSES.PAYMENT_SUCCESS:
      return { label: 'Paid', dot: 'bg-emerald-500' };
    case PAYMENT_STATUSES.PAYMENT_FAILED:
      return { label: 'Failed', dot: 'bg-red-500' };
    case PAYMENT_STATUSES.PAYMENT_EXPIRED:
      return { label: 'Expired', dot: 'bg-red-400' };
    default:
      return { label: 'Pending', dot: 'bg-amber-500' };
  }
}
