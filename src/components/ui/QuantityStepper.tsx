import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from './Icon';
import { Button } from './Button';

export interface QuantityStepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  variant?: 'default' | 'compact';
  className?: string;
}

export function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  min,
  max,
  variant = 'default',
  className = '',
}: QuantityStepperProps) {
  const atMin = min !== undefined && value <= min;
  const atMax = max !== undefined && value >= max;

  if (variant === 'compact') {
    return (
      <View className={`flex-row items-center rounded-md bg-gray-100 ${className}`}>
        <Button
          onPress={onDecrement}
          variant="ghost"
          disabled={atMin}
          className="px-3 py-2"
          icon={{ name: 'Minus', size: 14, color: atMin ? '#9ca3af' : '#6b7280' }}
        />
        <View className="h-9 w-px bg-gray-200" />
        <View className="items-center justify-center px-3">
          <Text className="text-md text-gray-800">{value}</Text>
        </View>
        <View className="h-9 w-px bg-gray-200" />

        <Button
          onPress={onIncrement}
          variant="ghost"
          disabled={atMax}
          className="px-3 py-2"
          icon={{ name: 'Plus', size: 14, color: atMax ? '#9ca3af' : '#111827' }}
        />
      </View>
    );
  }

  return (
    <View
      className={`flex-row items-center overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <Button
        onPress={onDecrement}
        variant="ghost"
        disabled={atMin}
        className="h-12 w-10 items-center justify-center"
        icon={{ name: 'Minus', size: 16, color: atMin ? '#9ca3af' : '#111827' }}
      />
      <View className="h-12 w-px bg-gray-200" />
      <View className="h-12 w-10 items-center justify-center">
        <Text className="text-sm font-medium text-gray-900">{value}</Text>
      </View>
      <View className="h-12 w-px bg-gray-200" />

      <Button
        onPress={onIncrement}
        variant="ghost"
        disabled={atMax}
        className="h-12 w-10 items-center justify-center"
        icon={{ name: 'Plus', size: 16, color: atMax ? '#9ca3af' : '#e13e00' }}
      />
    </View>
  );
}
