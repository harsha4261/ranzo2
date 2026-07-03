'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { LoadingBanner, ErrorBanner } from '@/components/StatusBanner';
import { fetchConfig, getToken, patchConfig } from '@/lib/api';

export default function ConfigPage() {
  const router = useRouter();
  const [maintenance, setMaintenance] = useState(false);
  const [escrowHoldAmount, setEscrowHoldAmount] = useState(0);
  const [supportPhone, setSupportPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const c = await fetchConfig(token);
      setMaintenance(!!c.maintenance_mode);
      setEscrowHoldAmount(c.escrow_hold_amount ?? 0);
      setSupportPhone(c.support_phone ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      await patchConfig(token, {
        maintenance_mode: maintenance,
        escrow_hold_amount: escrowHoldAmount,
        support_phone: supportPhone || undefined,
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Platform config</h1>
      <AdminNav />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading && <LoadingBanner />}

      {!loading && !error && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, display: 'grid', gap: 12 }}>
          <label>
            Escrow hold amount (₹)
            <input
              type="number"
              value={escrowHoldAmount}
              onChange={(e) => setEscrowHoldAmount(Number(e.target.value))}
              style={input}
            />
          </label>
          <label>
            Support phone
            <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} style={input} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
            />
            Maintenance mode
          </label>
          {saveError && <ErrorBanner message={saveError} />}
          <button type="button" onClick={save} disabled={saving} style={saveBtn}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </main>
  );
}

const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  boxSizing: 'border-box',
};
const saveBtn: React.CSSProperties = {
  padding: 12,
  background: '#6B2C8C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};
