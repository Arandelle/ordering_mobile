import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import CheckoutTextField from './CheckoutTextField';
import { useCheckout } from '@/context/CheckoutContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PsgcOption = {
  code: string;
  name: string;
  regionCode?: string;
  cityCode?: string;
  cityMunicipalityCode?: string;
  municipalityCode?: string;
  subMunicipalityCode?: string;
};

export const NCR_REGION = {
  code: '130000000',
  name: 'National Capital Region',
  displayName: 'Metro Manila',
} as const;

export const MANILA_CITY_CODE = '133900000';
const MANILA_SUB_MUNICIPALITY_CODE_PREFIX = MANILA_CITY_CODE.slice(0, 4);

const PSGC_API_BASE_URL = 'https://psgc.gitlab.io/api';

// ─── PSGC helpers ─────────────────────────────────────────────────────────────

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

export const findCityByName = (
  cities: PsgcOption[],
  value?: string,
): PsgcOption | undefined => {
  if (!value) return undefined;
  const normalizedValue = normalizePsgcName(value);
  return cities.find((city) => normalizePsgcName(city.name) === normalizedValue);
};

export const findManilaSubMunicipalityByName = (
  subMunicipalities: PsgcOption[],
  value?: string,
): PsgcOption | undefined => {
  if (!value) return undefined;
  const normalizedValue = normalizePsgcName(value);
  return subMunicipalities.find((subMunicipality) => {
    const normalizedName = normalizePsgcName(subMunicipality.name);
    return (
      normalizedName === normalizedValue ||
      normalizedName.includes(normalizedValue) ||
      normalizedValue.includes(normalizedName)
    );
  });
};

export const findBarangayByName = (
  barangays: PsgcOption[],
  value?: string,
): PsgcOption | undefined => {
  if (!value) return undefined;
  const normalizedValue = normalizePsgcName(value.replace(/^barangay\s+/i, ''));
  return barangays.find((barangay) => {
    const normalizedBarangay = normalizePsgcName(
      barangay.name.replace(/^barangay\s+/i, ''),
    );
    return normalizedBarangay === normalizedValue;
  });
};

const fetchPsgcOptions = async (path: string): Promise<PsgcOption[]> => {
  const response = await fetch(`${PSGC_API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error('Unable to load address options. Please try again.');
  }
  return response.json() as Promise<PsgcOption[]>;
};

export const fetchNcrCities = (): Promise<PsgcOption[]> =>
  fetchPsgcOptions(`/regions/${NCR_REGION.code}/cities-municipalities/`);

export const fetchManilaSubMunicipalities = async (): Promise<PsgcOption[]> => {
  try {
    return await fetchPsgcOptions(`/cities/${MANILA_CITY_CODE}/sub-municipalities/`);
  } catch {
    const subMunicipalities = await fetchPsgcOptions('/sub-municipalities/');
    return subMunicipalities.filter(
      (s) =>
        s.cityCode === MANILA_CITY_CODE ||
        s.cityMunicipalityCode === MANILA_CITY_CODE ||
        s.municipalityCode === MANILA_CITY_CODE ||
        s.code.startsWith(MANILA_SUB_MUNICIPALITY_CODE_PREFIX),
    );
  }
};

export const fetchCityBarangays = (cityCode: string): Promise<PsgcOption[]> =>
  fetchPsgcOptions(`/cities/${cityCode}/barangays/`);

export const fetchSubMunicipalityBarangays = async (
  cityCode: string,
  subMunicipalityCode?: string,
): Promise<PsgcOption[]> => {
  if (!subMunicipalityCode) return fetchCityBarangays(cityCode);
  try {
    return await fetchPsgcOptions(`/sub-municipalities/${subMunicipalityCode}/barangays/`);
  } catch {
    const cityBarangays = await fetchCityBarangays(cityCode);
    return cityBarangays.filter((b) => b.subMunicipalityCode === subMunicipalityCode);
  }
};

// ─── Modal Picker Component ───────────────────────────────────────────────────

type PickerOption = { value: string; label: string; disabled?: boolean };

function PsgcModalPicker({
  label,
  value,
  options,
  onChange,
  disabled,
  loading,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleSelect = (opt: PickerOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setSearch('');
    setModalOpen(false);
  };

  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold text-gray-600">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>

      <TouchableOpacity
        className={`flex-row items-center justify-between rounded-xl border bg-white px-3 py-3 ${
          error ? 'border-red-300' : 'border-gray-200'
        } ${disabled ? 'opacity-50' : ''}`}
        onPress={() => !disabled && setModalOpen(true)}
        activeOpacity={0.7}
        disabled={disabled || loading}>
        <Text
          className={`flex-1 text-sm ${selectedLabel ? 'text-gray-900' : 'text-gray-400'}`}
          numberOfLines={1}>
          {loading ? 'Loading...' : selectedLabel || placeholder || `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </TouchableOpacity>

      {error && <Text className="mt-1 text-xs font-semibold text-red-500">{error}</Text>}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[75%] rounded-t-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-base font-semibold text-gray-900">{label}</Text>
              <TouchableOpacity onPress={() => { setSearch(''); setModalOpen(false); }} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="border-b border-gray-100 px-4 py-2">
              <View className="flex-row items-center rounded-lg bg-gray-100 px-3">
                <Ionicons name="search-outline" size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 py-2 pl-2 text-sm text-gray-900"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`px-4 py-3 ${item.disabled ? 'opacity-40' : ''} ${
                    item.value === value ? 'bg-orange-50' : ''
                  }`}
                  disabled={item.disabled}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}>
                  <Text
                    className={`text-sm ${
                      item.value === value ? 'font-semibold text-[#e13e00]' : 'text-gray-700'
                    }`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-sm text-gray-400">
                    {search ? 'No matching results' : 'No options available'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PsgcAddressFields() {
  const { draft, setShippingField, errors } = useCheckout();

  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ['psgc', 'ncr-cities'],
    queryFn: fetchNcrCities,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedCity = useMemo(() => {
    if (!cities.length) return undefined;
    return cities.find((c) => c.code === draft.shippingAddress.cityCode)
      || findCityByName(cities, draft.shippingAddress.city);
  }, [cities, draft.shippingAddress.city, draft.shippingAddress.cityCode]);

  const isManila = selectedCity?.code === MANILA_CITY_CODE;

  const { data: manilaAreas = [], isLoading: isLoadingManilaAreas } = useQuery({
    queryKey: ['psgc', 'manila-sub-municipalities'],
    queryFn: fetchManilaSubMunicipalities,
    enabled: isManila,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedSubMunicipality = useMemo(() => {
    if (!isManila) return undefined;
    return manilaAreas.find((a) => a.code === draft.shippingAddress.subMunicipalityCode)
      || findManilaSubMunicipalityByName(manilaAreas, draft.shippingAddress.subMunicipality || draft.shippingAddress.line2);
  }, [isManila, manilaAreas, draft.shippingAddress.subMunicipalityCode, draft.shippingAddress.subMunicipality, draft.shippingAddress.line2]);

  const { data: barangays = [], isLoading: isLoadingBarangays } = useQuery({
    queryKey: ['psgc', 'barangays', selectedCity?.code, selectedSubMunicipality?.code ?? ''],
    queryFn: () => fetchSubMunicipalityBarangays(selectedCity?.code ?? '', selectedSubMunicipality?.code),
    enabled: Boolean(selectedCity?.code) && (!isManila || Boolean(selectedSubMunicipality?.code)),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedBarangay = useMemo(() => {
    return barangays.find((b) => b.code === draft.shippingAddress.barangayCode)
      || findBarangayByName(barangays, draft.shippingAddress.line2);
  }, [barangays, draft.shippingAddress.barangayCode, draft.shippingAddress.line2]);

  // Lock region/province to NCR
  useEffect(() => {
    if (!draft.shippingAddress.province) setShippingField('province', NCR_REGION.displayName);
    if (!draft.shippingAddress.region) setShippingField('region', NCR_REGION.name);
    if (!draft.shippingAddress.regionCode) setShippingField('regionCode', NCR_REGION.code);
  }, []);

  // Sync city when detected from map
  useEffect(() => {
    if (!selectedCity) return;
    if (draft.shippingAddress.city !== selectedCity.name) {
      setShippingField('city', selectedCity.name);
    }
    if (draft.shippingAddress.cityCode !== selectedCity.code) {
      setShippingField('cityCode', selectedCity.code);
    }
  }, [selectedCity]);

  // Clear child selections when city changes
  const handleCityChange = useCallback((cityCode: string) => {
    const city = cities.find((c) => c.code === cityCode);
    setShippingField('cityCode', city?.code ?? '');
    setShippingField('city', city?.name ?? '');
    setShippingField('province', NCR_REGION.displayName);
    setShippingField('subMunicipalityCode', '');
    setShippingField('subMunicipality', '');
    setShippingField('line2', '');
    setShippingField('barangayCode', '');
  }, [cities]);

  const handleSubMunicipalityChange = useCallback((code: string) => {
    const area = manilaAreas.find((a) => a.code === code);
    setShippingField('subMunicipalityCode', area?.code ?? '');
    setShippingField('subMunicipality', area?.name ?? '');
    setShippingField('line2', '');
    setShippingField('barangayCode', '');
  }, [manilaAreas]);

  const handleBarangayChange = useCallback((code: string) => {
    const barangay = barangays.find((b) => b.code === code);
    setShippingField('barangayCode', barangay?.code ?? '');
    setShippingField('line2', barangay?.name ?? '');
  }, [barangays]);

  return (
    <>
      {/* Region — locked */}
      <PsgcModalPicker
        label="Region"
        value={NCR_REGION.code}
        options={[{ value: NCR_REGION.code, label: NCR_REGION.displayName }]}
        onChange={() => {}}
        disabled
        required
      />

      {/* City */}
      <PsgcModalPicker
        label="City / Municipality"
        value={selectedCity?.code ?? ''}
        options={[
          { value: '', label: '— Select City —', disabled: true },
          ...cities.map((c) => ({ value: c.code, label: c.name })),
        ]}
        onChange={handleCityChange}
        disabled={isLoadingCities}
        loading={isLoadingCities}
        required
      />

      {/* Manila Area (sub-municipality) — only for Manila */}
      {isManila && (
        <PsgcModalPicker
          label="Manila Area"
          value={selectedSubMunicipality?.code ?? ''}
          options={[
            { value: '', label: '— Select Area —', disabled: true },
            ...manilaAreas.map((a) => ({ value: a.code, label: a.name })),
          ]}
          onChange={handleSubMunicipalityChange}
          disabled={isLoadingManilaAreas || !selectedCity}
          loading={isLoadingManilaAreas}
          required
        />
      )}

      {/* Barangay */}
      <PsgcModalPicker
        label="Barangay"
        value={selectedBarangay?.code ?? ''}
        options={[
          {
            value: '',
            label: isLoadingBarangays
              ? 'Loading barangays...'
              : isManila && !selectedSubMunicipality
                ? 'Select Manila area first'
                : !selectedCity
                  ? 'Select city first'
                  : '— Select Barangay —',
            disabled: true,
          },
          ...barangays.map((b) => ({ value: b.code, label: b.name })),
        ]}
        onChange={handleBarangayChange}
        disabled={isLoadingBarangays || !selectedCity || (isManila && !selectedSubMunicipality)}
        loading={isLoadingBarangays}
        required
      />

      {/* Province — locked */}
      <CheckoutTextField
        label="Province"
        value={NCR_REGION.displayName}
        editable={false}
        error={errors?.shipping.province}
      />
    </>
  );
}
