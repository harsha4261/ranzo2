'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { fetchLegal } from '@/lib/api';

const SLUGS = ['terms', 'privacy', 'refund'];

export default function LegalPreviewPage() {
  const [slug, setSlug] = useState('terms');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchLegal(slug);
      setBody(d.body ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load legal page');
      setBody('');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Legal pages</h1>
      <AdminNav />
      <select value={slug} onChange={(e) => setSlug(e.target.value)} style={{ marginBottom: 16 }}>
        {SLUGS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      {!loading && !error && (
        <article
          style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            whiteSpace: 'pre-wrap',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {body}
        </article>
      )}
    </main>
  );
}
