'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '@/lib/auth/session';

interface MentorSidebarProps {
  user: SessionUser;
}

export function MentorSidebar({ user }: MentorSidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: '/mentor/dashboard', label: 'Mentor Workspace', icon: '📊' },
    { href: '/mentor/reviews', label: 'Code Review Queue', icon: '✍️' },
    { href: '/student/dashboard', label: 'Switch to Student View', icon: '🔄' },
  ];

  return (
    <aside className="app-sidebar" style={{ backgroundColor: '#131142' }}>
      <div style={{ padding: '1.25rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-volt)', fontWeight: 700 }}>
          FACULTY & MENTOR OPS
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.98rem', color: '#fff', marginTop: '0.25rem' }}>
          {user.fullName}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem' }}>
          Assigned Cohort: NOV-L1
        </div>
      </div>

      <nav style={{ padding: '0.75rem 0.6rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.86rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--color-ink)' : 'rgba(255,255,255,0.85)',
                backgroundColor: isActive ? 'var(--color-volt)' : 'transparent',
                border: isActive ? '1.5px solid var(--color-ink)' : '1.5px solid transparent',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', label: 'Operations Command', icon: '🏛️' },
    { href: '/admin/programmes', label: 'Policies & Thresholds', icon: '⚙️' },
    { href: '/mentor/dashboard', label: 'Mentor Queue', icon: '✍️' },
    { href: '/student/dashboard', label: 'Student Portal Preview', icon: '👀' },
  ];

  return (
    <aside className="app-sidebar" style={{ backgroundColor: '#090726' }}>
      <div style={{ padding: '1.25rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-volt)', fontWeight: 700 }}>
          ACADEMIC ADMINISTRATION
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.98rem', color: '#fff', marginTop: '0.25rem' }}>
          {user.fullName}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem' }}>
          Role: Programme Director
        </div>
      </div>

      <nav style={{ padding: '0.75rem 0.6rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.86rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--color-ink)' : 'rgba(255,255,255,0.85)',
                backgroundColor: isActive ? 'var(--color-volt)' : 'transparent',
                border: isActive ? '1.5px solid var(--color-ink)' : '1.5px solid transparent',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
