'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/service-bookings', label: 'Service bookings' },
  { href: '/technicians', label: 'Technicians' },
  { href: '/walk-in', label: 'Walk-in' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/verifications', label: 'Verifications' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/config', label: 'Config' },
  { href: '/application-logs', label: 'App logs' },
  { href: '/audit-log', label: 'Audit log' },
  { href: '/legal', label: 'Legal' },
];

export function AdminNav() {
  const path = usePathname();
  const router = useRouter();

  const logout = () => {
    clearToken();
    router.replace('/');
  };

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid #ECE6F0',
        alignItems: 'center',
      }}
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: path === l.href ? 700 : 500,
            color: path === l.href ? '#fff' : '#6B2C8C',
            background: path === l.href ? '#6B2C8C' : '#F5F0F8',
          }}
        >
          {l.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={logout}
        style={{
          marginLeft: 'auto',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #ECE6F0',
          background: '#fff',
          color: '#6B2C8C',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </nav>
  );
}
