import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button } from './ui/Button';

export interface UndoBannerProps {
  /** Main message content (string or JSX with styled children) */
  message: ReactNode;
  /** Seconds remaining on the countdown */
  secondsLeft: number;
  /** Total duration in seconds — used for the progress bar width */
  duration: number;
  /** Called when the user taps the undo button */
  onUndo: () => void;
  /** Label for the action button (default: "Undo") */
  actionLabel?: string;
  /** Ionicons icon name shown in the left circle (default: "trash-outline") */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Tint color for the icon circle background (default: red-500/20) */
  iconTint?: string;
  /** Icon color (default: #f87171) */
  iconColor?: string;
}

/**
 * Generic animated undo banner with a countdown progress bar.
 *
 * Usage:
 *   <UndoBanner
 *     message={<>Removed <Text className="font-semibold">{item.name}</Text></>}
 *     secondsLeft={secondsLeft}
 *     duration={5}
 *     onUndo={handleUndo}
 *   />
 *
 * Can be reused for cart removals, order cancellations, list deletions, etc.
 */
export function UndoBanner({
  message,
  secondsLeft,
  duration,
  onUndo,
  actionLabel = 'Undo',
  iconName = 'trash-outline',
  iconTint = 'rgba(239, 68, 68, 0.2)',
  iconColor = '#f87171',
}: UndoBannerProps) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 250 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const progressWidth = duration > 0 ? (secondsLeft / duration) * 100 : 0;

  return (
    <Animated.View
      style={animatedStyle}
      className="mx-3 mb-2 overflow-hidden rounded-2xl bg-gray-900 shadow-lg"
    >
      <View className="flex-row items-center px-4 py-3">
        <View
          className="mr-3 h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: iconTint }}
        >
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>

        <View className="flex-1">
          <Text className="text-sm text-white" numberOfLines={1}>
            {message}
          </Text>
          <Text className="mt-0.5 text-[11px] text-gray-400">
            {actionLabel} within {secondsLeft}s
          </Text>
        </View>

        <Button
          onPress={onUndo}
          text={actionLabel}
          variant="outline"
          className="ml-3"
        />
      </View>

      {/* Progress bar */}
      <View className="h-1 w-full bg-gray-800">
        <Animated.View
          style={{
            width: `${progressWidth}%`,
            height: '100%',
            backgroundColor: '#f97316',
          }}
        />
      </View>
    </Animated.View>
  );
}
