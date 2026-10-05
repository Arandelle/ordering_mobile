import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckoutAddressDetails } from '@/hooks/useCheckout';
import { SectionHeader } from './components/SectionHeader';
import { formatAddress } from './utils';
import { AddressErrors, AddressField, EditingSection, LoadingAction } from './types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DeliveryLocationPicker, DeliveryCoordinates, ResolvedDeliveryAddress } from '../checkout/DeliveryLocationPicker';
import { PsgcAddressFields } from '../checkout/PsgcAddressFields';

interface AddressDetailsProps {
  addressForm: CheckoutAddressDetails;
  addressErrors: AddressErrors;
  isEditing: boolean;
  isLoading: boolean;
  isBusy: boolean;
  loadingAction: LoadingAction;
  mapMismatch: boolean;
  startEditing: (section: EditingSection) => void;
  cancelEditing: () => void;
  onChange: (field: AddressField, value: string) => void;
  onCoordinatesChange: (coords: DeliveryCoordinates) => void;
  onAddressResolved: (address: ResolvedDeliveryAddress & { cityCode?: string; barangayCode?: string }) => void;
  onPsgcChange: (selection: { city?: string; barangay?: string; subMunicipality?: string }) => void;
  onSave: () => void;
}

export function AddressDetails({
  addressForm,
  addressErrors,
  isEditing,
  isLoading,
  isBusy,
  loadingAction,
  mapMismatch,
  startEditing,
  cancelEditing,
  onChange,
  onCoordinatesChange,
  onAddressResolved,
  onPsgcChange,
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
          <DeliveryLocationPicker
            value={addressForm.coordinates}
            onChange={onCoordinatesChange}
            onAddressResolved={onAddressResolved}
          />

          <Input
            label="Address Line 1"
            placeholder="House number, street"
            value={addressForm.line1}
            onChangeText={(value) => onChange('line1', value)}
            autoCapitalize="words"
            error={addressErrors.line1}
          />

          <PsgcAddressFields
            address={addressForm}
            setField={(field, value) => onChange(field as AddressField, value)}
            onPsgcChange={onPsgcChange}
          />

          {mapMismatch && (
            <View className="flex-row items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <Ionicons name="warning-outline" size={16} color="#d97706" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs font-medium leading-4 text-amber-800">
                Map pin doesn't match your selected address. Update the map or adjust the fields above.
              </Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <Input
              fieldClassName="flex-1"
              label="ZIP Code (optional)"
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
              className="flex-1 rounded-2xl"
              text="Save"
              onPress={onSave}
              loading={{ isLoading: loadingAction === 'address', text: 'Saving...' }}
              disabled={isBusy}
              icon={{ name: 'Save', size: 16, position: 'left' }}
            />
          </View>
        </View>
      ) : (
        <View className="mt-3 flex-row items-start gap-3">
          <View className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="location-outline" size={18} color="#6b7280" />
          </View>
          <View className="flex-1">
            <Text className="whitespace-pre-line text-sm font-semibold leading-5 text-gray-900">
              {formatAddress(addressForm)}
            </Text>
          </View>
          <TouchableOpacity
            className="items-center justify-center rounded-lg bg-gray-100 p-2"
            activeOpacity={0.8}
            onPress={() => startEditing('address')}>
            <Ionicons name="create-outline" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
