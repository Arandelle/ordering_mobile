import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';

export function OrderItemImage({
  image,
  name = 'Order item',
}: {
  image?: string | null;
  name?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={`${name} image not available`}
        className="h-full w-full items-center justify-center bg-orange-50 px-1">
        <Flame size={20} color="#fed7aa" />
        <Text className="mt-1 text-center text-[10px] font-semibold text-gray-500">
          No image
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: image }}
      accessibilityLabel={name}
      className="h-full w-full"
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}
