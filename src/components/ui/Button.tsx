import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Icon } from './Icon';

export interface ButtonIconProps {
  name: string | null;
  size?: number;
  color?: string;
  position?: 'left' | 'right';
  iconSet?: 'lucide' | 'ionicons';
}

export interface ButtonLoadingProps {
  isLoading: boolean;
  text?: string;
}

export interface ButtonProps extends TouchableOpacityProps {
  icon?: ButtonIconProps;
  loading?: ButtonLoadingProps;
  text?: string;
  textClassName?: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'disabled'
    | 'underline';
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
  icon,
  loading,
  text,
  textClassName,
  variant = 'primary',
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) => {
  const isLoading = loading?.isLoading ?? false;
  const isDisabled = disabled || isLoading;
  const iconPosition = icon?.position ?? 'left';
  const iconSize = icon?.size ?? 16;

  const containerClass = twMerge(
    'flex-row items-center justify-center gap-2 px-5 py-3.5',
    variantClasses[variant],
    isDisabled && 'opacity-60',
    className,
  );

  const textClass = twMerge(
    'text-sm font-bold',
    textVariantClasses[variant],
    isDisabled && 'opacity-60 text-gray-900',
    textClassName,
  );

  const iconColor =
    icon?.color ??
    (variant === 'primary' || variant === 'danger' || variant === 'success'
      ? isDisabled
        ? '#9ca3af'
        : '#fff'
      : isDisabled
        ? '#9ca3af'
        : '#374151');

  const renderIcon = () => {
    if (!icon || !icon.name|| isLoading) return null;
    return (
      <Icon
        name={icon.name}
        size={iconSize}
        color={iconColor}
        iconSet={icon.iconSet}
      />
    );
  };

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
            iconPosition === 'left' && icon?.name && renderIcon()
          )}
          {text && (
            <Text className={textClass}>
              {isLoading ? (loading?.text ?? 'Loading...') : text}
            </Text>
          )}
          {!isLoading && iconPosition === 'right' && icon?.name && renderIcon()}
        </>
      )}
    </TouchableOpacity>
  );
};

Button.displayName = 'Button';
