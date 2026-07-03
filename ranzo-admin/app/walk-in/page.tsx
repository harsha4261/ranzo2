'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { WalkInDrive, fetchWalkInDrives, getToken } from '@/lib/api';

export default function WalkInPage() {
  const router = useRouter();
  const [items, setItems] = useState<WalkInDrive[]>([]);
  const [total, setTotal] = useState(0);
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
      const r = await fetchWalkInDrives(token);
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load walk-in drives');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Walk-in drives</h1>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}
      {!loading && !error && (
        <p style={{ color: '#7A7E96', fontSize: 13, marginTop: -8, marginBottom: 12 }}>{total} total</p>
      )}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Job</th>
            <th style={th}>Employer</th>
            <th style={th}>Address</th>
            <th style={th}>Date</th>
            <th style={th}>Slots</th>
            <th style={th}>Capacity/slot</th>
            <th style={th}>Checked in</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td style={td}>{d.job_id.slice(0, 10)}</td>
              <td style={td}>{d.employer_id.slice(0, 10)}</td>
              <td style={td}>{d.address}</td>
              <td style={td}>{d.drive_date ? new Date(d.drive_date).toLocaleDateString() : '—'}</td>
              <td style={td}>{d.time_slots?.join(', ') || '—'}</td>
              <td style={td}>{d.capacity_per_slot}</td>
              <td style={td}>{d.checked_in_count ?? 0}</td>
            </tr>
          ))}
          {!loading && !items.length && (
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
