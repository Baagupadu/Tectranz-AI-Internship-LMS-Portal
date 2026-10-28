import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { TaskSubmitClient } from './TaskSubmitClient';

export const dynamic = 'force-dynamic';

export default async function StudentTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const enrolmentId = user.enrolmentId || 1;

  // Fetch all assignments with all submission versions
  const assignments = db.prepare(`
    SELECT a.* FROM assignments a
    JOIN enrolments e ON e.cohort_id = a.cohort_id
    WHERE e.id = ?
    ORDER BY a.order_index ASC
  `).all(enrolmentId) as Array<{
    id: number;
    title: string;
    description: string;
    instructions: string;
    rubric_json: string;
    max_points: number;
    due_date: string;
    late_allowed: number;
  }>;

  const submissions = db.prepare(`
    SELECT sub.*, mp.full_name as reviewer_name FROM assignment_submissions sub
    LEFT JOIN users u ON sub.reviewer_id = u.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
    WHERE sub.enrolment_id = ?
    ORDER BY sub.version_number DESC
  `).all(enrolmentId) as Array<{
    id: number;
    assignment_id: number;
    version_number: number;
    github_repo_url: string | null;
    demo_url: string | null;
    submission_text: string | null;
    status: string;
    score: number | null;
    reviewer_feedback: string | null;
    submitted_at: string;
    graded_at: string | null;
    reviewer_name: string | null;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">PRACTICAL ASSIGNMENTS</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Tasks, Code Submissions & Code Reviews
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Submit GitHub repository links and live deployments. Mentors perform line-by-line audits against evaluation rubrics.
            </p>
          </div>

          <TaskSubmitClient assignments={toPlain(assignments)} submissions={toPlain(submissions)} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
