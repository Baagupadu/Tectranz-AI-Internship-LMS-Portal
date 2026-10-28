import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { AdminSidebar } from '@/components/layout/MentorSidebar';
import { PolicyEditorClient } from './PolicyEditorClient';

export const dynamic = 'force-dynamic';

export default async function AdminProgrammesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  assertRole(user, ['admin']);

  const db = getDb();

  const policies = db.prepare('SELECT * FROM policy_versions ORDER BY id ASC').all() as Array<{
    id: number;
    version_tag: string;
    name: string;
    min_attendance_percent: number;
    min_engagement_hours: number;
    required_projects_count: number;
    required_reports_count: number;
    passing_grade_percent: number;
    late_penalty_per_day: number;
    resubmission_allowed: number;
    is_default: number;
  }>;

  const tracks = db.prepare('SELECT * FROM tracks ORDER BY id ASC').all() as Array<{
    id: number;
    code: string;
    name: string;
    duration_weeks: number;
  }>;

  return (
    <div className="app-container">
      <AdminSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">PROGRAMME CONFIGURATION</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Policy Rules, Assessment Weights & Thresholds
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Institutional rules are configurable. Adjust required attendance %, minimum engagement hours, number of projects (1 vs 2), report frequencies, and passing gates.
            </p>
          </div>

          <PolicyEditorClient policies={toPlain(policies)} tracks={toPlain(tracks)} />
        </main>
      </div>
    </div>
  );
}
