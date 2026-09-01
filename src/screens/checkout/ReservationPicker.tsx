import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import type { SettingsType } from '@/hooks/useSettings';


/** Add hours to a date, return new ISO string */
function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

/** Add days to a date, return new ISO string */
function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

function roundToNext30Min(date: Date): Date {
  const minutes = date.getMinutes();
  const rounded = new Date(date);
  if (minutes % 30 !== 0) {
    rounded.setMinutes(Math.ceil(minutes / 30) * 30, 0, 0);
  } else {
    rounded.setMinutes(minutes, 0, 0);
  }
  return rounded;
}

export function ReservationPicker({
  scheduledAt,
  partySize,
  onChangeScheduledAt,
  onChangePartySize,
  error,
  operatingHours,
}: {
  scheduledAt: string;
  partySize: number;
  onChangeScheduledAt: (value: string) => void;
  onChangePartySize: (value: number) => void;
  error?: string;
  operatingHours?: SettingsType['operatingHours'] | null;
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // Initialize with next 30-min slot if invalid
  const baseDate = (() => {
    const d = new Date(scheduledAt);
    if (isNaN(d.getTime()) || d <= new Date()) return roundToNext30Min(new Date(Date.now() + 3600000)).toISOString();
    return scheduledAt;
  })();

  const date = new Date(baseDate);

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    setDatePickerOpen(false);
    if (selectedDate) {
      // Preserve the time from the current baseDate
      const current = new Date(baseDate);
      selectedDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds(), current.getMilliseconds());
      onChangeScheduledAt(selectedDate.toISOString());
    }
  };

  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    setTimePickerOpen(false);
    if (selectedDate) {
      // Preserve the date from the current baseDate
      const current = new Date(baseDate);
      selectedDate.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
      onChangeScheduledAt(selectedDate.toISOString());
    }
  };

  return (
    <View className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color="#e13e00" />
        <Text className="text-sm font-bold text-gray-900">Reservation Details</Text>
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
            onPress={() => onChangeScheduledAt(addDays(baseDate, -1))}
            disabled={new Date(addDays(baseDate, -1)) < new Date()}>
            <Ionicons name="chevron-back" size={16} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChangeScheduledAt(addDays(baseDate, 1))}>
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
        className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        onPress={() => setTimePickerOpen(true)}
        activeOpacity={0.7}>
        <View>
          <Text className="text-xs text-gray-400">Time</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChangeScheduledAt(addHours(baseDate, -0.5))}>
            <Ionicons name="remove" size={14} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChangeScheduledAt(addHours(baseDate, 0.5))}>
            <Ionicons name="add" size={14} color="#e13e00" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {timePickerOpen && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minuteInterval={30}
          onChange={handleTimeChange}
        />
      )}

      {/* Party size */}
      <View className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
        <View>
          <Text className="text-xs text-gray-400">Party Size</Text>
          <Text className="text-sm font-semibold text-gray-900">{partySize} guest{partySize !== 1 ? 's' : ''}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChangePartySize(Math.max(1, partySize - 1))}
            disabled={partySize <= 1}>
            <Ionicons name="remove" size={14} color={partySize <= 1 ? '#d1d5db' : '#111827'} />
          </TouchableOpacity>
          <Text className="w-6 text-center text-sm font-bold text-gray-900">{partySize}</Text>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full border border-gray-200"
            onPress={() => onChangePartySize(Math.min(20, partySize + 1))}
            disabled={partySize >= 20}>
            <Ionicons name="add" size={14} color={partySize >= 20 ? '#d1d5db' : '#e13e00'} />
          </TouchableOpacity>
        </View>
      </View>

      {operatingHours && !operatingHours.isClosed && (
        <Text className="mt-2 text-xs text-gray-400">
          Store hours: {operatingHours.openTime} – {operatingHours.closeTime}
        </Text>
      )}

      {error && <Text className="mt-1 text-xs font-semibold text-red-500">{error}</Text>}
    </View>
  );
}
