// Wallet balance source — where money comes from
export const WALLET_CREDIT_SOURCES = [
  "refund",
  "promo",
  "admin_credit",
  "cashback",
  "manual",
  "maya_topup",
] as const;

export type WalletCreditSource = (typeof WALLET_CREDIT_SOURCES)[number];

// Transaction type — credit (add) or debit (spend)
export const WALLET_TRANSACTION_TYPES = ["credit", "debit"] as const;
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

// Transaction status
export const WALLET_TRANSACTION_STATUSES = [
  "completed",
  "pending",
  "failed",
  "reversed",
] as const;
export type WalletTransactionStatus =
  (typeof WALLET_TRANSACTION_STATUSES)[number];

export interface WalletCreditPayload {
  amount: number;
  source: WalletCreditSource;
  sourceId?: string; // Reference to order, campaign, etc.
  description?: string;
}

export const WALLET_TOPUP_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired",
  "cancelled",
  "credited",
] as const;

export type WalletTopupStatus = (typeof WALLET_TOPUP_STATUSES)[number];
