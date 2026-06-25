'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchDisputes, getToken, resolveDispute } from '@/lib/api';

type Dispute = {
  id: string;
  app: string;
  ref_type: string;
  ref_id: string;
  reason: string;
  status: string;
};

export default function DisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Dispute[]>([]);

  const load = () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchDisputes(token).then((r) => setItems(r.items ?? []));
  };

  useEffect(load, [router]);

  const resolve = async (id: string, status: 'resolved' | 'rejected') => {
    const token = getToken();
    if (!token) return;
    await resolveDispute(token, id, { status, resolution_notes: 'Admin resolution' });
    load();
  };

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Disputes</h1>
      <AdminNav />
      <table style={{ width: '100%', background: '#fff', borderRadius: 12 }}>
        <thead>
          <tr>
            <th style={th}>App</th>
            <th style={th}>Ref</th>
            <th style={th}>Reason</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td style={td}>{d.app}</td>
              <td style={td}>
                {d.ref_type}:{d.ref_id.slice(0, 8)}
              </td>
              <td style={td}>{d.reason.slice(0, 60)}</td>
              <td style={td}>{d.status}</td>
              <td style={td}>
                {d.status === 'open' && (
                  <>
                    <button type="button" onClick={() => resolve(d.id, 'resolved')} style={btn}>
                      Resolve
                    </button>{' '}
                    <button type="button" onClick={() => resolve(d.id, 'rejected')} style={btn}>
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: 12, fontSize: 13 };
const td: React.CSSProperties = { padding: 12, borderTop: '1px solid #eee' };
const btn: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #ccc',
  cursor: 'pointer',
  background: '#fff',
};
