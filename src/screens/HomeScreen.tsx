import { View, Text, ScrollView, Image } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Harrison Inasal 🍗
      </Text>

      <Text style={{ color: "gray", marginBottom: 20 }}>
        Authentic Filipino BBQ
      </Text>

      <Image
        source={{ uri: "https://picsum.photos/400/200" }}
        style={{ width: "100%", height: 200, borderRadius: 10 }}
      />

      <Text style={{ fontSize: 18, marginTop: 20 }}>
        Popular Items
      </Text>

    </ScrollView>
  );
}