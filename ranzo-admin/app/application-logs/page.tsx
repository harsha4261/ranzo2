'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { fetchApplicationLogs, getToken, type ApplicationLogEntry } from '@/lib/api';

export default function ApplicationLogsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const limit = 50;

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApplicationLogs(token, { limit, skip });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load application logs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router, skip]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', marginBottom: 4 }}>Job application activity</h1>
      <p style={{ color: '#7A7E96', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Applications submitted through the job portal.
      </p>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div style={{ marginBottom: 12, fontSize: 13, color: '#7A7E96' }}>
        {loading ? 'Loading…' : `${total} matching · showing ${items.length}`}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F0F8' }}>
              <th style={th}>When</th>
              <th style={th}>Job</th>
              <th style={th}>Seeker</th>
              <th style={th}>Employer</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td style={td}>{formatTime(e.created_at)}</td>
                <td style={td}>{e.job_title ?? e.job_id.slice(0, 10)}</td>
                <td style={td}>{e.seeker_name ?? e.seeker_id.slice(0, 10)}</td>
                <td style={td}>{e.employer_id.slice(0, 10)}</td>
                <td style={td}>{e.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#7A7E96' }}>No job applications yet.</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          disabled={skip === 0 || loading}
          onClick={() => setSkip(Math.max(0, skip - limit))}
          style={btnSecondary}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={skip + limit >= total || loading}
          onClick={() => setSkip(skip + limit)}
          style={btnSecondary}
        >
          Next
        </button>
        <button type="button" onClick={load} disabled={loading} style={btnPrimary}>
          Refresh
        </button>
      </div>
    </main>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#2A2D45',
};
const td: React.CSSProperties = {
  padding: '10px 12px',
  borderTop: '1px solid #eee',
  verticalAlign: 'top',
  fontSize: 13,
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#6B2C8C',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #ECE6F0',
  background: '#fff',
  color: '#6B2C8C',
  fontWeight: 600,
  cursor: 'pointer',
};
