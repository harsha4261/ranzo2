'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { Booking, fetchServiceBookings, getToken } from '@/lib/api';

export default function ServiceBookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchServiceBookings(token, { status: status || undefined });
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load service bookings');
    } finally {
      setLoading(false);
    }
  }, [router, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Service bookings</h1>
      <AdminNav />
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="">All statuses</option>
        <option value="CREATED">CREATED</option>
        <option value="ACCEPTED">ACCEPTED</option>
        <option value="IN_TRANSIT">IN_TRANSIT</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}
      {!loading && !error && (
        <p style={{ color: '#7A7E96', fontSize: 13, marginTop: -8 }}>{total} total</p>
      )}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Category</th>
            <th style={th}>Customer</th>
            <th style={th}>Technician</th>
            <th style={th}>Status</th>
            <th style={th}>Urgency</th>
            <th style={th}>City</th>
            <th style={th}>Booked</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id}>
              <td style={td}>{b.category}</td>
              <td style={td}>{b.customer_id.slice(0, 10)}</td>
              <td style={td}>{b.technician_id ? b.technician_id.slice(0, 10) : '—'}</td>
              <td style={td}>{b.status}</td>
              <td style={td}>{b.urgency_level}</td>
              <td style={td}>{b.address_details?.city ?? '—'}</td>
              <td style={td}>
                {b.timeline?.booked_at ? new Date(b.timeline.booked_at).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={7} style={td}>
                No service bookings.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  borderBottom: '1px solid #ECE6F0',
  fontSize: 13,
  color: '#7A7E96',
};
const td: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #F5F0F8' };
