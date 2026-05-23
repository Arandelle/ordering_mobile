import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRANCHES = [
  { id: '1', name: 'Harrison Branch', address: 'Harrison Plaza, Malate, Manila' },
  { id: '2', name: 'Makati Branch', address: 'Ayala Ave, Makati City' },
  { id: '3', name: 'BGC Branch', address: 'Bonifacio High Street, Taguig' },
  { id: '4', name: 'Quezon City Branch', address: 'Timog Ave, Quezon City' },
];

type Branch = (typeof BRANCHES)[number];

export function BranchSelector() {
  const [selected, setSelected] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Trigger pill */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="mt-12 flex flex-col gap-2 px-6"
        activeOpacity={0.7}>
        <View className="flex flex-row items-center gap-2">
          <Ionicons name="storefront" size={20} color={'#e13e00'} />
          <Text className="text-xl font-semibold tracking-widest" numberOfLines={1}>
            {selected ? selected.name : 'Select Branch'}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-forward'} />
        </View>
        <View className="h-px w-14 bg-[#e13e00]" />
      </TouchableOpacity>

      {/* Bottom sheet modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Select a Branch</Text>

            <FlatList
              data={BRANCHES}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isActive = selected?.id === item.id;
                return (
                  <TouchableOpacity
                    style={styles.branchRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelected(item);
                      setOpen(false);
                    }}>
                    {/* Icon */}
                    <View style={[styles.branchIcon, isActive && styles.branchIconActive]}>
                      <Ionicons
                        name="storefront-outline"
                        size={16}
                        color={isActive ? '#fff' : '#e13e00'}
                      />
                    </View>

                    {/* Text */}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.branchName, isActive && styles.branchNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.branchAddress}>{item.address}</Text>
                    </View>

                    {/* Check */}
                    {isActive && <Ionicons name="checkmark-circle" size={20} color="#e13e00" />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff5f2',
    borderWidth: 1,
    borderColor: '#fdd5c8',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 180,
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  branchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff5f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchIconActive: {
    backgroundColor: '#e13e00',
  },
  branchName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  branchNameActive: {
    color: '#e13e00',
  },
  branchAddress: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
});
