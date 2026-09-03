import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useWallet,
  useWalletTransactions,
  useWalletTopup,
  flattenTransactions,
} from '@/hooks/useWallet';
import type { WalletTransaction, WalletTransactionStatus } from '@/services/wallet.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import * as WebBrowser from 'expo-web-browser';
import { TERMS_OF_USE_URL, PRIVACY_POLICY_URL } from '@/constant';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/helper/formatter/formateDate';
import { formatMoney } from '@/helper/formatter';

const BRAND = '#e13e00';

// ─── Topup Confirmation Modal ────────────────────────────────────────────────

function TopupConfirmationModal({
  visible,
  amount,
  onClose,
  onConfirm,
  isPending,
}: {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View
          className="w-full rounded-3xl bg-white px-5 py-6"
          style={{ marginBottom: insets.bottom, maxHeight: '85%' }}>
          {/* Header */}
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Ionicons name="add-circle-outline" size={20} color={BRAND} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">Confirm Top Up</Text>
              <Text className="text-xs text-gray-400">Review amount before proceeding</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              disabled={isPending}>
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View className="mb-4 items-center rounded-xl bg-gray-50 p-4">
            <Text className="text-sm text-gray-500">Amount to add</Text>
            <Text className="mt-1 text-3xl font-extrabold text-gray-950">
              {formatMoney(amount)}
            </Text>
          </View>

          {/* Info */}
          <View className="mb-5 flex-row items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
            <Ionicons
              name="information-circle"
              size={16}
              color="#2563eb"
              style={{ marginTop: 1 }}
            />
            <Text className="flex-1 text-xs leading-4 text-blue-700">
              You will be redirected to Maya to complete the payment through QR PH. Once payment is
              confirmed, your wallet balance will be updated automatically.
            </Text>
          </View>

          {/* Powered by Maya */}
          <View className="mb-4 flex-row items-center justify-center gap-1.5">
            <Ionicons name="shield-checkmark-outline" size={13} color="#9ca3af" />
            <Text className="text-[11px] text-gray-400">
              Powered by Maya — secure payment via QR PH
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Button
              text="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={isPending}
              className="flex-1 rounded-2xl"
            />
            <Button
              text="Continue"
              variant="success"
              onPress={onConfirm}
              isLoading={isPending}
              loadingText="Redirecting..."
              className="flex-1 rounded-2xl"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({ balance, isLoading }: { balance: number; isLoading: boolean }) {
  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const topup = useWalletTopup();

  const numericAmount = parseFloat(amount);
  const isValid = !isNaN(numericAmount) && numericAmount >= 1;

  const handleTopupPress = () => {
    if (isValid) {
      setShowModal(true);
    }
  };

  const handleConfirmTopup = async () => {
    setShowModal(false);
    try {
      await topup.mutateAsync(numericAmount);
      setAmount('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to initiate topup.';
      Alert.alert('Topup failed', message);
    }
  };

  const handleOpenLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  if (isLoading) {
    return (
      <View className="rounded-2xl bg-white p-5 shadow-sm">
        <View className="items-center gap-3 py-4">
          <ActivityIndicator size="large" color={BRAND} />
          <Text className="text-sm text-gray-400">Loading wallet balance...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="rounded-2xl bg-white p-5 shadow-sm">
        {/* Balance */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-500">Available Balance</Text>
          <Text className="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
            {formatMoney(balance)}
          </Text>
          <Text className="mt-1 text-xs text-gray-400">Use your wallet for faster checkout.</Text>
        </View>

        {/* Divider */}
        <View className="my-4 h-px bg-gray-100" />

        {/* Top Up */}
        <Text className="mb-3 text-sm font-bold text-gray-900">Top Up Your Wallet</Text>

        <View className="flex-row items-end gap-3">
          <View className="flex-1">
            <Input
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              inputClassName="min-h-12 text-sm text-gray-950"
              leftIcon={{
                icon: () => <Ionicons name="cash-outline" size={16} color="#9ca3af" />,
                size: 16,
              }}
            />
          </View>
          <Button
            text="Top Up"
            variant="success"
            onPress={handleTopupPress}
            disabled={!isValid}
            className="px-5"
          />
        </View>

        <View className="mt-6 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-1.5">
            <Icon name="shield-checkmark-outline" size={12} color="#9ca3af" iconSet="ionicons" />
            <Text className="text-[11px] text-gray-400">Secured by Maya QR PH</Text>
          </View>
          <View className="flex-row gap-6">
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleOpenLink(TERMS_OF_USE_URL)}>
              <Text className="text-xs text-gray-400 underline">Terms of Use</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenLink(PRIVACY_POLICY_URL)}>
              <Text className="text-xs text-gray-400 underline">Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TopupConfirmationModal
        visible={showModal}
        amount={numericAmount}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmTopup}
        isPending={topup.isPending}
      />
    </>
  );
}

// ─── Source Label Map ─────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  maya_topup: 'Maya Top-Up',
  refund: 'Refund',
  promo: 'Promo',
  admin_credit: 'Admin Credit',
  cashback: 'Cashback',
  manual: 'Manual',
};

function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Transaction Detail Modal ─────────────────────────────────────────────────

function TransactionDetailModal({ tx, onClose }: { tx: WalletTransaction; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const isCredit = tx.type === 'credit';

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View
          className="w-full rounded-3xl bg-white px-5 py-6"
          style={{ marginBottom: insets.bottom }}>
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base font-bold text-gray-900">Transaction Details</Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View className="mb-5 items-center rounded-xl bg-gray-50 p-4">
            <Text className="text-sm text-gray-500">{isCredit ? 'Credited' : 'Debited'}</Text>
            <Text
              className={`mt-1 text-2xl font-extrabold ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
              {isCredit ? '+' : '−'}
              {formatMoney(tx.amount)}
            </Text>
          </View>

          {/* Details */}
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Type</Text>
              <Text className="text-sm font-semibold capitalize text-gray-800">{tx.type}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Source</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {getSourceLabel(tx.source)}
              </Text>
            </View>
            {tx.description && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Description</Text>
                <Text
                  className="ml-4 flex-1 text-end text-sm font-semibold text-gray-800"
                  numberOfLines={3}>
                  {tx.description}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Status</Text>
              <Text
                className={`text-sm font-semibold capitalize ${
                  tx.status === 'completed'
                    ? 'text-emerald-600'
                    : tx.status === 'pending'
                      ? 'text-amber-600'
                      : tx.status === 'failed'
                        ? 'text-red-600'
                        : 'text-gray-500'
                }`}>
                {tx.status}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Balance Before</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {formatMoney(tx.balanceBefore)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Balance After</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {formatMoney(tx.balanceAfter)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Date</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {formatDate(tx.createdAt)}
              </Text>
            </View>
            {tx.orderId && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Order ID</Text>
                <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                  {tx.orderId}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Transaction Row ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<WalletTransactionStatus, string> = {
  completed: 'text-emerald-600',
  pending: 'text-amber-600',
  failed: 'text-red-600',
  reversed: 'text-gray-600',
};

const WALLET_TYPE_DETAILS: Record<string, { icon: string; color: string; bg: string }> = {
  credit: { icon: 'ArrowDownLeft', color: '#059669', bg: 'bg-emerald-100' },
  debit: { icon: 'ArrowUpRight', color: '#d97706', bg: 'bg-amber-100' },
};

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const [showDetail, setShowDetail] = useState(false);
  const meta = WALLET_TYPE_DETAILS[tx.type] ?? WALLET_TYPE_DETAILS.debit;

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
        activeOpacity={0.7}
        onPress={() => setShowDetail(true)}>
        <View className="flex-row items-center gap-3">
          <View className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.bg}`}>
            <Icon name={meta.icon} size={18} color={meta.color} />
          </View>
          <View className="">
            <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
              {getSourceLabel(tx.source)}
            </Text>
            <Text className="text-xs text-gray-400">{formatDate(tx.createdAt)}</Text>
          </View>
        </View>

        <View className="items-end">
          <Text
            className={`text-xl font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}
            numberOfLines={1}>
            {tx.type === 'credit' ? '+' : '−'}
            {formatMoney(tx.amount)}
          </Text>
          <Text
            className={`mt-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[tx.status] ?? 'text-gray-500'}`}>
            {tx.status}
          </Text>
        </View>
      </TouchableOpacity>

      {showDetail && <TransactionDetailModal tx={tx} onClose={() => setShowDetail(false)} />}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyTransactions() {
  return (
    <View className="rounded-2xl bg-white px-6 py-12 shadow-sm">
      <View className="items-center">
        <View className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <Ionicons name="receipt-outline" size={28} color={BRAND} />
        </View>
        <Text className="text-base font-bold text-gray-950">No transactions yet</Text>
        <Text className="mt-1 text-center text-sm text-gray-500">
          Top up your wallet or make a purchase — your activity will appear here.
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data: wallet,
    isLoading: walletLoading,
    isRefetching,
    refetch: refetchWallet,
  } = useWallet();
  const txQuery = useWalletTransactions();
  const transactions = flattenTransactions(txQuery.data);

  const balance = wallet?.balance ?? 0;
  const isRefreshing = isRefetching || walletLoading;

  const handleLoadMore = () => {
    if (!txQuery.hasNextPage || txQuery.isFetchingNextPage) return;
    void txQuery.fetchNextPage();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 "
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 80,
          paddingLeft: 20,
          paddingRight: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void refetchWallet();
              void txQuery.refetch();
            }}
            tintColor={BRAND}
            colors={[BRAND]}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Balance + Top Up */}
        <BalanceCard balance={balance} isLoading={walletLoading} />
        {/* Transactions */}
        <View className="mt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold text-gray-950">Transactions</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void refetchWallet();
                void txQuery.refetch();
              }}>
              {isRefreshing ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          {txQuery.isLoading && transactions.length === 0 ? (
            <View className="rounded-2xl bg-white py-8 shadow-sm">
              <ActivityIndicator size="small" color={BRAND} />
            </View>
          ) : transactions.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <TransactionRow tx={item} />}
              ItemSeparatorComponent={() => <View className="h-2" />}
              scrollEnabled={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                txQuery.isFetchingNextPage ? (
                  <View className="py-4">
                    <ActivityIndicator size="small" color={BRAND} />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
