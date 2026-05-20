// app/product/[id].tsx

import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function ProductDetailsPage() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Product ID: {id}</Text>
    </View>
  );
}