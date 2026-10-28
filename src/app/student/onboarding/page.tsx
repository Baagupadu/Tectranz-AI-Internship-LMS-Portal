import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { OnboardingClient } from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function StudentOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const profile = db.prepare(`
    SELECT sp.*, u.email FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = ?
  `).get(user.id) as {
    full_name: string;
    phone: string | null;
    college_name: string | null;
    graduation_year: number | null;
    semester: string | null;
    degree_branch: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    timezone: string;
    consent_signed_at: string | null;
    email: string;
  } | undefined;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">STUDENT VERIFICATION</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Academic Profile & Institution Details
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Provide verified college enrolment, semester standing (4.1 or 4.2), and digital identities for partner offer letters and academic credit conversion.
            </p>
          </div>

          <OnboardingClient initialProfile={toPlain(profile) || { full_name: user.fullName, email: user.email, timezone: 'Asia/Kolkata' }} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
