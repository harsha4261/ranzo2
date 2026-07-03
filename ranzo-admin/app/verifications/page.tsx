'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import {
  VerificationTechnician,
  approveTechnician,
  rejectTechnician,
  fetchVerifications,
  getToken,
} from '@/lib/api';

export default function VerificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<VerificationTechnician[]>([]);
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
      const r = await fetchVerifications(token);
      setItems(r.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await approveTechnician(token, userId);
      setItems((prev) => prev.filter((t) => t.user_id !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to approve');
    }
  };

  const reject = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await rejectTechnician(token, userId);
      setItems((prev) => prev.filter((t) => t.user_id !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to reject');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 4px' }}>KYC verification queue</h1>
      <p style={{ color: '#7A7E96', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Technicians who submitted an Aadhaar number but aren&apos;t approved yet.
      </p>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Name (Aadhaar)</th>
            <th style={th}>Aadhaar #</th>
            <th style={th}>Location</th>
            <th style={th}>Profile complete</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id}>
              <td style={td}>{v.name_as_per_adhar ?? '—'}</td>
              <td style={td}>{v.adhar_number ?? '—'}</td>
              <td style={td}>{v.location ?? v.village_city ?? '—'}</td>
              <td style={td}>{v.is_completed ? 'Yes' : 'No'}</td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => approve(v.user_id)} style={btnApprove}>
                    Approve
                  </button>
                  <button type="button" onClick={() => reject(v.user_id)} style={btnReject}>
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={5} style={td}>
                No pending verifications.
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
const btnApprove: React.CSSProperties = {
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 'bold',
  backgroundColor: '#4CAF50',
  color: '#fff',
};
const btnReject: React.CSSProperties = {
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 'bold',
  backgroundColor: '#f44336',
  color: '#fff',
};
