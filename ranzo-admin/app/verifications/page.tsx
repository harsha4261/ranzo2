'use client';

import { AdminNav } from '@/components/AdminNav';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type Verification = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  created_at: string;
};

export default function VerificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Verification[]>([]);
  const [app, setApp] = useState('home-services');

  useEffect(() => {
    const token = sessionStorage.getItem('ranzo_admin_token');
    if (!token) {
      router.replace('/');
      return;
    }
    fetch(`${API}/admin/verifications?app=${app}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setItems(data.verifications ?? []))
      .catch(() => router.replace('/'));
  }, [router, app]);

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 16px' }}>Verification queue</h1>
      <AdminNav />
      <select value={app} onChange={(e) => setApp(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="home-services">Home Services</option>
        <option value="job-portal">Job Portal</option>
      </select>
      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Type</th>
            <th style={th}>User</th>
            <th style={th}>Status</th>
            <th style={th}>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id}>
              <td style={td}>{v.type}</td>
              <td style={td}>{v.user_id}</td>
              <td style={td}>{v.status}</td>
              <td style={td}>{new Date(v.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={4} style={td}>
                No verification records yet.
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
