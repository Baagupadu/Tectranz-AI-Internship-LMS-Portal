import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { LogbookClient } from './LogbookClient';

export const dynamic = 'force-dynamic';

export default async function StudentLogbookPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const enrolmentId = user.enrolmentId || 1;

  const entries = db.prepare(`
    SELECT al.*, mp.full_name as approver_name
    FROM activity_logbook al
    LEFT JOIN users u ON al.approved_by_id = u.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
    WHERE al.enrolment_id = ?
    ORDER BY al.log_date DESC
  `).all(enrolmentId) as Array<{
    id: number;
    log_date: string;
    activity_category: string;
    duration_minutes: number;
    learning_outcome: string;
    blockers: string | null;
    evidence_url: string | null;
    status: string;
    approved_at: string | null;
    approver_name: string | null;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">DAILY ACTIVITY LOGS</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Activity Logbook & Hours Registry
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Log your daily engineering activities, code commits, blockers, and outcomes. Approved hours count directly towards your graduation credit requirements.
            </p>
          </div>

          <LogbookClient initialEntries={toPlain(entries)} enrolmentId={enrolmentId} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
