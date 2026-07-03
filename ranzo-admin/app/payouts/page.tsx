'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { WalletOverviewItem, adjustWallet, fetchPayouts, getToken } from '@/lib/api';

export default function PayoutsPage() {
  const router = useRouter();
  const [items, setItems] = useState<WalletOverviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchPayouts(token);
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const adjust = async (technicianId: string) => {
    const token = getToken();
    if (!token) return;
    const amountStr = prompt('Amount to credit (use a negative number to debit), in ₹:');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (Number.isNaN(amount)) {
      alert('Enter a valid number');
      return;
    }
    const reason = prompt('Reason for this adjustment:');
    if (!reason) return;
    setAdjusting(technicianId);
    try {
      await adjustWallet(token, technicianId, { amount, reason });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to adjust wallet');
    } finally {
      setAdjusting(null);
    }
  };

  const adjustNewTechnician = async () => {
    const technicianId = prompt('Technician (user) ID:');
    if (!technicianId) return;
    await adjust(technicianId);
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#6B2C8C', margin: 0 }}>Technician wallets</h1>
        <button type="button" onClick={adjustNewTechnician} style={btnPrimary}>
          Adjust wallet…
        </button>
      </header>
      <p style={{ color: '#7A7E96', marginTop: 4, marginBottom: 16, fontSize: 14 }}>
        Technicians pay a lead fee out of this wallet — there is no payout-approval workflow.
        Use &quot;Adjust wallet&quot; to manually credit or debit a balance while Razorpay isn&apos;t live.
      </p>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}
      {!loading && !error && (
        <p style={{ color: '#7A7E96', fontSize: 13, marginBottom: 12 }}>{total} total</p>
      )}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Technician</th>
            <th style={th}>Balance</th>
            <th style={th}>Status</th>
            <th style={th}>Last recharge</th>
            <th style={th}>Last transaction</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.technician_id}>
              <td style={td}>{p.technician_id.slice(0, 12)}</td>
              <td style={td}>₹{p.balance}</td>
              <td style={td}>{p.status ?? '—'}</td>
              <td style={td}>
                {p.last_recharge_date ? new Date(p.last_recharge_date).toLocaleDateString() : '—'}
              </td>
              <td style={td}>
                {p.last_transaction
                  ? `${p.last_transaction.type} ₹${p.last_transaction.amount} — ${new Date(
                      p.last_transaction.created_at
                    ).toLocaleDateString()}`
                  : '—'}
              </td>
              <td style={td}>
                <button
                  type="button"
                  onClick={() => adjust(p.technician_id)}
                  disabled={adjusting === p.technician_id}
                  style={btnSecondary}
                >
                  Adjust
                </button>
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={6} style={td}>
                No technician wallets yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: 12, fontSize: 13 };
const td: React.CSSProperties = { padding: 12, borderTop: '1px solid #eee' };
const btnPrimary: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#6B2C8C',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid #ccc',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};
