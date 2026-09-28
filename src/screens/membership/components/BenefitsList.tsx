import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MembershipTier } from '@/types/membership.type';

type BenefitsListProps = {
  tier: MembershipTier;
};

const BenefitsList = ({ tier }: BenefitsListProps) => {
  const enabledEvents = tier.discountEvents?.filter((ev) => ev.enabled) ?? [];

  return (
    <View className="rounded-2xl bg-white p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold tracking-[3px] text-gray-800">
          YOUR BENEFITS
        </Text>
        <Text className="text-[10px] tracking-[2px] text-gray-400">
          {(tier.baseDiscount?.enabled ? 1 : 0) + enabledEvents.length} PERKS
        </Text>
      </View>

      <View className="mt-4 gap-3">
        {tier.baseDiscount?.enabled && (() => {
          const bdSched = tier.baseDiscount.schedule;
          const bdHasSchedule =
            bdSched &&
            (bdSched.days?.length > 0 || bdSched.startTime !== '00:00' || bdSched.endTime !== '23:59');

          return (
            <View className="rounded-xl bg-gray-50 p-4">
              <View className="flex-row items-start gap-3">
                <Ionicons name="pricetag" size={18} color="#ef4501" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {tier.baseDiscount.type === 'percentage'
                      ? `${tier.baseDiscount.value}% Off`
                      : `₱${tier.baseDiscount.value} Off`}{' '}
                    Entire Order
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {tier.baseDiscount.minimumPurchase > 0 && (
                      <View className="rounded-full bg-white px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-gray-600">
                          Min. ₱{tier.baseDiscount.minimumPurchase}
                        </Text>
                      </View>
                    )}
                    {tier.baseDiscount.oneTime ? (
                      <View className="rounded-full bg-violet-50 px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-violet-600">One-time</Text>
                      </View>
                    ) : bdHasSchedule ? (
                      <View className="rounded-full bg-white px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-gray-600">
                          {bdSched!.days?.length > 0 ? bdSched!.days.join(', ') : 'Daily'}{' '}
                          {bdSched!.startTime}–{bdSched!.endTime}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {enabledEvents.map((ev, i) => {
          const evSched = ev.schedule;
          const evHasSchedule =
            evSched &&
            (evSched.days?.length > 0 || evSched.startTime !== '00:00' || evSched.endTime !== '23:59');

          return (
            <View key={i} className="rounded-xl bg-gray-50 p-4">
              <View className="flex-row items-start gap-3">
                <Ionicons name="star" size={18} color="#ef4501" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">{ev.label}</Text>
                  {ev.description ? (
                    <Text className="mt-0.5 text-sm text-gray-600">{ev.description}</Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View className="rounded-full bg-white px-2 py-0.5">
                      <Text className="text-[11px] font-medium text-gray-600">
                        {ev.benefitType === 'free_item'
                          ? (() => {
                              const names = (ev.freeItemProducts ?? [])
                                .filter((fp) => fp.productId)
                                .map((fp) => fp.label || fp.name || 'Unknown');
                              return names.length > 0 ? `Free: ${names.join(', ')}` : 'Free Item';
                            })()
                          : `${ev.benefitType === 'percentage' ? `${ev.value}%` : `₱${ev.value}`} off`}
                      </Text>
                    </View>
                    {ev.channel !== 'both' && (
                      <View className="rounded-full bg-white px-2 py-0.5">
                        <Text className="text-[11px] font-medium capitalize text-gray-600">
                          {ev.channel} only
                        </Text>
                      </View>
                    )}
                    {ev.oneTime ? (
                      <View className="rounded-full bg-violet-50 px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-violet-600">One-time</Text>
                      </View>
                    ) : evHasSchedule ? (
                      <View className="rounded-full bg-white px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-gray-600">
                          {evSched!.days?.length > 0 ? evSched!.days.join(', ') : 'Daily'}{' '}
                          {evSched!.startTime}–{evSched!.endTime}
                        </Text>
                      </View>
                    ) : ev.days.length > 0 ? (
                      <View className="rounded-full bg-white px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-gray-600">
                          {ev.days.join(', ')}
                        </Text>
                      </View>
                    ) : null}
                    {ev.minimumPurchase > 0 && (
                      <View className="rounded-full bg-white px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-gray-600">
                          Min. ₱{ev.minimumPurchase}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {!tier.baseDiscount?.enabled && enabledEvents.length === 0 && (
          <Text className="text-sm italic text-gray-400">No active benefits configured.</Text>
        )}
      </View>
    </View>
  );
};

export default BenefitsList;
