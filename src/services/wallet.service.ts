import { apiClient } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionStatus = 'completed' | 'pending' | 'failed' | 'reversed';
export type WalletCreditSource =
  | 'refund'
  | 'promo'
  | 'admin_credit'
  | 'cashback'
  | 'manual'
  | 'maya_topup';

export interface WalletTransaction {
  _id: string;
  customerId: string;
  performedBy: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: WalletCreditSource;
  sourceId?: string;
  description?: string;
  status: WalletTransactionStatus;
  orderId?: string;
  prevTxHash?: string | null;
  txHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  balance: number;
  recentTransactions: WalletTransaction[];
  integrity: {
    valid: boolean;
    discrepancy: number;
    chainBroken: boolean;
  };
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface WalletTopupInitResponse {
  checkoutId: string;
  redirectUrl: string;
  referenceNumber: string;
  amount: number;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /api/customer/wallet — balance + recent 10 transactions
 */
export async function getWallet(): Promise<WalletResponse> {
  return apiClient.get<WalletResponse>('/customer/wallet');
}

/**
 * GET /api/customer/wallet/transactions — paginated transaction history
 */
export async function getWalletTransactions(params: {
  page?: number;
  limit?: number;
}): Promise<WalletTransactionsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<WalletTransactionsResponse>(`/customer/wallet/transactions${query}`);
}

/**
 * POST /api/customer/wallet/topup/init — initiate Maya topup
 */
export async function initiateWalletTopup(amount: number): Promise<WalletTopupInitResponse> {
  return apiClient.post<WalletTopupInitResponse, { amount: number }>(
    '/customer/wallet/topup/init',
    { amount },
  );
}
