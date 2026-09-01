import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import type { SettingsType } from '@/hooks/useSettings';

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Select pickup time';
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function PickupTimePicker({
  value,
  onChange,
  error,
  operatingHours,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  operatingHours?: SettingsType['operatingHours'] | null;
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // Ensure the value is always valid
  const safeValue = (() => {
    const d = new Date(value);
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60000); // 15 min from now
    if (isNaN(d.getTime()) || d < minTime) {
      return new Date(now.getTime() + 30 * 60000).toISOString();
    }
    return value;
  })();

  const date = new Date(safeValue);

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    setDatePickerOpen(false);
    if (selectedDate) {
      const current = new Date(safeValue);
      selectedDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds(), current.getMilliseconds());
      onChange(selectedDate.toISOString());
    }
  };

  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    setTimePickerOpen(false);
    if (selectedDate) {
      const current = new Date(safeValue);
      selectedDate.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
      onChange(selectedDate.toISOString());
    }
  };

  return (
    <View className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="time-outline" size={16} color="#e13e00" />
        <Text className="text-sm font-bold text-gray-900">Pickup Time</Text>
      </View>

      {/* Date */}
      <TouchableOpacity
        className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        onPress={() => setDatePickerOpen(true)}
        activeOpacity={0.7}>
        <View>
          <Text className="text-xs text-gray-400">Date</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChange(addHours(safeValue, -24))}>
            <Ionicons name="chevron-back" size={16} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChange(addHours(safeValue, 24))}>
            <Ionicons name="chevron-forward" size={16} color="#e13e00" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {datePickerOpen && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Time */}
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        onPress={() => setTimePickerOpen(true)}
        activeOpacity={0.7}>
        <View>
          <Text className="text-xs text-gray-400">Time</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {formatDateTime(safeValue)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChange(addMinutes(safeValue, -15))}>
            <Ionicons name="remove" size={14} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChange(addMinutes(safeValue, 15))}>
            <Ionicons name="add" size={14} color="#e13e00" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {timePickerOpen && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {operatingHours && !operatingHours.isClosed && (
        <Text className="mt-2 text-xs text-gray-400">
          Store hours: {operatingHours.openTime} – {operatingHours.closeTime}
        </Text>
      )}

      {error && <Text className="mt-1 text-xs font-semibold text-red-500">{error}</Text>}
    </View>
  );
}
