import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type Wallet = {
  _id: string;
  balance: number;
  currency: string;
  status: string;
  last_recharge_date: string | null;
};

export type WalletTransaction = {
  _id: string;
  technician_id: string;
  type: 'DEBIT' | 'CREDIT' | 'REFUND';
  amount: number;
  running_balance: number;
  description: string;
  related_booking_id: string | null;
  idempotency_key: string;
  created_at: string;
};

export type RechargeOrder = {
  order_id: string;
  amount_paise: number;
  currency: string;
  razorpay_key_id: string;
};

export type RechargeVerifyPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RechargeVerifyResponse = {
  msg: string;
  wallet: Wallet;
};

export async function getWallet(): Promise<Wallet> {
  return apiFetch<Wallet>(apiV1Path('/wallet/'), {
    method: 'GET',
    auth: true,
  });
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  return apiFetch<WalletTransaction[]>(apiV1Path('/wallet/transactions'), {
    method: 'GET',
    auth: true,
  });
}

/**
 * Step 1 of a real recharge: ask the backend to create a Razorpay order.
 * Nothing is credited yet. Throws an ApiError with status 503 if the
 * payment gateway isn't configured on the backend yet — callers should
 * catch that specifically and show a "not available yet" message instead
 * of attempting to open Razorpay Checkout.
 */
export async function createRechargeOrder(amount: number): Promise<RechargeOrder> {
  return apiFetch<RechargeOrder>(apiV1Path('/wallet/recharge/order'), {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ amount }),
  });
}

/**
 * Step 2: hand the Razorpay Checkout success callback's fields back to the
 * backend so it can verify the signature server-side and credit the wallet.
 */
export async function verifyRecharge(payload: RechargeVerifyPayload): Promise<RechargeVerifyResponse> {
  return apiFetch<RechargeVerifyResponse>(apiV1Path('/wallet/recharge/verify'), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}
