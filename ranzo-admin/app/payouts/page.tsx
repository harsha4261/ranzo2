'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchPayouts, getToken } from '@/lib/api';

export default function PayoutsPage() {
  const router = useRouter();
  const [items, setItems] = useState<
    { id: string; user_id: string; amount_paise: number; status: string; created_at: string }[]
  >([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchPayouts(token).then((r) => setItems(r.items ?? []));
  }, [router]);

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Technician payouts</h1>
      <AdminNav />
      <table style={{ width: '100%', background: '#fff', borderRadius: 12 }}>
        <thead>
          <tr>
            <th style={th}>User</th>
            <th style={th}>Amount</th>
            <th style={th}>Status</th>
            <th style={th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td style={td}>{p.user_id.slice(0, 12)}</td>
              <td style={td}>₹{(p.amount_paise / 100).toFixed(0)}</td>
              <td style={td}>{p.status}</td>
              <td style={td}>{new Date(p.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={4} style={td}>
                No payout requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: 12, fontSize: 13 };
const td: React.CSSProperties = { padding: 12, borderTop: '1px solid #eee' };
