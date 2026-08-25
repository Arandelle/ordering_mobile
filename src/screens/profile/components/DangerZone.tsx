import { useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, Trash2 } from 'lucide-react-native';
import { LoadingAction } from '../types';

interface DangerZoneProps {
  isBusy: boolean;
  loadingAction: LoadingAction;
  onDeleteAccount: (reason: string) => void;
}

export function DangerZone({ isBusy, loadingAction, onDeleteAccount }: DangerZoneProps) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');

  const isDeleting = loadingAction === 'delete-account';

  const handleRequestDelete = () => {
    Alert.alert(
      'Delete Account',
      'Your account, saved addresses, and order history will be scheduled for deletion. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setShowModal(true),
        },
      ]
    );
  };

  const handleConfirm = () => {
    onDeleteAccount(reason.trim());
    setReason('');
    setShowModal(false);
  };

  return (
    <View className="mt-8">
      <TouchableOpacity
        className="flex-row items-center justify-center gap-1 py-2"
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        disabled={isBusy}>
        <ChevronDown
          size={14}
          color="#9ca3af"
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
        <Text className="text-xs text-gray-400">
          {expanded ? 'Hide account options' : 'Account options'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View className="mt-3 items-center">
          <TouchableOpacity
            className="flex-row items-center gap-1.5 py-1.5"
            activeOpacity={0.7}
            onPress={handleRequestDelete}
            disabled={isBusy || isDeleting}>
            <Trash2 size={13} color="#f87171" />
            <Text className="text-xs text-red-400">
              {isDeleting ? 'Deleting...' : 'Delete account'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-lg font-bold text-gray-950">Delete Account</Text>
            <Text className="mt-2 text-sm leading-5 text-gray-500">
              Please tell us why you're leaving (optional). This helps us improve.
            </Text>

            <View className="mt-4">
              <TextInput
                className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-950"
                placeholder="Reason for deletion (optional)"
                placeholderTextColor="#b9b9b9"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 items-center rounded-2xl border border-gray-200 py-[13px]"
                activeOpacity={0.85}
                onPress={() => setShowModal(false)}>
                <Text className="text-[15px] font-bold text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 items-center rounded-2xl py-[13px] ${
                  isDeleting ? 'opacity-60' : ''
                }`}
                style={{ backgroundColor: '#dc2626' }}
                activeOpacity={0.85}
                onPress={handleConfirm}
                disabled={isDeleting}>
                <Text className="text-[15px] font-bold text-white">
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
