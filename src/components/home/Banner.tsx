import React from 'react';
import { Image, Text, View } from 'react-native';

const Banner = () => {
  return (
    <View className="relative mx-4 mt-8">
      {/* Card */}
      <View className="overflow-hidden rounded-[28px] bg-[#E13E00] px-6 py-5 shadow-lg">
        {/* Decorative blobs */}
        <View className="absolute -right-10 -top-2 h-40 w-40 rounded-full bg-[#ff8a57]/20" />
        <View className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[#ffffff]/10" />

        <View className="flex-row items-center justify-between">
          {/* Text */}
          <View className="flex-1 pr-4">
            <Text className="text-sm font-medium text-orange-100">Good afternoon 👋</Text>

            <Text className="mt-1 text-3xl font-extrabold leading-tight text-white">
              What are you{'\n'}craving today?
            </Text>

            <Text className="mt-3 text-sm leading-5 text-orange-50/90">
              Freshly grilled meals and favorites waiting for you.
            </Text>
          </View>
        </View>
      </View>

      {/* Image OUTSIDE clipped container */}
      <View className="absolute -right-16 -top-6">
        <View className="h-56 w-56">
          <Image
            source={require('assets/images/harrison_phone.png')}
            className="h-full w-full"
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

export default Banner;
