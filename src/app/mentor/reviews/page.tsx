import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { MentorSidebar } from '@/components/layout/MentorSidebar';
import { ReviewQueueClient } from './ReviewQueueClient';

export const dynamic = 'force-dynamic';

export default async function MentorReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  assertRole(user, ['mentor', 'admin']);

  const db = getDb();

  const submissions = db.prepare(`
    SELECT sub.*, a.title as assignment_title, a.max_points, a.rubric_json,
           sp.full_name as student_name, e.registration_id
    FROM assignment_submissions sub
    JOIN assignments a ON sub.assignment_id = a.id
    JOIN enrolments e ON sub.enrolment_id = e.id
    JOIN student_profiles sp ON e.user_id = sp.user_id
    ORDER BY sub.id DESC
  `).all() as Array<{
    id: number;
    assignment_title: string;
    max_points: number;
    rubric_json: string;
    student_name: string;
    registration_id: string;
    version_number: number;
    github_repo_url: string | null;
    demo_url: string | null;
    submission_text: string | null;
    status: string;
    score: number | null;
    reviewer_feedback: string | null;
    submitted_at: string;
  }>;

  return (
    <div className="app-container">
      <MentorSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">EVALUATION DESK</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Assignment Code Audits & Rubric Scoring
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Inspect GitHub repositories, verify unit test coverage, and award points according to the cohort rubric criteria.
            </p>
          </div>

          <ReviewQueueClient initialSubmissions={toPlain(submissions)} />
        </main>
      </div>
    </div>
  );
}
