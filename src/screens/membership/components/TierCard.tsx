import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MembershipTier } from '@/types/membership.type';

type TierCardProps = {
  tier: MembershipTier;
  isSelected: boolean;
  onSelect: () => void;
  onPay: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
};

const TierCard = ({ tier, isSelected, onSelect, onPay, isAuthenticated, isPending }: TierCardProps) => {
  const enabledEvents = tier.discountEvents?.filter((ev) => ev.enabled) ?? [];
  const totalBenefits = (tier.baseDiscount?.enabled ? 1 : 0) + enabledEvents.length;

  const ts = tier.tierSchedule;
  const hasTierSchedule =
    ts && (ts.days?.length > 0 || ts.startTime !== '00:00' || ts.endTime !== '23:59');

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onSelect}
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: isSelected ? '#1e293b' : '#0f172a',
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#ef4501' : 'transparent',
      }}>
      <View className="p-5">
        {/* Selected badge */}
        {isSelected && (
          <View className="absolute right-3 top-3 rounded-full bg-brand-500 px-2 py-0.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
              Selected
            </Text>
          </View>
        )}

        {/* Tier name + SKU */}
        <Text className="text-[10px] font-semibold uppercase tracking-[3px] text-white/40">
          {tier.sku}
        </Text>
        <Text className="mt-1 text-xl font-bold text-white">{tier.name}</Text>

        {/* Price */}
        <Text className="mt-3 text-3xl font-bold text-brand-500">
          ₱{tier.purchasePrice.toLocaleString()}
        </Text>

        {/* Pills */}
        <View className="mt-2 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-white/10 px-2.5 py-0.5">
            <Text className="text-[11px] font-medium text-white/70">
              {tier.validityRule.duration} {tier.validityRule.unit}
              {tier.validityRule.duration > 1 ? 's' : ''}
            </Text>
          </View>
          <View className="rounded-full bg-white/10 px-2.5 py-0.5">
            <Text className="text-[11px] font-medium text-white/70">
              {tier.channel === 'both'
                ? 'Online & Dine-in'
                : tier.channel === 'online'
                  ? 'Online Only'
                  : 'Dine-in Only'}
            </Text>
          </View>
          {hasTierSchedule && (
            <View className="rounded-full bg-brand-500/20 px-2.5 py-0.5">
              <Text className="text-[11px] font-medium text-brand-500">
                {ts!.days?.length > 0 ? ts!.days.join(', ') : 'Daily'} {ts!.startTime}–{ts!.endTime}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="my-4 border-t border-white/10" />

        {/* Benefits header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-semibold uppercase tracking-[2px] text-white/40">
            Benefits
          </Text>
          {totalBenefits > 0 && (
            <View className="rounded-full bg-brand-500/20 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-brand-500">
                {totalBenefits} perk{totalBenefits > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Benefits list */}
        <View className="mt-3 gap-2.5">
          {tier.baseDiscount?.enabled && (
            <View className="flex-row items-start gap-2.5">
              <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                <Ionicons name="pricetag" size={12} color="#34d399" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">
                  {tier.baseDiscount.type === 'percentage'
                    ? `${tier.baseDiscount.value}% Off`
                    : `₱${tier.baseDiscount.value} Off`}{' '}
                  Entire Order
                </Text>
                <Text className="text-[11px] text-white/40">
                  {tier.baseDiscount.minimumPurchase > 0
                    ? `Min. purchase ₱${tier.baseDiscount.minimumPurchase}`
                    : 'No minimum purchase'}
                  {tier.baseDiscount.oneTime ? ' · One-time' : ''}
                </Text>
              </View>
            </View>
          )}
          {enabledEvents.map((ev, i) => (
            <View key={i} className="flex-row items-start gap-2.5">
              <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-brand-500/20">
                <Ionicons name="star" size={12} color="#ef4501" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">{ev.label}</Text>
                <Text className="text-[11px] text-white/50">
                  {ev.benefitType === 'free_item'
                    ? 'Free item'
                    : ev.benefitType === 'percentage'
                      ? `${ev.value}% off`
                      : `₱${ev.value} off`}
                  {ev.channel !== 'both' ? ` · ${ev.channel} only` : ''}
                  {ev.oneTime ? ' · One-time' : ''}
                </Text>
              </View>
            </View>
          ))}
          {totalBenefits === 0 && (
            <Text className="text-xs italic text-white/30">No benefits configured yet</Text>
          )}
        </View>

        {/* Pay button — only when selected */}
        {isSelected && (
          <View className="mt-4 border-t border-white/10 pt-4">
            {isAuthenticated ? (
              <>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onPay();
                  }}
                  disabled={isPending}
                  className={`items-center rounded-lg bg-brand-500 px-4 py-2.5 ${isPending ? 'opacity-50' : ''}`}>
                  <Text className="text-sm font-bold text-white">
                    {isPending ? 'Creating payment...' : 'Pay with Maya'}
                  </Text>
                </TouchableOpacity>
                <Text className="mt-2 text-center text-[10px] text-white/30">
                  Secure checkout via Maya
                </Text>
              </>
            ) : (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                }}
                className="items-center rounded-lg bg-white/10 px-4 py-2.5">
                <Text className="text-sm font-bold text-white">Login to purchase</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TierCard;
