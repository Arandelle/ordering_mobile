import BottomSheet from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/helper/formatter';
import { ModifierSelection } from '@/types/menu-types';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

// ─── Modifier Summary Row ─────────────────────────────────────────────────────

export function ModifierSummary({ modifiers }: { modifiers: ModifierSelection[] }) {
  const [showModal, setShowModal] = useState(false);

  if (!modifiers || modifiers.length === 0) return null;

  const totalExtras = modifiers.reduce((sum, group) => {
    return sum + group.items.reduce((g, item) => g + item.upgradePrice * item.quantity, 0);
  }, 0);

  return (
    <>
      <Button
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
        text={`${modifiers.length} option/s ${totalExtras > 0 ? `+${formatMoney(totalExtras)}` : ''}`}
        icon={{ name: 'ChevronForward', size: 10, color: '#ef3501' }}
      />

      <ModifierDetailsSheet
        visible={showModal}
        modifiers={modifiers}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export function ModifierDetailsSheet({
  visible,
  modifiers,
  onClose,
}: {
  visible: boolean;
  modifiers: ModifierSelection[];
  onClose: () => void;
}) {
  const totalModifierPrice = modifiers.reduce((sum, group) => {
    return sum + group.items.reduce((gSum, item) => gSum + item.upgradePrice * item.quantity, 0);
  }, 0);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
        <Text className="text-base font-bold text-gray-900">Customizations</Text>
        <Button
          onPress={onClose}
          variant="ghost"
          className="h-8 w-8 rounded-full bg-gray-100 p-0"
          icon={{ name: 'X', size: 16, color: '#6b7280' }}
        />
      </View>

      <ScrollView className="py-4" nestedScrollEnabled>
        {modifiers.map((group, idx) => (
          <View key={idx} className={idx > 0 ? 'mt-4 border-t border-gray-100 pt-4' : ''}>
            <View className="mb-2 flex-row items-center gap-2">
              <Text className="text-sm font-bold text-gray-900">{group.groupName}</Text>
              {group.required && (
                <View className="rounded-full bg-orange-100 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-orange-600">Required</Text>
                </View>
              )}
            </View>
            {group.items.map((item, iIdx) => (
              <View key={iIdx} className="flex-row items-center justify-between py-2">
                <View className="flex-1 pr-2">
                  <Text className="text-sm text-gray-700">
                    {item.name}
                    {item.quantity > 1 && <Text className="text-gray-400"> ×{item.quantity}</Text>}
                  </Text>
                  {item.label && (
                    <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
                      {item.label}
                    </Text>
                  )}
                </View>
                {item.upgradePrice > 0 && (
                  <Text className="text-sm font-semibold text-gray-900">
                    {formatMoney(item.upgradePrice * item.quantity)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {totalModifierPrice > 0 && (
          <View className="mt-4 border-t border-gray-100 pt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-900">Extra total</Text>
              <Text className="text-sm font-bold text-orange-600">
                +{formatMoney(totalModifierPrice)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
