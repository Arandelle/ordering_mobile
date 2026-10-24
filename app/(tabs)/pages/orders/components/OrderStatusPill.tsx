import { Text, View } from 'react-native';

import { OrderType } from '@/types/orders.type';

import { getStatusClasses } from '../helper/getStatusClasses';

/** Compact status pill with a colored dot — used across order cards and details */
export function OrderStatusPill({
  status,
  label,
  size = 'sm',
}: {
  status: OrderType['status'];
  /** Overrides the raw status text — e.g. "Paid - Preparing" */
  label?: string;
  size?: 'sm' | 'md';
}) {
  const classes = getStatusClasses(status);
  const isLarge = size === 'md';

  return (
    <View
      className={`flex-row items-center rounded-full border ${classes.container} ${
        isLarge ? 'gap-1.5 px-3 py-1' : 'gap-1 px-2.5 py-1'
      }`}>
      <View className={`rounded-full ${classes.dot} ${isLarge ? 'h-2 w-2' : 'h-1.5 w-1.5'}`} />
      <Text
        className={`font-bold capitalize ${classes.text} ${isLarge ? 'text-xs' : 'text-[11px]'}`}>
        {label ?? status}
      </Text>
    </View>
  );
}
