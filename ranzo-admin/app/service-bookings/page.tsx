'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchServiceBookings, getToken } from '@/lib/api';

type Booking = {
  id: string;
  requester_name?: string;
  provider_name?: string;
  skill_label?: string;
  status?: string;
  payment_status?: string;
  budget?: number;
  quoted_price?: number;
  area?: string;
  created_at?: string;
};

export default function ServiceBookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchServiceBookings(token, status || undefined)
      .then((r) => setItems(r.items ?? []))
      .catch(() => router.replace('/'));
  }, [router, status]);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Service bookings</h1>
      <AdminNav />
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="">All statuses</option>
        <option value="matching">matching</option>
        <option value="accepted">accepted</option>
        <option value="in_progress">in_progress</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </select>
      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Skill</th>
            <th style={th}>Requester</th>
            <th style={th}>Provider</th>
            <th style={th}>Status</th>
            <th style={th}>Payment</th>
            <th style={th}>Area</th>
            <th style={th}>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id}>
              <td style={td}>{b.skill_label ?? '—'}</td>
              <td style={td}>{b.requester_name ?? b.id.slice(0, 8)}</td>
              <td style={td}>{b.provider_name ?? '—'}</td>
              <td style={td}>{b.status}</td>
              <td style={td}>{b.payment_status ?? '—'}</td>
              <td style={td}>{b.area ?? '—'}</td>
              <td style={td}>{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
            </tr>
          ))}
          {!items.length && (
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
