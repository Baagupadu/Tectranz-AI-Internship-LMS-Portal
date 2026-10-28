import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ReportsClient } from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function StudentReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const enrolmentId = user.enrolmentId || 1;

  const reports = db.prepare(`
    SELECT pr.*, mp.full_name as approver_name
    FROM periodic_reports pr
    LEFT JOIN users u ON pr.approved_by_id = u.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
    WHERE pr.enrolment_id = ?
    ORDER BY pr.period_start DESC
  `).all(enrolmentId) as Array<{
    id: number;
    report_type: string;
    period_start: string;
    period_end: string;
    summary_text: string;
    challenges_text: string | null;
    planned_next_text: string | null;
    metrics_snapshot_json: string | null;
    mentor_feedback: string | null;
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
            <span className="badge badge-volt">PROGRESS STATEMENTS</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Periodic Progress Reports & Academic Snapshots
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Structured Fortnightly & Final Capstone Reports signed off by faculty mentors. Approved reports preserve immutable data snapshots for university evaluation.
            </p>
          </div>

          <ReportsClient initialReports={toPlain(reports)} enrolmentId={enrolmentId} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
