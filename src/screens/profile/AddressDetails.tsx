import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Save } from 'lucide-react-native';
import { CheckoutAddressDetails } from '@/hooks/useCheckout';
import { SectionHeader } from './components/SectionHeader';
import { formatAddress } from './utils';
import { AddressErrors, AddressField, EditingSection, LoadingAction } from './types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    <View>
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
        <View className="mt-4 gap-4">
          <Input
            label="Address Line 1"
            placeholder="House number, street, barangay"
            value={addressForm.line1}
            onChangeText={(value) => onChange('line1', value)}
            autoCapitalize="words"
            error={addressErrors.line1}
          />

          <Input
            label="Address Line 2"
            placeholder="Unit, floor, building"
            value={addressForm.line2}
            onChangeText={(value) => onChange('line2', value)}
            autoCapitalize="words"
          />

          <View className="flex-row gap-3">
            <Input
              fieldClassName="flex-1"
              label="City"
              placeholder="Quezon City"
              value={addressForm.city}
              onChangeText={(value) => onChange('city', value)}
              autoCapitalize="words"
              error={addressErrors.city}
            />

            <Input
              fieldClassName="flex-1"
              label="Province"
              placeholder="Metro Manila"
              value={addressForm.province}
              onChangeText={(value) => onChange('province', value)}
              autoCapitalize="words"
              error={addressErrors.province}
            />
          </View>

          <View className="flex-row gap-3">
            <Input
              fieldClassName="flex-1"
              label="ZIP Code"
              placeholder="1100"
              value={addressForm.zipCode}
              onChangeText={(value) => onChange('zipCode', value)}
              keyboardType="number-pad"
            />

            <Input
              fieldClassName="flex-1"
              label="Country"
              placeholder="Philippines"
              value={addressForm.country}
              autoCapitalize="words"
              editable={false}
            />
          </View>

          <Input
            label="Landmark"
            placeholder="Near the main gate"
            value={addressForm.landmark}
            onChangeText={(value) => onChange('landmark', value)}
            autoCapitalize="sentences"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 items-center rounded-2xl border border-gray-200 py-[15px]"
              activeOpacity={0.85}
              onPress={cancelEditing}>
              <Text className="text-[15px] font-bold text-gray-600">Cancel</Text>
            </TouchableOpacity>

            <Button
              className="flex-1"
              text={loadingAction === 'address' ? 'Saving...' : 'Save'}
              onPress={onSave}
              isLoading={loadingAction === 'address'}
              loadingText="Saving..."
              disabled={isBusy}
              iconRight={{ icon: Save, size: 16 }}
            />
          </View>
        </View>
      ) : (
        <View className="mt-2">
          <Text className="whitespace-pre-line border-b border-gray-100 py-3 text-sm font-semibold leading-5 text-gray-950">
            {formatAddress(addressForm)}
          </Text>
        </View>
      )}
    </View>
  );
}
