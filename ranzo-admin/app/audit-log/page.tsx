'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchAuditLog, getToken } from '@/lib/api';

export default function AuditLogPage() {
  const router = useRouter();
  const [items, setItems] = useState<
    { admin_user: string; action: string; resource_type: string; created_at: string }[]
  >([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchAuditLog(token).then((r) => setItems(r.items ?? []));
  }, [router]);

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Audit log</h1>
      <AdminNav />
      <table style={{ width: '100%', background: '#fff', borderRadius: 12 }}>
        <thead>
          <tr>
            <th style={th}>When</th>
            <th style={th}>Admin</th>
            <th style={th}>Action</th>
            <th style={th}>Resource</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e, i) => (
            <tr key={i}>
              <td style={td}>{new Date(e.created_at).toLocaleString()}</td>
              <td style={td}>{e.admin_user}</td>
              <td style={td}>{e.action}</td>
              <td style={td}>{e.resource_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: 12, fontSize: 13 };
const td: React.CSSProperties = { padding: 12, borderTop: '1px solid #eee' };
