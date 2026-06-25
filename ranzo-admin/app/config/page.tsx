'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { fetchConfig, getToken, patchConfig } from '@/lib/api';

export default function ConfigPage() {
  const router = useRouter();
  const [betaCity, setBetaCity] = useState('Hyderabad');
  const [maintenance, setMaintenance] = useState(false);
  const [email, setEmail] = useState('support@ranzo.app');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    fetchConfig(token).then((c) => {
      setBetaCity(c.beta_city ?? 'Hyderabad');
      setMaintenance(!!c.maintenance_mode);
      setEmail(c.support_email ?? '');
    });
  }, [router]);

  const save = async () => {
    const token = getToken();
    if (!token) return;
    await patchConfig(token, {
      beta_city: betaCity,
      maintenance_mode: maintenance,
      support_email: email,
    });
    alert('Saved');
  };

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ color: '#6B2C8C' }}>Platform config</h1>
      <AdminNav />
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, display: 'grid', gap: 12 }}>
        <label>
          Beta city
          <input value={betaCity} onChange={(e) => setBetaCity(e.target.value)} style={input} />
        </label>
        <label>
          Support email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
          />
          Maintenance mode
        </label>
        <button type="button" onClick={save} style={saveBtn}>
          Save
        </button>
      </div>
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
};
const saveBtn: React.CSSProperties = {
  padding: 12,
  background: '#6B2C8C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};
