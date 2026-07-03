'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { AdminTechnician, fetchTechnicians, getToken, approveTechnician, rejectTechnician } from '@/lib/api';

export default function TechniciansPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminTechnician[]>([]);
  const [onlineStatus, setOnlineStatus] = useState('');
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
      const r = await fetchTechnicians(token);
      setItems(r.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // The backend returns every technician; filter online status client-side.
  const filtered = useMemo(
    () => (onlineStatus ? items.filter((t) => t.online_status === onlineStatus) : items),
    [items, onlineStatus]
  );

  const handleApprove = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await approveTechnician(token, userId);
      setItems((prev) =>
        prev.map((t) => (t.user_id === userId ? { ...t, verified: true } : t))
      );
    } catch (err) {
      alert('Failed to approve: ' + (err instanceof Error ? err.message : 'unknown error'));
    }
  };

  const handleReject = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await rejectTechnician(token, userId);
      setItems((prev) => prev.filter((t) => t.user_id !== userId));
    } catch (err) {
      alert('Failed to reject: ' + (err instanceof Error ? err.message : 'unknown error'));
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Technicians</h1>
      <AdminNav />
      <select
        value={onlineStatus}
        onChange={(e) => setOnlineStatus(e.target.value)}
        style={{ marginBottom: 16 }}
      >
        <option value="">All</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
      </select>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Phone</th>
            <th style={th}>Business</th>
            <th style={th}>Online</th>
            <th style={th}>Verified</th>
            <th style={th}>Aadhaar</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => (
            <tr key={t.user_id}>
              <td style={td}>{t.name ?? t.business_name ?? '—'}</td>
              <td style={td}>{t.phone_number ?? '—'}</td>
              <td style={td}>{t.business_name ?? '—'}</td>
              <td style={td}>{t.online_status ?? 'offline'}</td>
              <td style={td}>
                {t.verified ? (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>Yes</span>
                ) : (
                  <span style={{ color: 'orange', fontWeight: 'bold' }}>Pending</span>
                )}
              </td>
              <td style={td}>{t.aadhaar_verified ? 'Yes' : 'No'}</td>
              <td style={td}>
                {!t.verified && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleApprove(t.user_id)}
                      style={{ ...btnStyle, backgroundColor: '#4CAF50', color: 'white' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(t.user_id)}
                      style={{ ...btnStyle, backgroundColor: '#f44336', color: 'white' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {!loading && !filtered.length && (
            <tr>
              <td colSpan={7} style={td}>
                No technicians registered.
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
const btnStyle: React.CSSProperties = {
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 'bold',
};
