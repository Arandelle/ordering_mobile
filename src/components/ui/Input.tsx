import React, { forwardRef, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface InputIconProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  size?: number;
}

interface InputFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: InputIconProps;
  rightIcon?: InputIconProps;
  subLabel?: string;
  fieldClassName?: string;
  inputClassName?: string;
  required?: boolean;
}

const DEFAULT_ICON_SIZE = 16;
const DEFAULT_ICON_COLOR = '#9ca3af';
const FOCUS_ICON_COLOR = '#e13e00';
const ERROR_ICON_COLOR = '#ef4444';

export const Input = forwardRef<React.ComponentRef<typeof TextInput>, InputFieldProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      subLabel,
      className,
      inputClassName,
      fieldClassName,
      placeholder,
      editable = true,
      required,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const iconColor = error ? ERROR_ICON_COLOR : focused ? FOCUS_ICON_COLOR : DEFAULT_ICON_COLOR;
    const leftSize = leftIcon?.size ?? DEFAULT_ICON_SIZE;
    const rightSize = rightIcon?.size ?? DEFAULT_ICON_SIZE;
    const LeftIcon = leftIcon?.icon;
    const RightIcon = rightIcon?.icon;

    const inputClass = twMerge(
      'flex-1 py-3 text-sm',
      editable ? 'text-gray-950' : 'text-gray-400',
      inputClassName,
    );

    const containerClass = twMerge(
      'flex-row items-center border bg-white px-1',
      error ? 'border-red-500' : focused ? 'border-[#e13e00]' : 'border-gray-200',
      !editable && 'bg-gray-100',
      className,
    );

    return (
      <View className={twMerge('w-full gap-2', fieldClassName)}>
        {(label || subLabel) && (
          <View className="m-0">
            {label && (
              <Text nativeID={props.nativeID} className="text-sm font-semibold text-gray-700">
                {label}
                {required && <Text className="ml-1 text-red-500">*</Text>}
              </Text>
            )}
            {subLabel && <Text className="text-xs text-gray-500">{subLabel}</Text>}
          </View>
        )}

        <View className={containerClass}>
          {LeftIcon && (
            <View className="pl-2">
              <LeftIcon size={leftSize} color={iconColor} />
            </View>
          )}
          <TextInput
            ref={ref}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            editable={editable}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={inputClass}
            {...props}
          />
          {RightIcon && (
            <View className="pr-2">
              <RightIcon size={rightSize} color={iconColor} />
            </View>
          )}
        </View>

        {error && <Text className="text-xs text-red-500">{error}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';
