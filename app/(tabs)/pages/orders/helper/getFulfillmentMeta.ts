import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { FULFILLMENT_TYPE, FulfillmentType } from '@/types/orders.type';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Icon + label pair for an order's fulfillment type */
export function getFulfillmentMeta(type?: FulfillmentType): {
  icon: IoniconName;
  label: string;
} {
  switch (type) {
    case FULFILLMENT_TYPE.DELIVERY:
      return { icon: 'bicycle-outline', label: 'Delivery' };
    case FULFILLMENT_TYPE.PICKUP:
      return { icon: 'bag-handle-outline', label: 'Pickup' };
    case FULFILLMENT_TYPE.DINE_IN:
      return { icon: 'restaurant-outline', label: 'Dine-in' };
    default:
      return { icon: 'receipt-outline', label: 'Order' };
  }
}
