'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { fetchDashboard, fetchUsers, getToken, AdminUser } from '@/lib/api';

type Dash = {
  job_portal: Record<string, number>;
  home_services: Record<string, number>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [dash, setDash] = useState<Dash | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [app, setApp] = useState('home-services');
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
      const [d, u] = await Promise.all([fetchDashboard(token), fetchUsers(token, app)]);
      setDash(d);
      setUsers(u.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [router, app]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#6B2C8C', margin: 0 }}>Dashboard</h1>
        <select value={app} onChange={(e) => setApp(e.target.value)}>
          <option value="home-services">Home Services</option>
          <option value="job-portal">Job Portal</option>
        </select>
      </header>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      {dash && (
        <section style={grid}>
          <StatCard title="Job portal" data={dash.job_portal} />
          <StatCard title="Home services" data={dash.home_services} />
        </section>
      )}

      <h2 style={{ marginTop: 32 }}>Recent users</h2>
      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Phone</th>
            <th style={th}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={td}>{u.name ?? '—'}</td>
              <td style={td}>{u.phone_number}</td>
              <td style={td}>{u.role}</td>
            </tr>
          ))}
          {!loading && !users.length && (
            <tr>
              <td colSpan={3} style={td}>
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

function StatCard({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 12px', color: '#6B2C8C' }}>{title}</h3>
      {Object.entries(data).map(([k, v]) => (
        <p key={k} style={{ margin: '6px 0', color: '#2A2D45' }}>
          {k.replace(/_/g, ' ')}: <strong>{v}</strong>
        </p>
      ))}
    </div>
  );
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
};

const card: React.CSSProperties = {
  background: '#fff',
  padding: 20,
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
