export type ScheduleInfo = {
  days: string[];
  startTime: string;
  endTime: string;
};

export type DiscountEvent = {
  label: string;
  description: string;
  channel: 'online' | 'dinein' | 'both';
  benefitType: 'percentage' | 'fixed' | 'free_item';
  value: number;
  minimumPurchase: number;
  days: string[];
  schedule?: ScheduleInfo;
  enabled: boolean;
  oneTime: boolean;
  freeItemProducts?: { productId: string; name: string; label: string }[];
};

export type MembershipTier = {
  _id: string;
  name: string;
  slug: string;
  enabled: boolean;
  purchasePrice: number;
  sku: string;
  channel: 'online' | 'dinein' | 'both';
  tierSchedule?: ScheduleInfo;
  validityRule: {
    duration: number;
    unit: 'day' | 'month' | 'year';
    expiresAt: string | null;
  };
  baseDiscount: {
    enabled: boolean;
    type: 'percentage' | 'fixed';
    value: number;
    minimumPurchase: number;
    oneTime: boolean;
    schedule?: ScheduleInfo;
  };
  discountEvents: DiscountEvent[];
  sortOrder: number;
};

export type AvailableBenefit = {
  type: 'base_discount' | 'event';
  label: string;
  benefitType: 'percentage' | 'fixed';
  value: number;
  minimumPurchase: number;
  claimedToday: boolean;
  oneTime: boolean;
  claimedForever: boolean;
};

export type ActiveMembership = {
  memberId?: string | null;
  customerCode?: string | null;
  referenceNumber: string;
  status: string;
  firstName?: string;
  lastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  purchasePrice: number;
  discountRate: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  tierChannel: 'online' | 'dinein' | 'both';
  createdAt: string;
  paidAt?: string;
  expiresAt?: string;
  tierId?: string;
  availableBenefits?: AvailableBenefit[];
};

export type UsageHistoryItem = {
  id: string;
  referenceNumber?: string;
  status: string;
  createdAt: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: { name: string; quantity: number; price: number; image?: string }[];
};

export type RedemptionHistoryItem = {
  id: string;
  branchName: string | null;
  channel: string;
  billAmount: number;
  discountAmount: number;
  finalAmount: number;
  redeemedBenefits: {
    type: string;
    label: string;
    benefitType: string;
    value: number;
  }[];
  createdAt: string;
};

export type MembershipStatusResponse = {
  tiers: MembershipTier[];
  activeMembership: ActiveMembership | null;
  usageHistory: UsageHistoryItem[];
  redemptionHistory: RedemptionHistoryItem[];
};

export type MembershipCheckoutResponse = {
  referenceNumber?: string;
  checkoutId?: string;
  redirectUrl?: string;
  requiresBirthday?: boolean;
  error?: string;
};
