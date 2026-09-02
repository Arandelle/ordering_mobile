import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

export interface ButtonIconProps {
  icon: React.ComponentType<{ size?: number; color?: string; style?: object }>;
  size?: number;
  className?: string;
}

export interface ButtonProps extends TouchableOpacityProps {
  iconLeft?: ButtonIconProps;
  iconRight?: ButtonIconProps;
  text?: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'disabled'
    | 'underline';
  isLoading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[#e13e00] disabled:bg-gray-200',
  secondary: 'bg-gray-100 disabled:bg-gray-100',
  outline: 'border border-gray-300 bg-white disabled:bg-gray-50',
  ghost: 'bg-transparent disabled:bg-gray-50',
  danger: 'bg-red-500 disabled:bg-red-200',
  success: 'bg-green-500 disabled:bg-green-300',
  disabled: 'bg-gray-200',
  underline: 'bg-transparent disabled:bg-transparent',
};

const textVariantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white disabled:text-gray-400',
  secondary: 'text-gray-800 disabled:text-gray-400',
  outline: 'text-gray-700 disabled:text-gray-400',
  ghost: 'text-gray-700 disabled:text-gray-400',
  danger: 'text-white disabled:text-gray-400',
  success: 'text-white disabled:text-white',
  disabled: 'text-gray-400',
  underline: 'text-[#e13e00] underline disabled:text-gray-500',
};

export const Button = ({
  iconLeft,
  iconRight,
  text,
  variant = 'primary',
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  const containerClass = twMerge(
    'flex-row items-center justify-center gap-2 px-5 py-3.5',
    variantClasses[variant],
    isDisabled && 'opacity-60',
    className,
  );

  const textClass = twMerge(
    'text-sm font-bold',
    textVariantClasses[variant],
  );

  const iconColor = variant === 'primary' || variant === 'danger' || variant === 'success'
    ? (isDisabled ? '#9ca3af' : '#fff')
    : isDisabled ? '#9ca3af' : '#374151';

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={containerClass}
      style={style}
      activeOpacity={0.85}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          {isLoading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            iconLeft && (
              <View className={iconLeft.className}>
                <iconLeft.icon size={iconLeft.size ?? 16} color={iconColor} />
              </View>
            )
          )}
          {text && (
            <Text className={textClass}>
              {isLoading ? loadingText : text}
            </Text>
          )}
          {!isLoading && iconRight && (
            <View className={iconRight.className}>
              <iconRight.icon size={iconRight.size ?? 16} color={iconColor} />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

Button.displayName = 'Button';
