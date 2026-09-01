import { useState } from 'react';
import { Image, View } from 'react-native';
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
        className="h-full w-full items-center justify-center bg-orange-50">
        <Flame size={22} color="#fdba74" />
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
