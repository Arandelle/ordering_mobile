import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBranches } from '@/hooks/useBranches';
import { useBranchContext } from '@/context/BranchContext';
import BottomSheet from '@/components/BottomSheet';

export function BranchSelector() {
  const [open, setOpen] = useState(false);

  const { data: branches = [], isLoading, isError, refetch } = useBranches();

  const {
    selectedBranch,
    setSelectedBranch,
    userLocation: userMarker,
    setUserLocation,
  } = useBranchContext();

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
            {selectedBranch ? selectedBranch.name : 'Select Branch'}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-forward'} />
        </View>
        <View className="h-px w-14 bg-[#e13e00]" />
      </TouchableOpacity>

      {/* Bottom sheet modal */}
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text className="mb-4 text-lg font-bold text-slate-900">Select a Branch</Text>
        <FlatList
          data={branches}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-200" />}
          renderItem={({ item }) => {
            const isActive = selectedBranch?._id === item._id;
            return (
              <TouchableOpacity
                className="flex flex-row items-center gap-3 py-6"
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedBranch(item);
                  setOpen(false);
                }}>
                {/* Icon */}
                <View
                  className={`h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-[#e13e00]' : 'bg-[#fff5f2]'}`}>
                  <Ionicons
                    name="storefront-outline"
                    size={16}
                    color={isActive ? '#fff' : '#e13e00'}
                  />
                </View>

                {/* Text */}
                <View className="flex-1">
                  <Text
                    className={`text-sm font-semibold ${isActive ? 'text-[#e13e00]' : 'text-gray-900'}`}>
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-600">{item.address}</Text>
                </View>

                {/* Check */}
                {isActive && <Ionicons name="checkmark-circle" size={20} color="#e13e00" />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            isLoading ? (
              <View className="items-center py-16">
                <ActivityIndicator size="large" color="#e13e00" />
              </View>
            ) : isError ? (
              <View className="items-center py-16">
                <Text className="mb-3 text-sm text-gray-400">Failed to load branches</Text>
                <TouchableOpacity onPress={() => refetch()}>
                  <Text className="text-xs font-semibold text-[#e13e00]">Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center py-10">
                <Text className="text-gray-400">No branches found.</Text>
              </View>
            )
          }
        />
      </BottomSheet>
    </>
  );
}
