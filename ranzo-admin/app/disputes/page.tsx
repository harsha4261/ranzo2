'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { Dispute, fetchDisputes, getToken, resolveDispute } from '@/lib/api';

export default function DisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchDisputes(token);
      setItems(r.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (d: Dispute, action: 'RESOLVE' | 'REFUND_TECH_FEE') => {
    const token = getToken();
    if (!token) return;
    const note = prompt('Note (optional)') ?? undefined;
    setActing(d.booking_id);
    try {
      await resolveDispute(token, d.booking_id, { action, note });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to resolve dispute');
    } finally {
      setActing(null);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Disputes</h1>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Booking</th>
            <th style={th}>Customer</th>
            <th style={th}>Technician</th>
            <th style={th}>Reason</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td style={td}>{d.booking_id.slice(0, 10)}</td>
              <td style={td}>{d.customer_id.slice(0, 10)}</td>
              <td style={td}>{d.technician_id.slice(0, 10)}</td>
              <td style={td}>{d.dispute_reason ? d.dispute_reason.slice(0, 60) : '—'}</td>
              <td style={td}>{d.dispute_status}</td>
              <td style={td}>
                {d.dispute_status === 'OPEN' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => act(d, 'RESOLVE')}
                      disabled={acting === d.booking_id}
                      style={btn}
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => act(d, 'REFUND_TECH_FEE')}
                      disabled={acting === d.booking_id}
                      style={btn}
                    >
                      Refund technician&apos;s fee
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={6} style={td}>
                No open disputes.
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
const btn: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #ccc',
  cursor: 'pointer',
  background: '#fff',
};
