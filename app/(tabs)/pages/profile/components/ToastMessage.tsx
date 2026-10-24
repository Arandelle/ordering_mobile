import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TOAST_VARIANTS = {
  error: {
    icon: 'alert-circle',
    title: 'Error',
    color: '#dc2626',
    accent: 'bg-red-500',
    iconBg: 'bg-red-50',
    duration: 5000,
  },
  success: {
    icon: 'checkmark-circle',
    title: 'Success',
    color: '#16a34a',
    accent: 'bg-green-500',
    iconBg: 'bg-green-50',
    duration: 3000,
  },
} as const;

type ToastProps = {
  variant: keyof typeof TOAST_VARIANTS;
  message: string;
  onDismiss: () => void;
};

export function Toast({ variant, message, onDismiss }: ToastProps) {
  const v = TOAST_VARIANTS[variant];
  const anim = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const dismiss = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismissRef.current();
    });
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(dismiss, v.duration);
    return () => clearTimeout(timer);
  }, [message, anim, dismiss, v.duration]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
        ],
      }}>
      <Pressable
        onPress={dismiss}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-row overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
        <View className={`w-1.5 ${v.accent}`} />
        <View className="flex-1 flex-row items-center gap-3 px-3 py-3">
          <View className={`h-8 w-8 items-center justify-center rounded-full ${v.iconBg}`}>
            <Ionicons name={v.icon} size={18} color={v.color} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {v.title}
            </Text>
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={3}>
              {message}
            </Text>
          </View>
          <Ionicons name="close" size={16} color="#9ca3af" />
        </View>
      </Pressable>
    </Animated.View>
  );
}