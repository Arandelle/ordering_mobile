// ─── Stock Badge ──────────────────────────────────────────────────────────────

import { cn } from '@/lib/cn';
import { STOCK_STATUSES } from '@/types/inventories';
import { Text, View } from 'react-native';

const getStockLabel = (status: string, quantity: number | null): string => {
  if (status === STOCK_STATUSES.OUT_OF_STOCK) return 'Out of stock';
  if (status === STOCK_STATUSES.LOW_STOCK) return `Only ${quantity} left!`;
  return `${quantity} available`;
};

export function StockBadge({ status, quantity, className }: { status: string; quantity: number | null, className?: string }) {
  const isOutOfStock = status === STOCK_STATUSES.OUT_OF_STOCK || (quantity ?? 1) <= 0;
  const isLowStock = !isOutOfStock && status === STOCK_STATUSES.LOW_STOCK;

  if (!isOutOfStock && !isLowStock) return null;

  return (
    <>
      {/* Dim overlay for out of stock */}
      {isOutOfStock && <View className="absolute inset-0 z-10 rounded-t-lg bg-black/50" />}

      {/* Badge pill */}
      <View
        className={cn(`elevation absolute left-2 top-2 z-20 rounded-2xl px-3 py-1 shadow-md shadow-black ${isOutOfStock ? 'bg-red-500' : 'bg-amber-500'}`, className)}>
        <Text className="text-sm font-bold text-white">{getStockLabel(status, quantity)}</Text>
      </View>
    </>
  );
}
