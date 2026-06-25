'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchJobsModeration, getToken, moderateJob } from '@/lib/api';

type Job = { id: string; title: string; status: string; sector?: string };

export default function JobsModerationPage() {
  const router = useRouter();
  const [items, setItems] = useState<Job[]>([]);

  const load = () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchJobsModeration(token).then((r) => setItems(r.items ?? []));
  };

  useEffect(load, [router]);

  const close = async (id: string) => {
    const token = getToken();
    if (!token) return;
    await moderateJob(token, id, { status: 'closed', moderation_note: 'Admin closed' });
    load();
  };

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Job moderation</h1>
      <AdminNav />
      <table style={{ width: '100%', background: '#fff', borderRadius: 12 }}>
        <thead>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Sector</th>
            <th style={th}>Status</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {items.map((j) => (
            <tr key={j.id}>
              <td style={td}>{j.title}</td>
              <td style={td}>{j.sector}</td>
              <td style={td}>{j.status}</td>
              <td style={td}>
                {j.status === 'active' && (
                  <button type="button" onClick={() => close(j.id)} style={btn}>
                    Close
                  </button>
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
const btn: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, cursor: 'pointer' };
