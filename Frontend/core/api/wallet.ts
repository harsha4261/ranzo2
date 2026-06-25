import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type Wallet = {
  _id: string;
  balance: number;
  currency: string;
  status: string;
  last_recharge_date: string | null;
};

export async function getWallet(): Promise<Wallet> {
  return apiFetch<Wallet>(apiV1Path('/wallet/'), {
    method: 'GET',
    auth: true,
  });
}

export async function rechargeWallet(amount: number): Promise<{ msg: string; wallet: Wallet }> {
  return apiFetch<{ msg: string; wallet: Wallet }>(apiV1Path(`/wallet/recharge?amount=${amount}`), {
    method: 'POST',
    auth: true,
  });
}
