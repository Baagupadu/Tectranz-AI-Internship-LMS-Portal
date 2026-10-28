'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '@/lib/auth/session';

interface StudentSidebarProps {
  user: SessionUser;
}

export function StudentSidebar({ user }: StudentSidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '⚡' },
    { href: '/student/learning', label: 'Curriculum & Lessons', icon: '📚' },
    { href: '/student/calendar', label: 'Calendar & Classes', icon: '📅' },
    { href: '/student/tasks', label: 'Tasks & Assignments', icon: '📝' },
    { href: '/student/projects', label: 'Partner Projects', icon: '🚀' },
    { href: '/student/attendance', label: 'Attendance & Hours', icon: '⏱️' },
    { href: '/student/logbook', label: 'Activity Logbook', icon: '📖' },
    { href: '/student/reports', label: 'Progress Reports', icon: '📊' },
    { href: '/student/documents', label: 'Documents & Certs', icon: '📜' },
    { href: '/student/support', label: 'Support & Mentors', icon: '💬' },
    { href: '/student/onboarding', label: 'My Profile & College', icon: '🎓' },
  ];

  return (
    <aside className="app-sidebar">
      {/* Track / Cohort Pill Header */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-volt)', fontWeight: 700 }}>
          ACTIVE ENROLMENT
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.98rem', color: '#fff', marginTop: '0.25rem', lineHeight: 1.25 }}>
          {user.trackName || 'GenAI Engineering'}
        </div>
        <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'var(--font-mono)' }}>
            Week 4 of 16
          </span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--color-volt)', color: 'var(--color-ink)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            Phase 2: RAG
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: '0.75rem 0.6rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
                boxShadow: isActive ? '2px 2px 0px rgba(0,0,0,0.4)' : 'none',
                transition: 'all 0.12s ease',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{ padding: '1rem', borderTop: '2px solid rgba(255,255,255,0.1)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)' }}>
        <div>Tectranz AI Academy</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', marginTop: '0.2rem' }}>
          UGC & AICTE Credit Aligned
        </div>
      </div>
    </aside>
  );
}
