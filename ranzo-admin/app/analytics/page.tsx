'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchAnalytics, getToken } from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchAnalytics(token).then(setData).catch(() => router.replace('/'));
  }, [router]);

  const beta = (data?.beta_progress ?? {}) as Record<
    string,
    { current: number; target: number; percent: number }
  >;

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Analytics & beta progress</h1>
      <AdminNav />
      {data && (
        <>
          <pre
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 12,
              overflow: 'auto',
              fontSize: 13,
            }}
          >
            {JSON.stringify(
              { job_portal: data.job_portal, home_services: data.home_services },
              null,
              2
            )}
          </pre>
          <h2>Beta targets (Hyderabad)</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(beta).map(([key, v]) => (
              <div key={key} style={barWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{key}</span>
                  <span>
                    {v.current} / {v.target} ({v.percent}%)
                  </span>
                </div>
                <div style={barBg}>
                  <div style={{ ...barFill, width: `${v.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

const barWrap: React.CSSProperties = { marginBottom: 8 };
const barBg: React.CSSProperties = {
  height: 8,
  background: '#ECE6F0',
  borderRadius: 4,
  marginTop: 6,
};
const barFill: React.CSSProperties = {
  height: 8,
  background: '#6B2C8C',
  borderRadius: 4,
};
