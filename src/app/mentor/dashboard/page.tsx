import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { getDb } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { MentorSidebar } from '@/components/layout/MentorSidebar';

export const dynamic = 'force-dynamic';

export default async function MentorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  assertRole(user, ['mentor', 'admin']);

  const db = getDb();

  // Assigned Cohorts
  const cohorts = db.prepare(`
    SELECT c.*, t.name as track_name, t.code as track_code,
           (SELECT COUNT(*) FROM enrolments e WHERE e.cohort_id = c.id) as student_count
    FROM cohorts c
    JOIN tracks t ON c.track_id = t.id
    WHERE c.lead_mentor_id = ? OR ? = 'admin'
  `).all(user.id, user.role) as Array<{
    id: number;
    name: string;
    track_name: string;
    track_code: string;
    start_date: string;
    end_date: string;
    student_count: number;
    max_capacity: number;
  }>;

  // Pending Submissions awaiting grading
  const pendingSubmissions = db.prepare(`
    SELECT sub.*, a.title as assignment_title, a.max_points, sp.full_name as student_name
    FROM assignment_submissions sub
    JOIN assignments a ON sub.assignment_id = a.id
    JOIN enrolments e ON sub.enrolment_id = e.id
    JOIN student_profiles sp ON e.user_id = sp.user_id
    WHERE sub.status IN ('submitted', 'resubmitted', 'under_review')
    ORDER BY sub.submitted_at ASC
  `).all() as Array<{
    id: number;
    assignment_title: string;
    max_points: number;
    student_name: string;
    version_number: number;
    github_repo_url: string | null;
    demo_url: string | null;
    submitted_at: string;
  }>;

  // Pending Attendance Correction Appeals
  const pendingCorrections = db.prepare(`
    SELECT ac.*, ls.title as session_title, sp.full_name as student_name
    FROM attendance_corrections ac
    JOIN attendance_records ar ON ac.attendance_record_id = ar.id
    JOIN live_sessions ls ON ar.live_session_id = ls.id
    JOIN enrolments e ON ac.enrolment_id = e.id
    JOIN student_profiles sp ON e.user_id = sp.user_id
    WHERE ac.decision = 'pending'
    ORDER BY ac.created_at ASC
  `).all() as Array<{
    id: number;
    session_title: string;
    student_name: string;
    requested_status: string;
    reason: string;
    evidence_url: string | null;
    created_at: string;
  }>;

  // Unapproved Logbook entries
  const pendingLogs = db.prepare(`
    SELECT al.*, sp.full_name as student_name
    FROM activity_logbook al
    JOIN enrolments e ON al.enrolment_id = e.id
    JOIN student_profiles sp ON e.user_id = sp.user_id
    WHERE al.status = 'submitted'
    ORDER BY al.created_at ASC
  `).all() as Array<{
    id: number;
    student_name: string;
    log_date: string;
    activity_category: string;
    duration_minutes: number;
    learning_outcome: string;
  }>;

  return (
    <div className="app-container">
      <MentorSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-sand">FACULTY OPERATIONS</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
                Mentor Command & Review Desk
              </h1>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
                Review assignment code, inspect GitHub pull requests, approve daily logbook hours, and adjudicate attendance appeals.
              </p>
            </div>

            <Link href="/mentor/reviews" className="btn btn-volt">
              Open Code Grading Queue ({pendingSubmissions.length}) →
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="tz-card">
              <span className="badge badge-warning">AWAITING CODE AUDIT</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {pendingSubmissions.length} Submissions
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Turnaround SLA: within 48 hours of submission
              </p>
            </div>

            <div className="tz-card">
              <span className="badge badge-iris">ATTENDANCE APPEALS</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {pendingCorrections.length} Pending
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Requires evidence check and sign-off
              </p>
            </div>

            <div className="tz-card">
              <span className="badge badge-volt">LOGBOOK VERIFICATION</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {pendingLogs.length} Entries
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Daily engineering hours submitted by students
              </p>
            </div>
          </div>

          {/* Assigned Cohorts */}
          <div className="tz-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
              Assigned Cohorts & Track Schedules
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {cohorts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: 'var(--color-sand)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-ink)',
                    boxShadow: 'var(--shadow-pop-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-volt">{c.track_code}</span>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {c.student_count} / {c.max_capacity} Enrolled
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{c.name}</h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                    {c.track_name}
                  </p>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
                    Schedule: {c.start_date} to {c.end_date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Submissions Quick Preview */}
          <div className="tz-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Urgent Review Queue</h3>
              <Link href="/mentor/reviews" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-iris)' }}>
                Open Evaluation Workspace →
              </Link>
            </div>

            <div className="tz-table-wrapper">
              <table className="tz-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Assignment Title</th>
                    <th>Version</th>
                    <th>Submitted Time</th>
                    <th>Repository Link</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubmissions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 700 }}>{sub.student_name}</td>
                      <td>{sub.assignment_title}</td>
                      <td>
                        <span className="badge badge-sand">v{sub.version_number}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>
                      <td>
                        {sub.github_repo_url ? (
                          <a href={sub.github_repo_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-iris)', fontWeight: 700 }}>
                            GitHub Repo ↗
                          </a>
                        ) : (
                          'Text Submission'
                        )}
                      </td>
                      <td>
                        <Link href="/mentor/reviews" className="btn btn-volt btn-sm">
                          Grade & Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
