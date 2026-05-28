import { CheckoutAddressDetails } from '@/hooks/useCheckout';
import { ProfileUser } from './types';

export function getDisplayName(user: ProfileUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || 'My Account';
}

export function getInitial(user: ProfileUser) {
  return getDisplayName(user).charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();
}

export function formatAddress(address: CheckoutAddressDetails) {
  const main = [address.line1, address.line2, address.city, address.province]
    .filter(Boolean)
    .join(', ');
  const postal = [address.zipCode, address.country].filter(Boolean).join(' ');
  const landmark = address.landmark ? `Landmark: ${address.landmark}` : '';

  return [main, postal, landmark].filter(Boolean).join('\n') || 'No address saved yet.';
}
