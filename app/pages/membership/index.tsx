import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authClient } from '@/lib/auth-client';
import { useMembershipStatus, useMembershipCheckout } from '@/hooks/useMembership';
import VipCard from '@/components/home/VipCard';
import TierCard from './components/TierCard';
import BenefitsList from './components/BenefitsList';
import MembershipDetails from './components/MembershipDetails';
import OrderHistorySection from './components/OrderHistorySection';
import RedemptionHistorySection from './components/RedemptionHistorySection';

const BRAND = '#e13e00';

export default function MembershipScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: membershipData, isLoading, refetch } = useMembershipStatus({ enabled: isAuthenticated });
  const checkoutMutation = useMembershipCheckout();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [selectedTierId, setSelectedTierId] = useState('');
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdayValue, setBirthdayValue] = useState('');
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Auto-select first tier
  React.useEffect(() => {
    if (!selectedTierId && membershipData?.tiers?.length) {
      setSelectedTierId(membershipData.tiers[0]._id);
    }
  }, [membershipData?.tiers, selectedTierId]);

  const tiers = membershipData?.tiers ?? [];
  const activeMembership = membershipData?.activeMembership;
  const usageHistory = membershipData?.usageHistory ?? [];
  const redemptionHistory = membershipData?.redemptionHistory ?? [];
  const hasActiveMembership = activeMembership?.status === 'paid';
  const hasPendingMembership = activeMembership?.status === 'pending';
  const hasFailedMembership = ['failed', 'expired', 'cancelled'].includes(
    activeMembership?.status ?? '',
  );
  const activeTier = tiers.find((t) => t._id === activeMembership?.tierId);
  const selectedTier = tiers.find((t) => t._id === selectedTierId);

  const memberName =
    (session?.user?.name ?? '').trim() ||
    [activeMembership?.firstName, activeMembership?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Member';

  const handlePay = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to purchase a membership.');
      return;
    }
    if (!selectedTierId) {
      Alert.alert('Select Tier', 'Please select a membership tier.');
      return;
    }
    setPendingTierId(selectedTierId);
    checkoutMutation.mutate(
      { tierId: selectedTierId },
      {
        onError: (error: Error & { details?: { requiresBirthday?: boolean } }) => {
          if (error.details?.requiresBirthday) {
            setShowBirthdayModal(true);
          } else {
            Alert.alert('Payment failed', error.message || 'Please try again later.');
          }
        },
      },
    );
  };

  const handleBirthdaySubmit = () => {
    if (!birthdayValue || !pendingTierId) return;
    setShowBirthdayModal(false);
    setPendingTierId(pendingTierId);
    setShowConfirmModal(true);
  };

  const handleConfirmedPurchase = () => {
    if (!pendingTierId) return;
    setShowConfirmModal(false);
    checkoutMutation.mutate(
      { tierId: pendingTierId, dateOfBirth: birthdayValue },
      {
        onError: (error: Error) => {
          Alert.alert('Payment failed', error.message || 'Please try again later.');
        },
      },
    );
    setBirthdayValue('');
    setPendingTierId(null);
  };

  const handleRetryPayment = () => {
    if (!activeMembership?.tierId) return;
    checkoutMutation.mutate(
      { tierId: activeMembership.tierId },
      {
        onError: (error: Error) => {
          Alert.alert('Payment failed', error.message || 'Please try again later.');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 16, paddingTop: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e13e00" colors={['#e13e00']} />
      }>
      {/* Hero */}
      <View className="mb-6">
        <Text className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Harrison Membership
        </Text>
        <Text className="mt-2 text-3xl font-bold text-gray-900">Unlock Exclusive Benefits</Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          {hasActiveMembership
            ? 'Your membership is active. Enjoy your benefits on every eligible order.'
            : hasPendingMembership
              ? 'Complete your payment to activate your membership.'
              : hasFailedMembership
                ? "Your previous payment didn't go through. You can try again with a new purchase."
                : 'Choose a membership tier to unlock discounts, special events, and more.'}
        </Text>
      </View>

      {/* Failed/Expired Notice */}
      {hasFailedMembership && activeMembership && (
        <View className="mb-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5">
          <View className="flex-row items-start gap-3">
            <Ionicons name="close-circle" size={24} color="#dc2626" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                Previous Payment{' '}
                {activeMembership.status === 'expired' ? 'Expired' : 'Failed'}
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                {activeMembership.status === 'expired'
                  ? 'The payment session expired before completion.'
                  : activeMembership.status === 'failed'
                    ? 'The payment could not be processed.'
                    : 'The payment was cancelled.'}{' '}
                No amount was deducted from your account.
              </Text>
              <Text className="mt-2 text-xs text-gray-500">
                Reference: {activeMembership.referenceNumber} · Amount: ₱{activeMembership.purchasePrice}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Pending Notice */}
      {hasPendingMembership && activeMembership && (
        <View className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <View className="flex-row items-start gap-3">
            <Ionicons name="alert-circle" size={24} color="#d97706" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Payment Incomplete</Text>
              <Text className="mt-1 text-sm text-gray-600">
                Your membership purchase was started but the payment wasn't completed.
              </Text>

              <View className="mt-3 grid gap-2 rounded-xl bg-white p-3">
                <View className="flex-row justify-between">
                  <Text className="text-xs uppercase text-gray-500">Reference</Text>
                  <Text className="font-mono text-sm font-semibold text-gray-900">
                    {activeMembership.referenceNumber}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs uppercase text-gray-500">Amount</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    ₱{activeMembership.purchasePrice}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleRetryPayment}
                disabled={checkoutMutation.isPending}
                className={`mt-3 items-center rounded-lg bg-brand-500 px-4 py-2.5 ${checkoutMutation.isPending ? 'opacity-50' : ''}`}>
                <Text className="text-sm font-bold text-white">
                  {checkoutMutation.isPending ? 'Creating payment link...' : 'Retry Payment'}
                </Text>
              </TouchableOpacity>
              <Text className="mt-2 text-xs text-gray-500">
                Clicking retry will create a new payment session. The previous attempt will be marked as expired.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tier Selection */}
      {!hasActiveMembership && !hasPendingMembership && tiers.length > 0 && (
        <View className="mb-6 gap-4">
          <Text className="text-2xl font-bold text-gray-900">Choose Your Tier</Text>
          {tiers.map((tier) => (
            <TierCard
              key={tier._id}
              tier={tier}
              isSelected={selectedTierId === tier._id}
              onSelect={() => setSelectedTierId(tier._id)}
              onPay={handlePay}
              isAuthenticated={isAuthenticated}
              isPending={checkoutMutation.isPending}
            />
          ))}
        </View>
      )}

      {/* Active Membership */}
      {hasActiveMembership && activeMembership && (
        <View className="gap-4">
          {/* VIP Card */}
        
            <VipCard
              membership={activeMembership}
              memberName={memberName}
              tierChannel={activeMembership.tierChannel}
              expiresAt={activeMembership.expiresAt ?? activeTier?.validityRule?.expiresAt}
            />
      

          {/* Benefits */}
          {activeTier && <BenefitsList tier={activeTier} />}

          {/* Details */}
          <MembershipDetails membership={activeMembership} tier={activeTier} />
        </View>
      )}

      {/* Order History */}
      {isAuthenticated && (
        <View className="mt-6">
          <OrderHistorySection orders={usageHistory} />
        </View>
      )}

      {/* Redemption History */}
      {isAuthenticated && (
        <View className="mt-6">
          <RedemptionHistorySection records={redemptionHistory} />
        </View>
      )}

      {/* Birthday Modal */}
      <Modal visible={showBirthdayModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full rounded-2xl bg-white p-6">
            <Text className="text-lg font-bold text-gray-900">Complete Your Profile</Text>
            <Text className="mt-1 text-sm text-gray-500">
              We need your date of birth before you can purchase a membership.
            </Text>

            <View className="mt-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">Date of Birth</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={birthdayValue}
                onChangeText={setBirthdayValue}
                className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900"
              />
            </View>

            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowBirthdayModal(false);
                  setPendingTierId(null);
                }}
                className="flex-1 items-center rounded-lg border border-gray-300 py-2.5">
                <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBirthdaySubmit}
                disabled={!birthdayValue}
                className={`flex-1 items-center rounded-lg bg-brand-500 py-2.5 ${!birthdayValue ? 'opacity-50' : ''}`}>
                <Text className="text-sm font-bold text-white">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-h-[80%] rounded-2xl bg-white p-6">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-lg font-bold text-gray-900">Confirm Membership Purchase</Text>
              <Text className="mt-1 text-sm text-gray-500">
                Review your details and benefits before proceeding to payment.
              </Text>

              {/* Profile summary */}
              <View className="mt-4 rounded-xl bg-gray-50 p-4">
                <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Your Profile
                </Text>
                <View className="mt-2 gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">Name</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {session?.user?.name ?? '—'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">Email</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {session?.user?.email ?? '—'}
                    </Text>
                  </View>
                  {birthdayValue ? (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-500">Date of Birth</Text>
                      <Text className="text-sm font-semibold text-gray-900">{birthdayValue}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Tier + price */}
              {pendingTierId && (() => {
                const confirmTier = tiers.find((t) => t._id === pendingTierId);
                if (!confirmTier) return null;
                return (
                  <View className="mt-3 rounded-xl bg-gray-900 p-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs font-semibold uppercase tracking-wide text-white/50">
                          {confirmTier.sku}
                        </Text>
                        <Text className="text-lg font-bold text-white">{confirmTier.name}</Text>
                      </View>
                      <Text className="text-2xl font-bold text-brand-500">
                        ₱{confirmTier.purchasePrice}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-white/50">
                      Valid for {confirmTier.validityRule.duration}{' '}
                      {confirmTier.validityRule.unit}
                      {confirmTier.validityRule.duration > 1 ? 's' : ''}
                    </Text>
                  </View>
                );
              })()}

              {/* Benefits */}
              {pendingTierId && (() => {
                const confirmTier = tiers.find((t) => t._id === pendingTierId);
                if (!confirmTier) return null;
                const enabledEvents = confirmTier.discountEvents?.filter((ev) => ev.enabled) ?? [];
                if (!confirmTier.baseDiscount?.enabled && enabledEvents.length === 0) return null;

                return (
                  <View className="mt-3 gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Benefits Included
                    </Text>
                    {confirmTier.baseDiscount?.enabled && (
                      <View className="flex-row items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
                        <Ionicons name="pricetag" size={14} color="#059669" />
                        <Text className="flex-1 text-sm font-medium text-gray-800">
                          {confirmTier.baseDiscount.type === 'percentage'
                            ? `${confirmTier.baseDiscount.value}% Off`
                            : `₱${confirmTier.baseDiscount.value} Off`}{' '}
                          Entire Order
                        </Text>
                      </View>
                    )}
                    {enabledEvents.map((ev, i) => (
                      <View key={i} className="flex-row items-center gap-2 rounded-lg bg-brand-50 p-2.5">
                        <Ionicons name="star" size={14} color={BRAND} />
                        <Text className="flex-1 text-sm font-medium text-gray-800">{ev.label}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>

            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmModal(false);
                  setPendingTierId(null);
                  setBirthdayValue('');
                }}
                className="flex-1 items-center rounded-lg border border-gray-300 py-2.5">
                <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmedPurchase}
                disabled={checkoutMutation.isPending}
                className={`flex-1 items-center rounded-lg bg-brand-500 py-2.5 ${checkoutMutation.isPending ? 'opacity-50' : ''}`}>
                <Text className="text-sm font-bold text-white">
                  {checkoutMutation.isPending ? 'Processing...' : 'Pay with Maya'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="mt-2 text-center text-[10px] text-gray-400">
              You will be redirected to Maya for secure payment.
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
