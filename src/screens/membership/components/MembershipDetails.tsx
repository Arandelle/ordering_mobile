import React from 'react';
import { Text, View } from 'react-native';
import type { ActiveMembership, MembershipTier } from '@/types/membership.type';

function formatCardDate(value?: string | null): string {
  if (!value) return '--/--/--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--/--/--';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

type MembershipDetailsProps = {
  membership: ActiveMembership;
  tier?: MembershipTier;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between border-b border-gray-100 py-3">
    <Text className="text-[10px] tracking-[2px] text-gray-500">{label}</Text>
    <Text className="text-sm font-semibold text-gray-800">{value}</Text>
  </View>
);

const MembershipDetails = ({ membership, tier }: MembershipDetailsProps) => {
  return (
    <View className="rounded-2xl bg-white p-5 shadow-sm">
      <Text className="text-base font-semibold tracking-[3px] text-gray-800">DETAILS</Text>

      <View className="mt-3">
        {membership.memberId && (
          <DetailRow label="MEMBER ID" value={membership.memberId} />
        )}
        <DetailRow label="CUSTOMER ID" value={membership.customerCode ?? '--'} />
        <DetailRow
          label="PURCHASE PRICE"
          value={`₱${membership.purchasePrice.toLocaleString()}`}
        />
        <DetailRow
          label="DISCOUNT RATE"
          value={`${(membership.discountRate * 100).toFixed(0)}%`}
        />
        {tier && (
          <DetailRow
            label="CHANNEL"
            value={
              tier.channel === 'both'
                ? 'Online & Dine-in'
                : tier.channel === 'online'
                  ? 'Online Only'
                  : 'Dine-in Only'
            }
          />
        )}
        <DetailRow
          label="VALID THRU"
          value={formatCardDate(membership.expiresAt ?? tier?.validityRule?.expiresAt)}
        />
      </View>
    </View>
  );
};

export default MembershipDetails;
