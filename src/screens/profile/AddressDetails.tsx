import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Save } from 'lucide-react-native';
import { CheckoutAddressDetails } from '@/hooks/useCheckout';
import { FieldLabel } from './components/FieldLabel';
import { SectionHeader } from './components/SectionHeader';
import { formatAddress } from './utils';
import { AddressErrors, AddressField, EditingSection, LoadingAction } from './types';

interface AddressDetailsProps {
  addressForm: CheckoutAddressDetails;
  addressErrors: AddressErrors;
  isEditing: boolean;
  isLoading: boolean;
  isBusy: boolean;
  loadingAction: LoadingAction;
  startEditing: (section: EditingSection) => void;
  cancelEditing: () => void;
  onChange: (field: AddressField, value: string) => void;
  onSave: () => void;
}

export function AddressDetails({
  addressForm,
  addressErrors,
  isEditing,
  isLoading,
  isBusy,
  loadingAction,
  startEditing,
  cancelEditing,
  onChange,
  onSave,
}: AddressDetailsProps) {
  return (
    <View className="mt-7">
      <SectionHeader
        title="Address"
        isEditing={isEditing}
        onEdit={() => startEditing('address')}
        onCancel={cancelEditing}
      />

      {isLoading ? (
        <View className="py-6">
          <ActivityIndicator color="#e13e00" />
        </View>
      ) : isEditing ? (
        <View className="gap-4">
          <View>
            <FieldLabel label="Address Line 1" />
            <TextInput
              className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
              placeholder="House number, street, barangay"
              placeholderTextColor="#b9b9b9"
              value={addressForm.line1}
              onChangeText={(value) => onChange('line1', value)}
              autoCapitalize="words"
            />
            {!!addressErrors.line1 && (
              <Text className="mt-1 text-[11px] text-red-600">{addressErrors.line1}</Text>
            )}
          </View>

          <View>
            <FieldLabel label="Address Line 2" optional />
            <TextInput
              className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
              placeholder="Unit, floor, building"
              placeholderTextColor="#b9b9b9"
              value={addressForm.line2}
              onChangeText={(value) => onChange('line2', value)}
              autoCapitalize="words"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel label="City" />
              <TextInput
                className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                placeholder="Quezon City"
                placeholderTextColor="#b9b9b9"
                value={addressForm.city}
                onChangeText={(value) => onChange('city', value)}
                autoCapitalize="words"
              />
              {!!addressErrors.city && (
                <Text className="mt-1 text-[11px] text-red-600">{addressErrors.city}</Text>
              )}
            </View>

            <View className="flex-1">
              <FieldLabel label="Province" />
              <TextInput
                className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                placeholder="Metro Manila"
                placeholderTextColor="#b9b9b9"
                value={addressForm.province}
                onChangeText={(value) => onChange('province', value)}
                autoCapitalize="words"
              />
              {!!addressErrors.province && (
                <Text className="mt-1 text-[11px] text-red-600">{addressErrors.province}</Text>
              )}
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel label="ZIP Code" optional />
              <TextInput
                className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                placeholder="1100"
                placeholderTextColor="#b9b9b9"
                value={addressForm.zipCode}
                onChangeText={(value) => onChange('zipCode', value)}
                keyboardType="number-pad"
              />
            </View>

            <View className="flex-1">
              <FieldLabel label="Country" />
              <TextInput
                className="min-h-12 rounded-2xl border border-gray-200 bg-gray-200 px-3.5 text-sm text-gray-500"
                placeholder="Philippines"
                placeholderTextColor="#b9b9b9"
                value={addressForm.country}
                autoCapitalize="words"
                editable={false}
              />
              {!!addressErrors.country && (
                <Text className="mt-1 text-[11px] text-red-600">{addressErrors.country}</Text>
              )}
            </View>
          </View>

          <View>
            <FieldLabel label="Landmark" optional />
            <TextInput
              className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
              placeholder="Near the main gate"
              placeholderTextColor="#b9b9b9"
              value={addressForm.landmark}
              onChangeText={(value) => onChange('landmark', value)}
              autoCapitalize="sentences"
            />
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-[15px] ${
              loadingAction === 'address' ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={onSave}
            disabled={isBusy}>
            <Save size={17} color="#fff" />
            <Text className="text-[15px] font-bold text-white">
              {loadingAction === 'address' ? 'Saving...' : 'Save Address'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text className="whitespace-pre-line border-b border-gray-100 py-3 text-sm font-semibold leading-5 text-gray-950">
          {formatAddress(addressForm)}
        </Text>
      )}
    </View>
  );
}
