import { CheckoutAddressDetails } from '@/hooks/useCheckout';
import { authClient } from '@/lib/auth-client';

export type LoadingAction =
  | 'email'
  | 'google'
  | 'sign-out'
  | 'profile'
  | 'address'
  | 'password'
  | null;

export type EditingSection = 'profile' | 'address' | 'password' | null;
export type AddressField = keyof CheckoutAddressDetails;

export type ProfileUser = {
  email: string;
  name?: string | null;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
};

export type UpdateUserPayload = Parameters<typeof authClient.updateUser>[0] & {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  image: string;
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AddressErrors {
  line1?: string;
  city?: string;
  province?: string;
  country?: string;
}

export const emptyProfileForm: ProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  image: '',
};

export const emptyPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
