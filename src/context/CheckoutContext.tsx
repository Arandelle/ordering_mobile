import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { apiClient } from '@/lib/apiClient';
import { FULFILLMENT_TYPE } from '@/types/orders.type';
import type { FulfillmentType, CreateOrderPayload, CreateOrderResponse } from '@/types/orders.type';
import type { Branch } from '@/types/branch.type';
import { useMyAddress } from '@/hooks/useAddress';
import { isAllowedCustomerDomain } from '@/lib/isAllowedEmails';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckoutPaymentMethod = 'cod' | 'maya' | 'wallet';

export interface CheckoutPersonalDetails {
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

export interface CheckoutAddressDetails {
  line1: string;
  line2: string;
  city: string;
  cityCode: string;
  province: string;
  zipCode: string;
  country: string;
  landmark: string;
  barangayCode: string;
  subMunicipality: string;
  subMunicipalityCode: string;
  region: string;
  regionCode: string;
  placeName: string;
  coordinates?: { lat: number; lng: number };
  pinnedCity?: string;
  pinnedLine2?: string;
}

export interface CheckoutReservation {
  scheduledAt: string;
  partySize: number;
}

export interface CheckoutErrors {
  customer: Partial<Record<keyof CheckoutPersonalDetails, string>>;
  shipping: Partial<Record<keyof CheckoutAddressDetails, string>>;
  reservation: Partial<Record<keyof CheckoutReservation, string>>;
  pickupTime: string | null;
}

export interface CheckoutDraft {
  fulfillmentType: FulfillmentType;
  customer: CheckoutPersonalDetails;
  shippingAddress: CheckoutAddressDetails;
  reservation: CheckoutReservation;
  pickupTime: string;
  paymentMethod: CheckoutPaymentMethod;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultCustomer = (): CheckoutPersonalDetails => ({
  firstName: '',
  lastName: '',
  customerEmail: '',
  customerPhone: '',
  notes: '',
});

const defaultAddress = (): CheckoutAddressDetails => ({
  line1: '',
  line2: '',
  city: '',
  cityCode: '',
  province: '',
  zipCode: '',
  country: 'Philippines',
  landmark: '',
  barangayCode: '',
  subMunicipality: '',
  subMunicipalityCode: '',
  region: '',
  regionCode: '',
  placeName: '',
  pinnedCity: '',
  pinnedLine2: '',
});

const defaultReservation = (): CheckoutReservation => ({
  scheduledAt: new Date().toISOString(),
  partySize: 1,
});

const defaultDraft = (): CheckoutDraft => ({
  fulfillmentType: FULFILLMENT_TYPE.DELIVERY,
  customer: defaultCustomer(),
  shippingAddress: defaultAddress(),
  reservation: defaultReservation(),
  pickupTime: new Date().toISOString(),
  paymentMethod: 'cod',
});

const DRAFT_KEY = 'checkout_draft_v2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUntouched(draft: CheckoutDraft): boolean {
  const def = defaultDraft();
  return (
    draft.fulfillmentType === def.fulfillmentType &&
    JSON.stringify(draft.customer) === JSON.stringify(def.customer) &&
    JSON.stringify(draft.shippingAddress) === JSON.stringify(def.shippingAddress) &&
    JSON.stringify(draft.reservation) === JSON.stringify(def.reservation) &&
    draft.pickupTime === def.pickupTime &&
    draft.paymentMethod === def.paymentMethod
  );
}

async function loadDraft(): Promise<CheckoutDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as CheckoutDraft;
    return isUntouched(draft) ? null : draft;
  } catch {
    return null;
  }
}

async function saveDraft(draft: CheckoutDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

// Resolve COD availability from branch + global settings
function resolveCodAvailable(
  branchCod: Branch['codEnabled'] | undefined,
  globalCod: boolean | undefined,
): boolean {
  if (branchCod === 'enabled') return true;
  if (branchCod === 'disabled') return false;
  // 'global' or undefined — fall back to global setting
  return globalCod ?? false;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CheckoutContextValue {
  draft: CheckoutDraft;
  errors: CheckoutErrors;
  isReady: boolean;
  selectedBranch: Branch | null;
  isCodAvailable: boolean;
  shouldShowSyncProfileDetails: boolean;

  // Actions
  setFulfillmentType: (type: FulfillmentType) => void;
  setCustomerField: (field: keyof CheckoutPersonalDetails, value: string) => void;
  setShippingField: (field: keyof CheckoutAddressDetails, value: string) => void;
  setShippingCoordinates: (coords: { lat: number; lng: number }) => void;
  setReservationField: (field: keyof CheckoutReservation, value: string | number) => void;
  setPickupTime: (value: string) => void;
  setPaymentMethod: (method: CheckoutPaymentMethod) => void;
  syncProfileDetails: () => void;
  validateCustomerField: (field: keyof CheckoutPersonalDetails, value: string) => string | null;
  validateShippingField: (field: keyof CheckoutAddressDetails, value: string) => string | null;
  validateReservation: () => boolean;
  validatePickupTime: () => boolean;
  validateAll: (fulfillmentType: FulfillmentType) => { ok: boolean; errors: CheckoutErrors };
  submitOrder: (payload: CreateOrderPayload) => Promise<CreateOrderResponse>;
  clearDraftAndState: () => Promise<void>;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CheckoutProvider({
  children,
  selectedBranch,
}: {
  children: React.ReactNode;
  selectedBranch: Branch | null;
}) {
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: myAddress } = useMyAddress(Boolean(session?.user));

  const [draft, setDraft] = useState<CheckoutDraft>(defaultDraft);
  const [errors, setErrors] = useState<CheckoutErrors>({
    customer: {},
    shipping: {},
    reservation: {},
    pickupTime: null,
  });
  const hasUserEdited = useRef(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ── Load draft from AsyncStorage on mount ─────────────────────────────
  useEffect(() => {
    loadDraft().then((saved) => {
      if (saved) {
        setDraft(saved);
        hasUserEdited.current = true;
      }
      setHasLoaded(true);
    });
  }, []);

  // ── Persist draft changes ─────────────────────────────────────────────
  useEffect(() => {
    if (!hasLoaded) return;
    if (!hasUserEdited.current && isUntouched(draft)) return;
    saveDraft(draft);
  }, [hasLoaded, draft]);

  // ── Profile auto-prefill (only on first load, only if untouched) ────
  useEffect(() => {
    if (!hasLoaded || sessionPending || !session?.user) return;
    if (hasUserEdited.current) return;

    const user = session.user as Record<string, unknown> | undefined;
    if (!user) return;

    const name = typeof user.name === 'string' ? user.name.trim() : '';
    const [firstName = '', ...lastNameParts] = name.split(' ').filter(Boolean);

    setDraft((prev) => ({
      ...prev,
      customer: {
        firstName: (typeof user.firstName === 'string' && user.firstName) || prev.customer.firstName || firstName,
        lastName: (typeof user.lastName === 'string' && user.lastName) || prev.customer.lastName || lastNameParts.join(' '),
        customerEmail: (typeof user.email === 'string' && user.email) || prev.customer.customerEmail,
        customerPhone:
          (typeof user.phone === 'string' && user.phone) ||
          (typeof user.phoneNumber === 'string' && user.phoneNumber) ||
          prev.customer.customerPhone,
        notes: prev.customer.notes,
      },
      shippingAddress: myAddress
        ? {
            ...prev.shippingAddress,
            line1: myAddress.line1 || '',
            line2: myAddress.line2 || '',
            city: myAddress.city || '',
            province: myAddress.province || '',
            zipCode: myAddress.zipCode || '',
            landmark: myAddress.landmark || '',
          }
        : prev.shippingAddress,
    }));
  }, [hasLoaded, sessionPending, session?.user, myAddress]);

  // ── Sync profile button ──────────────────────────────────────────────
  const syncProfileDetails = useCallback(() => {
    if (!session?.user) return;
    hasUserEdited.current = true;

    const user = session.user as Record<string, unknown>;
    const name = typeof user.name === 'string' ? user.name.trim() : '';
    const [firstName = '', ...lastNameParts] = name.split(' ').filter(Boolean);

    setDraft((prev) => ({
      ...prev,
      customer: {
        firstName: (typeof user.firstName === 'string' && user.firstName) || firstName,
        lastName: (typeof user.lastName === 'string' && user.lastName) || lastNameParts.join(' '),
        customerEmail: (typeof user.email === 'string' && user.email) || '',
        customerPhone:
          (typeof user.phone === 'string' && user.phone) ||
          (typeof user.phoneNumber === 'string' && user.phoneNumber) ||
          '',
        notes: prev.customer.notes,
      },
      shippingAddress: myAddress
        ? {
            ...prev.shippingAddress,
            line1: myAddress.line1 || '',
            line2: myAddress.line2 || '',
            city: myAddress.city || '',
            province: myAddress.province || '',
            zipCode: myAddress.zipCode || '',
            landmark: myAddress.landmark || '',
          }
        : prev.shippingAddress,
    }));
  }, [session?.user, myAddress]);

  // ── Should show sync button ──────────────────────────────────────────
  const shouldShowSyncProfileDetails = useMemo(() => {
    if (!session?.user || !hasUserEdited.current) return false;
    if (!myAddress) return false;

    const user = session.user as Record<string, unknown>;
    const profileEmail = (typeof user.email === 'string' && user.email) || '';
    const profilePhone =
      (typeof user.phone === 'string' && user.phone) ||
      (typeof user.phoneNumber === 'string' && user.phoneNumber) ||
      '';

    return (
      draft.customer.customerEmail !== profileEmail ||
      draft.customer.customerPhone !== profilePhone ||
      draft.shippingAddress.line1 !== (myAddress.line1 || '') ||
      draft.shippingAddress.city !== (myAddress.city || '')
    );
  }, [session?.user, myAddress, draft, hasUserEdited.current]);

  // ── Actions ──────────────────────────────────────────────────────────
  const setFulfillmentType = useCallback((type: FulfillmentType) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({ ...prev, fulfillmentType: type }));
  }, []);

  const setCustomerField = useCallback((field: keyof CheckoutPersonalDetails, value: string) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));
    // Clear error on edit
    setErrors((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: undefined },
    }));
  }, []);

  const setShippingField = useCallback((field: keyof CheckoutAddressDetails, value: string) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, [field]: undefined },
    }));
  }, []);

  const setShippingCoordinates = useCallback((coords: { lat: number; lng: number }) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, coordinates: coords },
    }));
  }, []);

  const setReservationField = useCallback((field: keyof CheckoutReservation, value: string | number) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({
      ...prev,
      reservation: { ...prev.reservation, [field]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      reservation: { ...prev.reservation, [field]: undefined },
    }));
  }, []);

  const setPickupTime = useCallback((value: string) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({ ...prev, pickupTime: value }));
    // Validate
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      setErrors((prev) => ({ ...prev, pickupTime: 'Invalid pickup time' }));
    } else {
      setErrors((prev) => ({ ...prev, pickupTime: null }));
    }
  }, []);

  const setPaymentMethod = useCallback((method: CheckoutPaymentMethod) => {
    hasUserEdited.current = true;
    setDraft((prev) => ({ ...prev, paymentMethod: method }));
  }, []);

  // ── Validation ───────────────────────────────────────────────────────
  const validateCustomerField = useCallback((field: keyof CheckoutPersonalDetails, value: string): string | null => {
    let error: string | null = null;

    switch (field) {
      case 'firstName':
        if (!value.trim()) error = 'First name is required';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required';
        break;
      case 'customerEmail':
        if (!value.trim()) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Enter a valid email';
        else if (!isAllowedCustomerDomain(value)) error = 'Email domain is not allowed';
        break;
      case 'customerPhone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\+?[\d\s\-]{7,15}$/.test(value)) error = 'Enter a valid phone number';
        break;
    }

    setErrors((prev) => ({ ...prev, customer: { ...prev.customer, [field]: error ?? undefined } }));
    return error;
  }, []);

  const validateShippingField = useCallback((field: keyof CheckoutAddressDetails, value: string): string | null => {
    let error: string | null = null;

    switch (field) {
      case 'line1':
        if (!value.trim()) error = 'Address line 1 is required';
        break;
      case 'city':
        if (!value.trim()) error = 'City is required';
        break;
      case 'province':
        if (!value.trim()) error = 'Province is required';
        break;
      case 'zipCode':
        if (value && !/^\d{4}$/.test(value)) error = 'ZIP code must be 4 digits';
        break;
    }

    setErrors((prev) => ({ ...prev, shipping: { ...prev.shipping, [field]: error ?? undefined } }));
    return error;
  }, []);

  const validateReservation = useCallback((): boolean => {
    const { scheduledAt, partySize } = draft.reservation;
    const newErrors: Partial<Record<keyof CheckoutReservation, string>> = {};

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      newErrors.scheduledAt = 'Invalid date';
    } else if (date <= new Date()) {
      newErrors.scheduledAt = 'Reservation must be in the future';
    }

    if (partySize < 1) newErrors.partySize = 'At least 1 guest';
    if (partySize > 20) newErrors.partySize = 'Maximum 20 guests';

    setErrors((prev) => ({ ...prev, reservation: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [draft.reservation]);

  const validatePickupTime = useCallback((): boolean => {
    const date = new Date(draft.pickupTime);
    if (isNaN(date.getTime())) {
      setErrors((prev) => ({ ...prev, pickupTime: 'Invalid pickup time' }));
      return false;
    }
    if (date <= new Date()) {
      setErrors((prev) => ({ ...prev, pickupTime: 'Pickup time must be in the future' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, pickupTime: null }));
    return true;
  }, [draft.pickupTime]);

  // ── Validate all fields for the given fulfillment type ─────────────
  // Pure validation — does NOT call setErrors. Use for pre-submit checks.
  const validateAll = useCallback((fulfillmentType: FulfillmentType): { ok: boolean; errors: CheckoutErrors } => {
    const customerErrors: Partial<Record<keyof CheckoutPersonalDetails, string>> = {};
    const shippingErrors: Partial<Record<keyof CheckoutAddressDetails, string>> = {};
    const reservationErrors: Partial<Record<keyof CheckoutReservation, string>> = {};
    let pickupTimeError: string | null = null;

    // Customer validation (always required)
    if (!draft.customer.firstName.trim()) customerErrors.firstName = 'First name is required';
    if (!draft.customer.lastName.trim()) customerErrors.lastName = 'Last name is required';
    if (!draft.customer.customerEmail.trim()) {
      customerErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(draft.customer.customerEmail)) {
      customerErrors.customerEmail = 'Enter a valid email';
    } else if (!isAllowedCustomerDomain(draft.customer.customerEmail)) {
      customerErrors.customerEmail = 'Email domain is not allowed';
    }
    if (!draft.customer.customerPhone.trim()) {
      customerErrors.customerPhone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-]{7,15}$/.test(draft.customer.customerPhone)) {
      customerErrors.customerPhone = 'Enter a valid phone number';
    }

    // Fulfillment-specific validation
    if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY) {
      if (!draft.shippingAddress.line1.trim()) shippingErrors.line1 = 'Street address is required';
      if (!draft.shippingAddress.city.trim()) shippingErrors.city = 'City is required';
      if (!draft.shippingAddress.province.trim()) shippingErrors.province = 'Province is required';
      if (!draft.shippingAddress.coordinates) shippingErrors.line1 = 'Please pin your location on the map';
    }

    if (fulfillmentType === FULFILLMENT_TYPE.DINE_IN) {
      const resDate = new Date(draft.reservation.scheduledAt);
      if (isNaN(resDate.getTime())) {
        reservationErrors.scheduledAt = 'Invalid date';
      } else if (resDate <= new Date()) {
        reservationErrors.scheduledAt = 'Reservation must be in the future';
      }
      if (draft.reservation.partySize < 1) reservationErrors.partySize = 'At least 1 guest';
      if (draft.reservation.partySize > 20) reservationErrors.partySize = 'Maximum 20 guests';
    }

    if (fulfillmentType === FULFILLMENT_TYPE.PICKUP) {
      const pickupDate = new Date(draft.pickupTime);
      if (isNaN(pickupDate.getTime())) {
        pickupTimeError = 'Invalid pickup time';
      } else if (pickupDate <= new Date()) {
        pickupTimeError = 'Pickup time must be in the future';
      }
    }

    const hasErrors =
      Object.keys(customerErrors).length > 0 ||
      Object.keys(shippingErrors).length > 0 ||
      Object.keys(reservationErrors).length > 0 ||
      !!pickupTimeError;

    const newErrors: CheckoutErrors = {
      customer: customerErrors,
      shipping: shippingErrors,
      reservation: reservationErrors,
      pickupTime: pickupTimeError,
    };

    // Also push errors to state so they appear inline on previous screens
    setErrors(newErrors);

    return { ok: !hasErrors, errors: newErrors };
  }, [draft.customer.firstName, draft.customer.lastName, draft.customer.customerEmail, draft.customer.customerPhone, draft.shippingAddress.line1, draft.shippingAddress.city, draft.shippingAddress.province, draft.shippingAddress.coordinates, draft.reservation.scheduledAt, draft.reservation.partySize, draft.pickupTime]);

  // ── Submit order ─────────────────────────────────────────────────────
  const submitOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
      const method = draft.paymentMethod;
      const response = await (method === 'cod'
        ? apiClient.post<CreateOrderResponse, CreateOrderPayload>('/customer/cod-checkout', payload)
        : apiClient.post<CreateOrderResponse, CreateOrderPayload>('/paymaya/checkout', payload));
      return response;
    },
    [draft.paymentMethod]
  );

  const clearDraftAndState = useCallback(async () => {
    await clearDraft();
    setDraft(defaultDraft());
    setErrors({ customer: {}, shipping: {}, reservation: {}, pickupTime: null });
    hasUserEdited.current = false;
    queryClient.setQueryData(['checkout-draft-v2'], {});
  }, [queryClient]);

  // ── COD availability ─────────────────────────────────────────────────
  const isCodAvailable = useMemo(() => {
    return resolveCodAvailable(selectedBranch?.codEnabled, undefined);
  }, [selectedBranch?.codEnabled]);

  // ── Readiness ────────────────────────────────────────────────────────
  const isReady = hasLoaded && !sessionPending;

  const value = useMemo<CheckoutContextValue>(
    () => ({
      draft,
      errors,
      isReady,
      selectedBranch,
      isCodAvailable,
      shouldShowSyncProfileDetails,
      setFulfillmentType,
      setCustomerField,
      setShippingField,
      setShippingCoordinates,
      setReservationField,
      setPickupTime,
      setPaymentMethod,
      syncProfileDetails,
      validateCustomerField,
      validateShippingField,
      validateReservation,
      validatePickupTime,
      validateAll,
      submitOrder,
      clearDraftAndState,
    }),
    [
      draft,
      errors,
      isReady,
      selectedBranch,
      isCodAvailable,
      shouldShowSyncProfileDetails,
      setFulfillmentType,
      setCustomerField,
      setShippingField,
      setShippingCoordinates,
      setReservationField,
      setPickupTime,
      setPaymentMethod,
      syncProfileDetails,
      validateCustomerField,
      validateShippingField,
      validateReservation,
      validatePickupTime,
      validateAll,
      submitOrder,
      clearDraftAndState,
    ]
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}
