import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RedemptionHistoryItem } from '@/types/membership.type';

function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type RedemptionHistorySectionProps = {
  records: RedemptionHistoryItem[];
};

const RedemptionHistorySection = ({ records }: RedemptionHistorySectionProps) => {
  return (
    <View>
      <View className="mb-3 flex-row items-end justify-between px-1">
        <View>
          <Text className="text-xl font-bold text-gray-900">Redemption History</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Benefits redeemed in-store through your membership.
          </Text>
        </View>
        <View className="rounded-full bg-white px-3 py-1">
          <Text className="text-sm font-semibold text-gray-600">{records.length} records</Text>
        </View>
      </View>

      {records.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white p-8">
          <Ionicons name="gift-outline" size={32} color="#9ca3af" />
          <Text className="mt-3 font-semibold text-gray-800">No redemptions yet</Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            Visit a branch and present your membership QR to redeem benefits.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {records.map((record) => (
            <View key={record.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {record.branchName ?? 'Unknown Branch'}
                  </Text>
                  <Text className="mt-0.5 text-xs capitalize text-gray-500">
                    {record.channel} · {formatDate(record.createdAt)}
                  </Text>
                </View>
                {record.discountAmount > 0 && (
                  <View className="rounded-full bg-emerald-100 px-3 py-1">
                    <Text className="text-xs font-bold text-emerald-700">
                      Saved ₱{record.discountAmount}
                    </Text>
                  </View>
                )}
              </View>

              {record.redeemedBenefits.length > 0 && (
                <View className="mt-3 flex-row flex-wrap gap-1.5">
                  {record.redeemedBenefits.map((b, i) => (
                    <View key={i} className="rounded-full bg-brand-50 px-2.5 py-1">
                      <Text className="text-xs font-medium text-brand-500">{b.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {record.billAmount > 0 && (
                <View className="mt-3 flex-row gap-2 rounded-lg bg-gray-50 p-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">Bill</Text>
                    <Text className="text-sm font-semibold text-gray-900">₱{record.billAmount}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">Discount</Text>
                    <Text className="text-sm font-semibold text-emerald-700">
                      −₱{record.discountAmount}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">Paid</Text>
                    <Text className="text-sm font-semibold text-gray-900">₱{record.finalAmount}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default RedemptionHistorySection;
