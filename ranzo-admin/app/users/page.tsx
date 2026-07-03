'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { AdminUser, fetchUsers, getToken, suspendUser } from '@/lib/api';

export default function UsersPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [app, setApp] = useState('home-services');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [suspendedOnly, setSuspendedOnly] = useState(false);
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
      const r = await fetchUsers(token, app, {
        q: q || undefined,
        role: role || undefined,
        suspended: suspendedOnly ? true : undefined,
      });
      setItems(r.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [router, app, q, role, suspendedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSuspend = async (u: AdminUser) => {
    const token = getToken();
    if (!token) return;
    const next = !u.is_suspended;
    const reason = next ? prompt('Suspend reason (optional)') ?? undefined : undefined;
    try {
      await suspendUser(token, u.id, { suspended: next, reason }, app);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update user');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Users</h1>
      <AdminNav />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <select value={app} onChange={(e) => setApp(e.target.value)}>
          <option value="home-services">Home Services</option>
          <option value="job-portal">Job Portal</option>
        </select>
        <input
          placeholder="Search name / phone / id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={input}
        />
        <input placeholder="Role filter" value={role} onChange={(e) => setRole(e.target.value)} style={input} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={suspendedOnly}
            onChange={(e) => setSuspendedOnly(e.target.checked)}
          />
          Suspended only
        </label>
        <button type="button" onClick={load} style={btn}>
          Search
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Phone</th>
            <th style={th}>Role</th>
            <th style={th}>Status</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td style={td}>{u.name ?? '—'}</td>
              <td style={td}>{u.phone_number}</td>
              <td style={td}>{u.role}</td>
              <td style={td}>{u.is_suspended ? 'Suspended' : 'Active'}</td>
              <td style={td}>
                <button type="button" onClick={() => toggleSuspend(u)} style={btn}>
                  {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                </button>
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={5} style={td}>
                No users found.
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
const btn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#6B2C8C',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};
const input: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #ECE6F0',
};
