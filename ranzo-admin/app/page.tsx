'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminLogin, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await adminLogin(username, password);
      setToken(access_token);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials or API unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <form onSubmit={submit} style={styles.card}>
        <h1 style={{ color: '#6B2C8C', marginTop: 0 }}>Ranzo Admin</h1>
        <p style={{ color: '#7A7E96' }}>Phase 1 operations login</p>
        <label style={styles.label}>Username</label>
        <input style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: '#D63B3B' }}>{error}</p>}
        <button type="submit" style={styles.btn} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: {
    background: '#fff',
    padding: 32,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 8px 32px rgba(107,44,140,0.12)',
  },
  label: { display: 'block', marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 14 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ECE6F0',
    boxSizing: 'border-box',
  },
  btn: {
    marginTop: 20,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#6B2C8C',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
