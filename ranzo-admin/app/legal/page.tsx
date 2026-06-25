'use client';

import { useEffect, useState } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { fetchLegal } from '@/lib/api';

const SLUGS = ['terms', 'privacy', 'refund'];

export default function LegalPreviewPage() {
  const [slug, setSlug] = useState('terms');
  const [body, setBody] = useState('');

  useEffect(() => {
    fetchLegal(slug).then((d) => setBody(d.body));
  }, [slug]);

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
    </main>
  );
}
