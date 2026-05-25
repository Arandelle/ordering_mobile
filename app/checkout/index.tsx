import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const index = () => {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={() => router.push('/checkout/address')}>
        <Text>Go to Address Form</Text>
      </TouchableOpacity>
    </View>
  );
};

export default index;
