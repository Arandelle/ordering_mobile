import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ORDER_STATUSES, OrderStatus } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';

const STEPS = [
  { key: 'placed', label: 'Placed', field: undefined },
  { key: 'preparing', label: 'Preparing', field: 'preparingAt' },
  { key: 'ready', label: 'Ready', field: 'readyAt' },
  { key: 'completed', label: 'Completed', field: 'completedAt' },
] as const;

function getCurrentStepIndex(status: OrderType['status'] | OrderStatus) {
  switch (status) {
    case ORDER_STATUSES.PREPARING:
      return 1;
    case ORDER_STATUSES.READY:
    case 'dispatch':
    case 'ready_for_pickup':
      return 2;
    case ORDER_STATUSES.COMPLETED:
      return 3;
    case ORDER_STATUSES.PENDING:
    default:
      return 0;
  }
}

function formatStepTime(value?: string) {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Horizontal progress stepper: Placed -> Preparing -> Ready -> Completed */
export function OrderTimeline({ order }: { order: OrderType }) {
  const currentIndex = getCurrentStepIndex(order.status);

  return (
    <View className="flex-row items-start">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const time = step.field ? order.timeline?.[step.field] : order.createdAt;
        const timeLabel = formatStepTime(time);

        return (
          <View key={step.key} className="flex-1 items-center">
            <View className="flex-row items-center self-stretch">
              <View
                className={`h-[2px] flex-1 ${
                  idx === 0
                    ? 'bg-transparent'
                    : idx <= currentIndex
                      ? 'bg-[#e13e00]'
                      : 'bg-gray-200'
                }`}
              />
              <View
                className={`h-6 w-6 items-center justify-center rounded-full ${
                  isDone
                    ? 'bg-[#e13e00]'
                    : isCurrent
                      ? 'border-2 border-[#e13e00] bg-[#fdeee7]'
                      : 'border-2 border-gray-200 bg-white'
                }`}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : isCurrent ? (
                  <View className="h-2 w-2 rounded-full bg-[#e13e00]" />
                ) : null}
              </View>
              <View
                className={`h-[2px] flex-1 ${
                  idx === STEPS.length - 1
                    ? 'bg-transparent'
                    : idx < currentIndex
                      ? 'bg-[#e13e00]'
                      : 'bg-gray-200'
                }`}
              />
            </View>

            <Text
              className={`mt-2 text-[11px] font-bold ${
                idx > currentIndex ? 'text-gray-400' : 'text-gray-900'
              }`}>
              {step.label}
            </Text>
            <Text className="mt-0.5 text-[10px] text-gray-400">{timeLabel || '—'}</Text>
          </View>
        );
      })}
    </View>
  );
}
