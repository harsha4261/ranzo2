'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import {
  fetchApplicationLogs,
  getToken,
  type ApplicationLogEntry,
} from '@/lib/api';

const CATEGORIES = [
  '',
  'http',
  'auth',
  'booking',
  'dispatch',
  'notification',
  'client',
  'startup',
  'payment',
];

const LEVELS = ['', 'DEBUG', 'INFO', 'WARNING', 'ERROR'];

function levelColor(level: string): string {
  switch (level) {
    case 'ERROR':
      return '#D63B3B';
    case 'WARNING':
      return '#E0A800';
    case 'DEBUG':
      return '#7A7E96';
    default:
      return '#1F9D55';
  }
}

export default function ApplicationLogsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [userId, setUserId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 80;

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApplicationLogs(token, {
        limit,
        skip,
        category: category || undefined,
        user_id: userId.trim() || undefined,
        level: level || undefined,
        request_id: requestId.trim() || undefined,
        q: search.trim() || undefined,
      });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router, category, level, userId, requestId, search, skip]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setSkip(0);
    load();
  };

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C', marginBottom: 4 }}>Application logs</h1>
      <p style={{ color: '#7A7E96', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        HTTP requests, auth, bookings, dispatch, notifications, and mobile client events.
        Sensitive fields are redacted on the server.
      </p>
      <AdminNav />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          padding: 16,
          background: '#fff',
          borderRadius: 12,
        }}
      >
        <FilterSelect
          label="Category"
          value={category}
          onChange={(v) => {
            setCategory(v);
            setSkip(0);
          }}
          options={CATEGORIES.map((c) => ({ value: c, label: c || 'All' }))}
        />
        <FilterSelect
          label="Level"
          value={level}
          onChange={(v) => {
            setLevel(v);
            setSkip(0);
          }}
          options={LEVELS.map((l) => ({ value: l, label: l || 'All' }))}
        />
        <FilterInput label="User ID" value={userId} onChange={setUserId} />
        <FilterInput label="Request ID" value={requestId} onChange={setRequestId} />
        <FilterInput label="Message search" value={search} onChange={setSearch} />
        <button type="button" onClick={applyFilters} style={btnPrimary}>
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setCategory('');
            setLevel('');
            setUserId('');
            setRequestId('');
            setSearch('');
            setSkip(0);
          }}
          style={btnSecondary}
        >
          Clear
        </button>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: '#7A7E96' }}>
        {loading ? 'Loading…' : `${total} matching · showing ${items.length}`}
        {error && <span style={{ color: '#D63B3B', marginLeft: 8 }}>{error}</span>}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F0F8' }}>
              <th style={th}>When</th>
              <th style={th}>Level</th>
              <th style={th}>Category</th>
              <th style={th}>Action</th>
              <th style={th}>Message</th>
              <th style={th}>User</th>
              <th style={th}>HTTP</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <Fragment key={e.id}>
                <tr>
                  <td style={td}>{formatTime(e.timestamp)}</td>
                  <td style={td}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: levelColor(e.level),
                      }}
                    >
                      {e.level}
                    </span>
                  </td>
                  <td style={td}>
                    <code style={code}>{e.category}</code>
                  </td>
                  <td style={td}>
                    <code style={code}>{e.action}</code>
                  </td>
                  <td style={{ ...td, maxWidth: 280 }}>
                    <span title={e.message}>{truncate(e.message, 64)}</span>
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>
                    {e.user_id ? truncate(e.user_id, 12) : '—'}
                    {e.app && (
                      <div style={{ color: '#7A7E96' }}>{e.app}</div>
                    )}
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>
                    {e.method && e.path ? (
                      <>
                        <div>
                          {e.method} {truncate(e.path, 28)}
                        </div>
                        {e.status_code != null && (
                          <div style={{ color: '#7A7E96' }}>
                            {e.status_code}
                            {e.duration_ms != null ? ` · ${e.duration_ms}ms` : ''}
                          </div>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={td}>
                    {(e.metadata && Object.keys(e.metadata).length > 0) ||
                    e.request_id ? (
                      <button
                        type="button"
                        style={btnLink}
                        onClick={() =>
                          setExpanded(expanded === e.id ? null : e.id)
                        }
                      >
                        {expanded === e.id ? 'Hide' : 'Details'}
                      </button>
                    ) : null}
                  </td>
                </tr>
                {expanded === e.id && (
                  <tr>
                    <td colSpan={8} style={detailCell}>
                      {e.request_id && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Request ID:</strong>{' '}
                          <code style={code}>{e.request_id}</code>
                        </div>
                      )}
                      {e.metadata && Object.keys(e.metadata).length > 0 && (
                        <pre style={pre}>{JSON.stringify(e.metadata, null, 2)}</pre>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#7A7E96' }}>
            No logs yet. Use the app or API to generate events (LOG_TO_MONGO=true).
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          disabled={skip === 0 || loading}
          onClick={() => setSkip(Math.max(0, skip - limit))}
          style={btnSecondary}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={skip + limit >= total || loading}
          onClick={() => setSkip(skip + limit)}
          style={btnSecondary}
        >
          Next
        </button>
        <button type="button" onClick={load} disabled={loading} style={btnPrimary}>
          Refresh
        </button>
      </div>
    </main>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ fontSize: 12, color: '#7A7E96' }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      >
        {options.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ fontSize: 12, color: '#7A7E96' }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
        placeholder={label}
      />
    </label>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#2A2D45',
};
const td: React.CSSProperties = {
  padding: '10px 12px',
  borderTop: '1px solid #eee',
  verticalAlign: 'top',
  fontSize: 13,
};
const code: React.CSSProperties = {
  fontSize: 11,
  background: '#F5F0F8',
  padding: '2px 6px',
  borderRadius: 4,
};
const detailCell: React.CSSProperties = {
  padding: 16,
  background: '#FAF7FB',
  borderTop: '1px solid #eee',
};
const pre: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  overflow: 'auto',
  maxHeight: 200,
};
const input: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #ECE6F0',
  fontSize: 13,
  minWidth: 120,
};
const btnPrimary: React.CSSProperties = {
  alignSelf: 'flex-end',
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#6B2C8C',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  alignSelf: 'flex-end',
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #ECE6F0',
  background: '#fff',
  color: '#6B2C8C',
  fontWeight: 600,
  cursor: 'pointer',
};
const btnLink: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: '#6B2C8C',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};
