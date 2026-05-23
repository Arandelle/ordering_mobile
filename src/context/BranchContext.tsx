'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Branch } from '@/types/branch';
import { useBranches } from '@/hooks/useBranches';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type BranchContextType = {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  userLocation: [number, number] | null;
  setUserLocation: (location: [number, number] | null) => void;
};

// Context
const BranchContext = createContext<BranchContextType | null>(null);

// Constant
const LOCATION_KEY = 'user_map_location';
const SELECTED_BRANCH_KEY = 'selected_branch_id';

const loadLocation = (): [number, number] | null => {
  try {
    const raw = sessionStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as [number, number]) : null;
  } catch {
    return null;
  }
};

const saveLocation = (location: [number, number] | null) => {
  try {
    if (location) {
      sessionStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    } else {
      sessionStorage.removeItem(LOCATION_KEY);
    }
  } catch {
    // sessionStorage blocked (e.g. private browsing restrictions) — silent fail
  }
};

// Provider
export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocationState] = useState<[number, number] | null>(loadLocation);
  const { data: branches = [] } = useBranches();

  // Load persisted values from AsyncStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [savedId, savedLocation] = await Promise.all([
          AsyncStorage.getItem(SELECTED_BRANCH_KEY),
          AsyncStorage.getItem(LOCATION_KEY),
        ]);

        if (savedId) setSelectedId(savedId);
        if (savedLocation) {
          const parsed = JSON.parse(savedLocation) as [number, number];
          setUserLocation(parsed);
        }
      } catch (err) {
        console.error('[BranchContext] Failed to load from AsyncStorage:', err);
      }
    };

    load();
  }, []);

  // Always resolve against fresh API data — never stale
  const selectedBranch = branches.find((b) => b._id === selectedId) ?? null;

  const setSelectedBranch = async (branch: Branch | null) => {
    setSelectedId(branch?._id ?? null);

    try {
      if (branch?._id) {
        await AsyncStorage.setItem(SELECTED_BRANCH_KEY, branch._id);
      } else {
        await AsyncStorage.removeItem(SELECTED_BRANCH_KEY);
      }
    } catch (err) {
      console.error('[BranchContext] Failed to save selected branch:', err);
    }
  };

  const setUserLocation = async (location: [number, number] | null) => {
    setUserLocationState(location);
    try {
      if (location) {
        await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
      } else {
        await AsyncStorage.removeItem(LOCATION_KEY);
      }
    } catch (err) {
      console.error('[BranchContext] Failed to save user location:', err);
    }
  };

  return (
    <BranchContext.Provider
      value={{ selectedBranch, setSelectedBranch, userLocation, setUserLocation }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranchContext = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
};
