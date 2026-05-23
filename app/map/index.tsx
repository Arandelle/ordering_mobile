import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

export default function BranchMap() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 14.5995,
          longitude: 120.9842,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}>
        <UrlTile
          urlTemplate="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
          maximumZ={20}
          flipY={false}
        />
        <Marker
          coordinate={{
            latitude: 14.5995,
            longitude: 120.9842,
          }}
          title="Harrison Branch"
          description="Selected branch"
        />

        <Circle
          center={{
            latitude: 14.5995,
            longitude: 120.9842,
          }}
          radius={25000}
          strokeWidth={2}
          strokeColor="#e13e00"
          fillColor="rgba(225, 62, 0, 0.12)"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});
