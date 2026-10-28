'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/lib/auth/session';

interface AppHeaderProps {
  user: SessionUser;
  unreadNotificationsCount?: number;
}

export function AppHeader({ user, unreadNotificationsCount = 2 }: AppHeaderProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (role: string) => {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        if (role === 'mentor') {
          router.push('/mentor/dashboard');
        } else if (role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="app-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-ink)',
              color: 'var(--color-volt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              border: '2px solid var(--color-ink)',
            }}
          >
            TZ
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            Tectranz <span style={{ color: 'var(--color-iris)', fontSize: '0.85rem', fontWeight: 700 }}>PORTAL</span>
          </span>
        </Link>

        {user.registrationId && (
          <span className="badge badge-volt hidden-mobile" title="Official Student Registration ID">
            {user.registrationId}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Fast Interactive Persona Switcher for pair-testing and demo verification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--color-sand)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--color-ink)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
            DEMO:
          </span>
          <select
            value={user.role === 'student' && user.fullName === 'Riya Verma' ? 'student_graduated' : user.role}
            disabled={switching}
            onChange={(e) => handleRoleSwitch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.76rem',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="student">Student (Aarav - In Progress)</option>
            <option value="student_graduated">Student (Riya - Certified)</option>
            <option value="mentor">Mentor (Dr. Vikramaditya)</option>
            <option value="admin">Admin (Sunita Rao)</option>
            <option value="reviewer">Reviewer (Rajesh Nair)</option>
            <option value="supervisor">Supervisor (Prof. Ramanujan)</option>
            <option value="finance">Finance (Ananya)</option>
          </select>
        </div>

        {/* Notifications Icon with unread badge */}
        <Link
          href="/student/support"
          className="btn btn-ghost"
          style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', padding: 0 }}
          aria-label="View notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
          </svg>
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-volt)',
                border: '1.5px solid var(--color-ink)',
              }}
            />
          )}
        </Link>

        {/* User Pill & Sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-white)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--color-ink)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-iris)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {user.fullName ? user.fullName[0] : 'U'}
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName || user.email}
            </span>
          </div>

          <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Sign out of Tectranz Portal">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
