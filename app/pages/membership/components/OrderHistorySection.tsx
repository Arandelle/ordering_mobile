import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UsageHistoryItem } from '@/types/membership.type';
import { formatDate } from '@/helper/formatter';

type OrderHistorySectionProps = {
  orders: UsageHistoryItem[];
};

const OrderHistorySection = ({ orders }: OrderHistorySectionProps) => {
  return (
    <View>
      <View className="mb-3 flex-row items-end justify-between px-1">
        <View>
          <Text className="text-xl font-bold text-gray-900">Order History</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Orders where your membership discount was applied.
          </Text>
        </View>
        <View className="rounded-full bg-white px-3 py-1">
          <Text className="text-sm font-semibold text-gray-600">{orders.length} orders</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white p-8">
          <Ionicons name="receipt-outline" size={32} color="#9ca3af" />
          <Text className="mt-3 font-semibold text-gray-800">No membership orders yet</Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            Your discounted orders will appear here after checkout.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {orders.map((order) => (
            <View key={order.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="font-mono text-xs text-gray-500">
                    {order.referenceNumber ?? order.id}
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(order.createdAt)}
                  </Text>
                </View>
                <View className="rounded-full bg-gray-100 px-3 py-1">
                  <Text className="text-xs font-bold uppercase text-gray-600">{order.status}</Text>
                </View>
              </View>

              <View className="mt-3 divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <View key={`${order.id}-${idx}`} className="flex-row items-center justify-between py-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{item.name}</Text>
                      <Text className="text-sm text-gray-500">
                        Qty {item.quantity} × ₱{item.price}
                      </Text>
                    </View>
                    <Text className="font-semibold text-gray-800">
                      ₱{item.price * item.quantity}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="mt-3 flex-row gap-2 rounded-lg bg-gray-50 p-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Subtotal</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    ₱{order.subtotalAmount}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Savings</Text>
                  <Text className="text-sm font-semibold text-emerald-700">
                    −₱{order.discountAmount}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Paid</Text>
                  <Text className="text-sm font-semibold text-gray-900">₱{order.totalAmount}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default OrderHistorySection;
