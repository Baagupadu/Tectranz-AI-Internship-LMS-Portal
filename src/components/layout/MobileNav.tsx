'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/student/dashboard', label: 'Home', icon: '⚡' },
    { href: '/student/learning', label: 'Learn', icon: '📚' },
    { href: '/student/tasks', label: 'Tasks', icon: '📝' },
    { href: '/student/calendar', label: 'Schedule', icon: '📅' },
    { href: '/student/attendance', label: 'Hours', icon: '⏱️' },
    { href: '/student/onboarding', label: 'Profile', icon: '🎓' },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              fontWeight: isActive ? 800 : 500,
              color: isActive ? 'var(--color-volt)' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              padding: '0.3rem 0.5rem',
            }}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{link.icon}</span>
            <span style={{ marginTop: '0.2rem' }}>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
