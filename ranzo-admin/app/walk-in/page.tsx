'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchWalkInDrives, getToken } from '@/lib/api';

type Drive = {
  id: string;
  job_title?: string;
  employer_name?: string;
  venue_name?: string;
  address?: string;
  drive_date?: string;
  total_capacity?: number;
  total_booked?: number;
  total_attended?: number;
  booking_count?: number;
  status?: string;
  created_at?: string;
};

export default function WalkInPage() {
  const router = useRouter();
  const [items, setItems] = useState<Drive[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchWalkInDrives(token, status || undefined)
      .then((r) => setItems(r.items ?? []))
      .catch(() => router.replace('/'));
  }, [router, status]);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Walk-in drives</h1>
      <AdminNav />
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="">All statuses</option>
        <option value="scheduled">scheduled</option>
        <option value="active">active</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </select>
      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Job</th>
            <th style={th}>Employer</th>
            <th style={th}>Venue</th>
            <th style={th}>Date</th>
            <th style={th}>Capacity</th>
            <th style={th}>Booked</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td style={td}>{d.job_title ?? d.id.slice(0, 8)}</td>
              <td style={td}>{d.employer_name ?? '—'}</td>
              <td style={td}>{d.venue_name ?? d.address ?? '—'}</td>
              <td style={td}>{d.drive_date ? new Date(d.drive_date).toLocaleDateString() : '—'}</td>
              <td style={td}>
                {d.total_booked ?? 0}/{d.total_capacity ?? 0}
              </td>
              <td style={td}>{d.booking_count ?? 0}</td>
              <td style={td}>{d.status}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={7} style={td}>
                No walk-in drives.
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
