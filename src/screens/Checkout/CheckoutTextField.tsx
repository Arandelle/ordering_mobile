import { useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface CheckoutTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  optional?: boolean;
  fieldClassName?: string;
  inputClassName?: string;
}

const CheckoutTextField = ({
  label,
  error,
  optional,
  fieldClassName = 'mb-4',
  inputClassName = '',
  onFocus,
  onBlur,
  ...inputProps
}: CheckoutTextFieldProps) => {
  const [focused, setFocused] = useState(false);

  const className = [
    'rounded-xl border-[1.5px] px-3.5 py-3 text-sm text-gray-950',
    focused ? 'border-[#e13e00] bg-white' : 'border-gray-200 bg-gray-50',
    error && 'border-red-600 bg-red-50',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={fieldClassName}>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-[13px] font-semibold text-gray-700">{label}</Text>
        {optional && <Text className="text-[11px] text-gray-400">Optional</Text>}
      </View>
      <TextInput
        {...inputProps}
        className={className}
        placeholderTextColor={inputProps.placeholderTextColor ?? '#b9b9b9'}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
      {error && <Text className="mt-1 text-[11px] text-red-600">{error}</Text>}
    </View>
  );
};

export default CheckoutTextField;
