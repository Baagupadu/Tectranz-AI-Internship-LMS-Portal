import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { LearningClient } from './LearningClient';

export const dynamic = 'force-dynamic';

export default async function StudentLearningPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  let enrolmentId = user.enrolmentId || 1;

  // Retrieve track phases, modules, and lessons
  const trackRow = db.prepare(`
    SELECT t.id, t.name, t.code FROM enrolments e
    JOIN cohorts c ON e.cohort_id = c.id
    JOIN tracks t ON c.track_id = t.id
    WHERE e.id = ?
  `).get(enrolmentId) as { id: number; name: string; code: string } | undefined;

  const trackId = trackRow ? trackRow.id : 1;

  const phases = db.prepare(`
    SELECT * FROM curriculum_phases WHERE track_id = ? ORDER BY phase_number ASC
  `).all(trackId) as Array<{
    id: number;
    phase_number: number;
    title: string;
    description: string;
    start_week: number;
    end_week: number;
  }>;

  const modules = db.prepare(`
    SELECT m.* FROM curriculum_modules m
    JOIN curriculum_phases p ON m.phase_id = p.id
    WHERE p.track_id = ? ORDER BY m.module_number ASC
  `).all(trackId) as Array<{
    id: number;
    phase_id: number;
    module_number: number;
    title: string;
    description: string;
    week_number: number;
  }>;

  const lessons = db.prepare(`
    SELECT l.*, lc.status as completion_status, lc.progress_seconds
    FROM curriculum_lessons l
    JOIN curriculum_modules m ON l.module_id = m.id
    JOIN curriculum_phases p ON m.phase_id = p.id
    LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.enrolment_id = ?
    WHERE p.track_id = ? ORDER BY l.order_index ASC
  `).all(enrolmentId, trackId) as Array<{
    id: number;
    module_id: number;
    title: string;
    lesson_type: string;
    duration_minutes: number;
    video_url: string | null;
    transcript_text: string | null;
    resources_json: string | null;
    order_index: number;
    completion_status: string | null;
    progress_seconds: number | null;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">{trackRow?.code || 'L1'} CURRICULUM</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              {trackRow?.name || 'GenAI & LLM Application Engineering'}
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              16-Week Structured Syllabus · Recorded Masterclasses, Practical Hands-on Labs & Architecture Reviews.
            </p>
          </div>

          <LearningClient
            phases={toPlain(phases)}
            modules={toPlain(modules)}
            lessons={toPlain(lessons)}
            enrolmentId={enrolmentId}
          />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
