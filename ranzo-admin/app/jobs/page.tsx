'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { ModerationJob, fetchJobsModeration, getToken, moderateJob } from '@/lib/api';

export default function JobsModerationPage() {
  const router = useRouter();
  const [items, setItems] = useState<ModerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchJobsModeration(token);
      setItems(r.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs pending moderation');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (jobId: string, decision: 'APPROVED' | 'REJECTED') => {
    const token = getToken();
    if (!token) return;
    const note = prompt('Note (optional)') ?? undefined;
    setActing(jobId);
    try {
      await moderateJob(token, jobId, { decision, note });
      setItems((prev) => prev.filter((j) => j._id !== jobId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to moderate job');
    } finally {
      setActing(null);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', margin: '0 0 4px' }}>Job moderation</h1>
      <p style={{ color: '#7A7E96', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Jobs awaiting a moderation decision.
      </p>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Sector</th>
            <th style={th}>Employer</th>
            <th style={th}>Salary</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {items.map((j) => (
            <tr key={j._id}>
              <td style={td}>{j.title}</td>
              <td style={td}>{j.sector}</td>
              <td style={td}>{j.employer_id.slice(0, 10)}</td>
              <td style={td}>
                ₹{j.salary_min}–{j.salary_max}/{j.salary_period}
              </td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => decide(j._id, 'APPROVED')}
                    disabled={acting === j._id}
                    style={btnApprove}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(j._id, 'REJECTED')}
                    disabled={acting === j._id}
                    style={btnReject}
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr>
              <td colSpan={5} style={td}>
                No jobs pending moderation.
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
const btnApprove: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: '#4CAF50',
  color: '#fff',
};
const btnReject: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: '#f44336',
  color: '#fff',
};
