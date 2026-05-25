import { Text, View } from 'react-native';

export const StoreClosedOverlay = ({ message }: { message: string }) => {
  // Split message into headline + detail (simple heuristic)
  const [headline, ...rest] = message.split('. ');
  const detail = rest.join('. ');

  return (
    <>
      {/* Dark overlay */}
      <View className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px]" />

      {/* Content */}
      <View className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">
        <View className="max-w-[90%] rounded-xl bg-white/95 px-4 py-3 shadow-lg">
          {/* Headline */}
          <Text className="text-sm font-bold text-red-600">{headline}</Text>

          {/* Optional detail */}
          {detail && <Text className="mt-1 text-[11px] leading-tight text-gray-600">{detail}</Text>}
        </View>
      </View>
    </>
  );
};
