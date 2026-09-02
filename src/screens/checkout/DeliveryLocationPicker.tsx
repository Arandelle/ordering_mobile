import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliveryCoordinates = { lat: number; lng: number };

export type ResolvedDeliveryAddress = {
  placeName?: string;
  road?: string;
  line2?: string;
  city?: string;
  province?: string;
  subMunicipality?: string;
  zipCode?: string;
};

type ReverseGeocodeResponse = {
  name?: string;
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    quarter?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    suburb?: string;
    city_district?: string;
    county?: string;
    state_district?: string;
    state?: string;
    region?: string;
    postcode?: string;
  };
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

// NCR bounding box for search bias
const NCR_VIEWBOX = '120.94,14.76,121.12,14.35';
const METRO_MANILA_CENTER = { latitude: 14.5995, longitude: 120.9842 };

// PSGC API
const PSGC_API_BASE_URL = 'https://psgc.gitlab.io/api';
const NCR_REGION_CODE = '130000000';

export const normalizePsgcName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^city\s+of\s*/g, '')
    .replace(/^municipality\s+of\s*/g, '')
    .replace(/\s*city$/g, '')
    .replace(/\s*municipality$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ─── PSGC helpers ─────────────────────────────────────────────────────────────

async function fetchNcrCities(): Promise<Array<{ code: string; name: string }>> {
  const res = await fetch(`${PSGC_API_BASE_URL}/regions/${NCR_REGION_CODE}/cities-municipalities/`);
  if (!res.ok) return [];
  return res.json();
}

async function findCityCode(cityName: string): Promise<{ code: string; name: string } | null> {
  if (!cityName) return null;
  const cities = await fetchNcrCities();
  const normalizedInput = normalizePsgcName(cityName);
  // Try exact match first, then partial
  const exactMatch = cities.find((c) => normalizePsgcName(c.name) === normalizedInput);
  if (exactMatch) return exactMatch;
  const partialMatch = cities.find((c) => normalizePsgcName(c.name).includes(normalizedInput) || normalizedInput.includes(normalizePsgcName(c.name)));
  return partialMatch ?? null;
}

async function fetchBarangays(cityCode: string): Promise<Array<{ code: string; name: string }>> {
  const res = await fetch(`${PSGC_API_BASE_URL}/cities/${cityCode}/barangays/`);
  if (!res.ok) return [];
  return res.json();
}

// ─── Nominatim helpers ────────────────────────────────────────────────────────

async function reverseGeocode(coords: DeliveryCoordinates): Promise<ResolvedDeliveryAddress & { cityCode?: string; barangayCode?: string } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'HarrisonExpoApp/1.0 (https://github.com/harrison-expo)',
      },
    },
  );
  if (!response.ok) return null;

  const data = (await response.json()) as ReverseGeocodeResponse;
  const address = data.address;
  if (!address) return null;

  // Build line2 from neighbourhood/village/suburb
  const line2 = address.neighbourhood ?? address.village ?? address.suburb ?? address.city_district;
  // City from city/town/municipality
  const city = address.city ?? address.town ?? address.municipality;
  // Province from state/region
  const province = address.state ?? address.region ?? address.state_district ?? address.county;
  // Road with house number
  const road = address.house_number && address.road
    ? `${address.house_number} ${address.road}`
    : address.road;

  const parts = [data.name ?? address.road, line2, city].filter(Boolean).slice(0, 3);

  const baseAddress: ResolvedDeliveryAddress = {
    placeName: parts.join(', ') || data.display_name,
    road,
    line2,
    city,
    province,
    subMunicipality: address.city_district ?? address.quarter ?? address.suburb,
    zipCode: address.postcode,
  };

  // Resolve PSGC city code
  const cityMatch = await findCityCode(city ?? '');

  // Resolve barangay code if city found
  let barangayCode: string | undefined;
  if (cityMatch && line2) {
    try {
      const barangays = await fetchBarangays(cityMatch.code);
      const normalizedLine2 = normalizePsgcName(line2.replace(/^barangay\s+/i, ''));
      // Try exact match first, then partial
      const exactBMatch = barangays.find((b) =>
        normalizePsgcName(b.name.replace(/^barangay\s+/i, '')) === normalizedLine2,
      );
      const partialBMatch = barangays.find((b) => {
        const normalizedName = normalizePsgcName(b.name.replace(/^barangay\s+/i, ''));
        return normalizedName.includes(normalizedLine2) || normalizedLine2.includes(normalizedName);
      });
      const bMatch = exactBMatch ?? partialBMatch;
      if (bMatch) barangayCode = bMatch.code;
    } catch {
      // Barangay lookup failed — still return base address
    }
  }

  return {
    ...baseAddress,
    cityCode: cityMatch?.code,
    barangayCode,
  };
}

async function searchAddress(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&countrycodes=ph&format=json&limit=5`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'HarrisonExpoApp/1.0 (https://github.com/harrison-expo)',
      },
    });

    if (response.status === 403) {
      console.error(
        '[searchAddress] Nominatim returned 403. Ensure a valid User-Agent header is set.',
      );
      return [];
    }

    if (!response.ok) return [];

    const data = await response.json();
    return data as SearchResult[];
  } catch (err) {
    console.log('[searchAddress] Error:', err);
    return [];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeliveryLocationPicker({
  value,
  addressQuery,
  onChange,
  onAddressResolved,
  error,
}: {
  value?: DeliveryCoordinates;
  addressQuery?: string;
  onChange: (coords: DeliveryCoordinates) => void;
  onAddressResolved?: (address: ResolvedDeliveryAddress & { cityCode?: string; barangayCode?: string }) => void;
  error?: string;
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const resolveRequestIdRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState(addressQuery ?? '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedDeliveryAddress | null>(null);
  const [locationError, setLocationError] = useState<string | null>(error ?? null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Sync external error & address query
  useEffect(() => {
    setLocationError(error ?? null);
  }, [error]);

  useEffect(() => {
    if (addressQuery && !searchQuery) {
      setSearchQuery(addressQuery);
    }
  }, [addressQuery]);

  // Resolve address from coordinates — PSGC codes resolved inside reverseGeocode
  const resolveAddress = useCallback(
    async (coords: DeliveryCoordinates) => {
      const requestId = ++resolveRequestIdRef.current;
      setIsResolving(true);
      setResolvedAddress(null);

      try {
        const resolved = await reverseGeocode(coords);
        if (requestId !== resolveRequestIdRef.current) return;

        if (resolved) {
          const { cityCode, barangayCode, ...baseAddress } = resolved;
          setResolvedAddress(baseAddress);
          onAddressResolved?.(resolved);
        }
        onChange(coords);
      } catch {
        // Coordinates remain authoritative even if reverse geocoding fails
      } finally {
        if (requestId === resolveRequestIdRef.current) {
          setIsResolving(false);
        }
      }
    },
    [onChange, onAddressResolved],
  );

  // Handle map tap
  const handleMapPress = useCallback(
    (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setSearchResults([]);
      resolveAddress({ lat: latitude, lng: longitude });
    },
    [resolveAddress],
  );

  // Search address
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 3) {
      setLocationError('Enter at least 3 characters to search an address.');
      return;
    }

    setIsSearching(true);
    setLocationError(null);
    setSearchResults([]);

    const results = await searchAddress(searchQuery);
    setSearchResults(results);
    setIsSearching(false);

    if (results.length === 0) {
      setLocationError('No matching address found. Try a nearby landmark.');
    }
  }, [searchQuery]);

  // Select a search result
  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      setSearchResults([]);
      setSearchQuery(result.display_name);
      const coords = { lat: Number(result.lat), lng: Number(result.lon) };

      mapRef.current?.animateToRegion(
        { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );
      resolveAddress(coords);
    },
    [resolveAddress],
  );

  // Use current location
  const handleCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(
          'Location permission denied. Enable location services and try again.',
        );
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = location.coords;

      // Detect expo-location mock coordinates (Silicon Valley area in development mode)
      const isMockLocation =
        latitude > 37.0 && latitude < 38.0 &&
        longitude > -123.0 && longitude < -121.0;

      if (isMockLocation) {
        setLocationError(
          'Location services are in development mode. Please tap on the map or search instead.',
        );
        setIsLocating(false);
        return;
      }

      if (accuracy != null && accuracy > 50_000) {
        setLocationError(
          'Location accuracy too low. Please search or tap on the map instead.',
        );
        setIsLocating(false);
        return;
      }

      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );
      resolveAddress({ lat: latitude, lng: longitude });
    } catch {
      setLocationError('Could not get your location. Try searching instead.');
    } finally {
      setIsLocating(false);
    }
  }, [resolveAddress]);

  // Animate map when value changes externally
  useEffect(() => {
    if (value && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: value.lat, longitude: value.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400,
      );
    }
  }, [value]);

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      {/* Search bar */}
      <View className="flex-row gap-2">
        <View className="flex-1 flex-row items-center rounded-xl border border-gray-200 bg-white px-3">
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 py-2.5 pl-2 text-sm text-gray-900"
            placeholder="Search address or landmark"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={(v) => {
              setSearchQuery(v);
              setLocationError(null);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity
          className={`items-center justify-center rounded-xl px-3 ${
            isSearching ? 'bg-gray-300' : 'bg-gray-900'
          }`}
          disabled={isSearching}
          onPress={handleSearch}>
          {isSearching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {searchResults.map((result, idx) => (
            <TouchableOpacity
              key={`${result.lat}-${result.lon}`}
              className={`px-4 py-2.5 ${idx < searchResults.length - 1 ? 'border-b border-gray-100' : ''}`}
              onPress={() => handleResultSelect(result)}>
              <Text className="text-xs text-gray-600" numberOfLines={2}>
                {result.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Current location button */}
      <TouchableOpacity
        className={`mt-2 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
          isLocating ? 'bg-gray-300' : 'bg-[#e13e00]'
        }`}
        disabled={isLocating}
        onPress={handleCurrentLocation}>
        {isLocating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="locate" size={16} color="#fff" />
        )}
        <Text className="text-sm font-bold text-white">
          {isLocating ? 'Getting location...' : 'Use current location'}
        </Text>
      </TouchableOpacity>

      {/* Error message */}
      {locationError && (
        <View className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <Text className="text-xs font-medium text-red-600">{locationError}</Text>
        </View>
      )}

      {/* Pin button — opens full-screen map modal */}
      <TouchableOpacity
        className={`mt-3 flex-row items-start gap-3 rounded-xl border px-4 py-4 ${
          value ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
        }`}
        onPress={() => setMapModalOpen(true)}
        activeOpacity={0.7}>
        <View className={`mt-0.5 h-10 w-10 items-center justify-center rounded-full ${
          value ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <Ionicons name={value ? 'map' : 'map-outline'} size={18} color={value ? '#16a34a' : '#6b7280'} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className={`text-sm font-semibold ${value ? 'text-green-700' : 'text-gray-900'}`}>
            {value ? 'Delivery location pinned' : 'Pin your delivery location'}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-gray-600" numberOfLines={2}>
            {resolvedAddress?.placeName || (value ? 'Coordinates saved' : 'Open the map to search, use current location, or place the pin.')}
          </Text>
          {value && (
            <Text className="mt-2 text-[11px] font-medium text-gray-500">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" className="mt-2" />
      </TouchableOpacity>

      {/* Map modal */}
      <Modal visible={mapModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-gray-50 px-5 pt-5">
          {/* Header */}
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-gray-950">Pin delivery location</Text>
              <Text className="text-xs text-gray-500">
                Search, use current location, or tap the map to place the pin.
              </Text>
            </View>
            <TouchableOpacity
              className="rounded-full bg-gray-100 p-2"
              onPress={() => setMapModalOpen(false)}
              activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Search bar inside modal */}
          <View className="mb-2 flex-row gap-2">
            <View className="flex-1 flex-row items-center rounded-xl border border-gray-200 bg-white px-3">
              <Ionicons name="search-outline" size={16} color="#9ca3af" />
              <TextInput
                className="flex-1 py-2.5 pl-2 text-sm text-gray-900"
                placeholder="Search address or landmark"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={(v) => {
                  setSearchQuery(v);
                  setLocationError(null);
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              className={`items-center justify-center rounded-xl px-3 ${
                isSearching ? 'bg-gray-300' : 'bg-gray-900'
              }`}
              disabled={isSearching}
              onPress={handleSearch}>
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Search results inside modal */}
          {searchResults.length > 0 && (
            <View className="mb-2 max-h-40 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {searchResults.map((result, idx) => (
                <TouchableOpacity
                  key={`${result.lat}-${result.lon}`}
                  className={`px-4 py-2.5 ${idx < searchResults.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onPress={() => handleResultSelect(result)}>
                  <Text className="text-xs text-gray-600" numberOfLines={2}>
                    {result.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Current location button inside modal */}
          <TouchableOpacity
            className={`mb-2 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
              isLocating ? 'bg-gray-300' : 'bg-[#e13e00]'
            }`}
            disabled={isLocating}
            onPress={handleCurrentLocation}>
            {isLocating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="locate" size={16} color="#fff" />
            )}
            <Text className="text-sm font-bold text-white">
              {isLocating ? 'Getting location...' : 'Use current location'}
            </Text>
          </TouchableOpacity>

          {/* Error message inside modal */}
          {locationError && (
            <View className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <Text className="text-xs font-medium text-red-600">{locationError}</Text>
            </View>
          )}

          {/* Resolved address hint */}
          {resolvedAddress && (
            <View className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="location" size={14} color="#16a34a" />
                <Text className="flex-1 text-xs text-green-700" numberOfLines={2}>
                  {resolvedAddress.placeName || 'Pinned location'}
                </Text>
              </View>
            </View>
          )}

          {/* Resolving indicator */}
          {isResolving && (
            <View className="mb-3 flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#e13e00" />
              <Text className="text-xs text-gray-500">Resolving address...</Text>
            </View>
          )}

          {/* Map */}
          <View className="flex-1 overflow-hidden rounded-xl border border-gray-200">
            <MapView
              ref={mapRef}
              style={{ width: '100%', height: '100%' }}
              initialRegion={{
                latitude: value?.lat ?? METRO_MANILA_CENTER.latitude,
                longitude: value?.lng ?? METRO_MANILA_CENTER.longitude,
                latitudeDelta: value ? 0.01 : 0.15,
                longitudeDelta: value ? 0.01 : 0.15,
              }}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton
              showsCompass
              showsScale>
              {value && (
                <Marker
                  coordinate={{ latitude: value.lat, longitude: value.lng }}
                  title="Delivery pin"
                  description={resolvedAddress?.placeName || 'Pinned location'}
                  draggable
                  onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    resolveAddress({ lat: latitude, lng: longitude });
                  }}
                />
              )}
            </MapView>
          </View>

          {/* Hint */}
          <View className="mt-3 flex-row items-start gap-2">
            <Ionicons name="information-circle" size={14} color="#9ca3af" className="mt-0.5" />
            <Text className="flex-1 text-xs text-gray-500">
              Tap the map or drag the pin to set your delivery location.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
