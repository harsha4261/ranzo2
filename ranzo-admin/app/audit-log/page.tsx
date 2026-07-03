'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { AuditLogEntry, fetchAuditLog, getToken } from '@/lib/api';

export default function AuditLogPage() {
  const router = useRouter();
  const [items, setItems] = useState<AuditLogEntry[]>([]);
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
      const r = await fetchAuditLog(token, { skip, limit });
      setItems(r.items ?? []);
      setTotal(r.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [router, skip]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Audit log</h1>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>When</th>
            <th style={th}>Admin</th>
            <th style={th}>Action</th>
            <th style={th}>Target</th>
            <th style={th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e._id}>
              <td style={td}>{new Date(e.created_at).toLocaleString()}</td>
              <td style={td}>{e.admin_id.slice(0, 12)}</td>
              <td style={td}>{e.action}</td>
              <td style={td}>{e.target.slice(0, 16)}</td>
              <td style={{ ...td, fontSize: 11 }}>
                {e.details && Object.keys(e.details).length ? JSON.stringify(e.details) : '—'}
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={5} style={td}>
                No audit entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          disabled={skip === 0 || loading}
          onClick={() => setSkip(Math.max(0, skip - limit))}
          style={btn}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={skip + limit >= total || loading}
          onClick={() => setSkip(skip + limit)}
          style={btn}
        >
          Next
        </button>
      </div>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: 12, fontSize: 13 };
const td: React.CSSProperties = { padding: 12, borderTop: '1px solid #eee' };
const btn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #ECE6F0',
  background: '#fff',
  color: '#6B2C8C',
  cursor: 'pointer',
};
