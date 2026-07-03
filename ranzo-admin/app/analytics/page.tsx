'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { Analytics, fetchAnalytics, getToken } from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
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
      setData(await fetchAnalytics(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Analytics</h1>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      {data && (
        <>
          <section style={grid}>
            <StatCard label="Users" value={data.total_users} />
            <StatCard label="Technicians" value={data.total_technicians} />
            <StatCard label="Technicians online" value={data.technicians_online} />
            <StatCard label="Bookings" value={data.total_bookings} />
            <StatCard label="Revenue" value={`₹${data.total_revenue.toLocaleString('en-IN')}`} />
            <StatCard label="Jobs" value={data.total_jobs} />
            <StatCard label="Job applications" value={data.total_applications} />
          </section>

          <h2 style={{ marginTop: 32 }}>Bookings by status</h2>
          <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Status</th>
                <th style={th}>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.bookings_by_status).map(([status, count]) => (
                <tr key={status}>
                  <td style={td}>{status}</td>
                  <td style={td}>{count}</td>
                </tr>
              ))}
              {!Object.keys(data.bookings_by_status).length && (
                <tr>
                  <td colSpan={2} style={td}>
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 13, color: '#7A7E96' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#6B2C8C' }}>{value}</div>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16,
  marginBottom: 16,
};

const card: React.CSSProperties = {
  background: '#fff',
  padding: 16,
  borderRadius: 12,
  boxShadow: '0 4px 16px rgba(107,44,140,0.08)',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  borderBottom: '1px solid #ECE6F0',
  fontSize: 13,
  color: '#7A7E96',
};
const td: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #F5F0F8' };
