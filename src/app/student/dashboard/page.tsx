import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';
import { AttendanceService } from '@/lib/services/attendance.service';
import { ScorecardService } from '@/lib/services/scorecard.service';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const db = getDb();

  // If user has no active enrolment (e.g. mentor/admin accessing student portal), fetch first student enrolment for preview
  let enrolmentId = user.enrolmentId;
  if (!enrolmentId) {
    const firstEnr = db.prepare("SELECT id FROM enrolments WHERE status IN ('active', 'completed') LIMIT 1").get() as { id: number };
    if (firstEnr) {
      enrolmentId = firstEnr.id;
    } else {
      enrolmentId = 1;
    }
  }

  // Enrolment & Track details
  const enrolment = db.prepare(`
    SELECT 
      e.*,
      t.name as track_name,
      t.code as track_code,
      p.name as plan_name,
      p.mode as plan_mode,
      c.name as cohort_name,
      mp.full_name as mentor_name,
      mp.company as mentor_company,
      po.name as partner_name
    FROM enrolments e
    JOIN cohorts c ON e.cohort_id = c.id
    JOIN tracks t ON c.track_id = t.id
    JOIN plans p ON e.plan_id = p.id
    LEFT JOIN users mu ON e.assigned_mentor_id = mu.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = mu.id
    LEFT JOIN partner_organizations po ON e.partner_id = po.id
    WHERE e.id = ?
  `).get(enrolmentId) as {
    registration_id: string;
    track_name: string;
    track_code: string;
    plan_name: string;
    plan_mode: string;
    cohort_name: string;
    mentor_name: string | null;
    mentor_company: string | null;
    partner_name: string | null;
    status: string;
    onboarding_completed: number;
  };

  const attendance = AttendanceService.getAttendanceSummary(enrolmentId);
  const checklist = ScorecardService.evaluateCompletion(enrolmentId);

  // Next Live Session
  const nextSession = db.prepare(`
    SELECT ls.*, u.email as instructor_email, mp.full_name as instructor_name
    FROM live_sessions ls
    JOIN cohorts c ON ls.cohort_id = c.id
    JOIN enrolments e ON e.cohort_id = c.id
    LEFT JOIN users u ON ls.instructor_id = u.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
    WHERE e.id = ? AND ls.status = 'scheduled'
    ORDER BY ls.scheduled_start ASC LIMIT 1
  `).get(enrolmentId) as {
    title: string;
    scheduled_start: string;
    meeting_link: string;
    session_type: string;
    instructor_name: string | null;
  } | undefined;

  // Active Capstone Project
  const activeProject = db.prepare(`
    SELECT sp.*, pc.title as catalogue_title, po.name as partner_org_name
    FROM student_projects sp
    LEFT JOIN project_catalogue pc ON sp.catalogue_project_id = pc.id
    LEFT JOIN partner_organizations po ON sp.partner_id = po.id
    WHERE sp.enrolment_id = ?
    ORDER BY sp.id DESC LIMIT 1
  `).get(enrolmentId) as {
    id: number;
    title: string;
    status: string;
    viva_status: string;
    partner_org_name: string | null;
    repo_url: string | null;
    demo_url: string | null;
  } | undefined;

  // Recent Assignments
  const assignments = db.prepare(`
    SELECT 
      a.id, a.title, a.due_date, a.max_points,
      sub.status as sub_status,
      sub.score,
      sub.reviewer_feedback
    FROM assignments a
    JOIN cohorts c ON a.cohort_id = c.id
    JOIN enrolments e ON e.cohort_id = c.id
    LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.enrolment_id = e.id
    WHERE e.id = ?
    ORDER BY a.order_index ASC LIMIT 3
  `).all(enrolmentId) as Array<{
    id: number;
    title: string;
    due_date: string;
    max_points: number;
    sub_status: string | null;
    score: number | null;
    reviewer_feedback: string | null;
  }>;

  // Recent Notifications
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 3
  `).all(user.id) as Array<{
    id: number;
    title: string;
    message: string;
    notification_type: string;
    created_at: string;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      
      <div className="app-main">
        <AppHeader user={user} unreadNotificationsCount={notifications.length} />

        <main className="app-content">
          {/* Welcome & Enrolment Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="badge badge-volt">{enrolment?.registration_id || 'TZ-2026-AIE-0418'}</span>
                <span className="badge badge-sand">{enrolment?.cohort_name || 'COHORT-2026-NOV-L1'}</span>
                <span className="badge badge-iris">{enrolment?.plan_name || 'Industry Capstone'}</span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.6rem', letterSpacing: '-0.02em' }}>
                Welcome back, {user.fullName || 'Aarav'} 👋
              </h1>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                Track: <strong>{enrolment?.track_name}</strong> · Mentor: <strong>{enrolment?.mentor_name || 'Dr. Vikramaditya Sen'}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/student/learning" className="btn btn-volt">
                Resume Learning →
              </Link>
              <Link href="/student/calendar" className="btn btn-outline">
                Calendar Agenda
              </Link>
            </div>
          </div>

          {/* Top Priority Cards (Next Live Class & Milestone) */}
          <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
            
            {/* Next Live Session */}
            <div className="tz-card" style={{ borderLeft: '6px solid var(--color-iris)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-iris">NEXT LIVE SESSION</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-iris)' }}>
                    Mandatory Class
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {nextSession ? nextSession.title : 'Live Session: Multi-Agent Collaboration Patterns with LangGraph'}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-muted)' }}>
                  Scheduled for: <strong>Thursday at 6:00 PM IST</strong> · Instructor: {nextSession?.instructor_name || 'Dr. Vikramaditya Sen'}
                </p>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--color-line)' }}>
                <a
                  href={nextSession?.meeting_link || 'https://meet.tectranz.com/l1-live'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-volt btn-sm"
                >
                  Join Google Meet ↗
                </a>
                <Link href="/student/calendar" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                  View Full Schedule →
                </Link>
              </div>
            </div>

            {/* Active Partner Capstone Project Status */}
            <div className="tz-card" style={{ borderLeft: '6px solid var(--color-volt)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-volt">PARTNER CAPSTONE</span>
                  <span className="badge badge-sand">🏢 {enrolment?.partner_name || 'Aethelgard AI Labs'}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {activeProject ? activeProject.title : 'Enterprise Financial Disclosures Agent & Regulatory Verifier'}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)' }}>
                  Status: <strong style={{ color: 'var(--color-iris)' }}>In Progress · Milestone 2 in Review</strong>
                </p>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--color-line)' }}>
                <Link href="/student/projects" className="btn btn-outline btn-sm">
                  Open Project Workspace →
                </Link>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                  Defended Review in Week 16
                </span>
              </div>
            </div>

          </div>

          {/* Metrics & Progress Row */}
          <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
            
            {/* Attendance Metric */}
            <div className="tz-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                  ATTENDANCE RATE
                </span>
                <span className="badge badge-volt">{attendance.attendancePercentage}%</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {attendance.presentCount} / {attendance.totalConductedSessions} Classes
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem' }}>
                Policy threshold: &ge; {attendance.minAttendanceRequiredPercent}%. Eligible for certificate.
              </p>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-sand)', borderRadius: '4px', marginTop: '0.75rem', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attendance.attendancePercentage)}%`, height: '100%', backgroundColor: 'var(--color-volt)' }} />
              </div>
            </div>

            {/* Engagement Hours Metric */}
            <div className="tz-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                  ENGAGEMENT HOURS
                </span>
                <span className="badge badge-iris">{attendance.hoursBreakdown.totalApprovedEngagementHours}h</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {attendance.hoursBreakdown.totalApprovedEngagementHours} / {attendance.hoursBreakdown.minRequiredHours}h
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem' }}>
                Live: {attendance.hoursBreakdown.liveSessionHours}h · Lessons: {attendance.hoursBreakdown.recordedLessonHours}h · Logbook: {attendance.hoursBreakdown.logbookApprovedHours}h
              </p>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-sand)', borderRadius: '4px', marginTop: '0.75rem', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (attendance.hoursBreakdown.totalApprovedEngagementHours / attendance.hoursBreakdown.minRequiredHours) * 100)}%`, height: '100%', backgroundColor: 'var(--color-iris)' }} />
              </div>
            </div>

            {/* Assessment Average Score */}
            <div className="tz-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                  ACADEMIC PERFORMANCE
                </span>
                <span className="badge badge-success">{checklist.completionScore}%</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                Grade A+ (Honours)
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem' }}>
                Passing threshold: &ge; 60%. Next assignment due in 10 days.
              </p>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-sand)', borderRadius: '4px', marginTop: '0.75rem', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, checklist.completionScore)}%`, height: '100%', backgroundColor: 'var(--color-success)' }} />
              </div>
            </div>

          </div>

          {/* Main 2-Column Section: Assignments & Completion Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
            
            {/* Assignments Queue */}
            <div className="tz-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Core Assignments</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                    Track tasks, submissions, rubrics, and feedback
                  </p>
                </div>
                <Link href="/student/tasks" className="btn btn-outline btn-sm">
                  View All
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-ink)',
                      backgroundColor: 'var(--color-sand-light)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 800 }}>{a.title}</h4>
                      {a.sub_status === 'graded' ? (
                        <span className="badge badge-success">GRADED · {a.score}/100</span>
                      ) : a.sub_status === 'under_review' ? (
                        <span className="badge badge-warning">UNDER REVIEW</span>
                      ) : (
                        <span className="badge badge-danger">PENDING SUBMISSION</span>
                      )}
                    </div>
                    {a.reviewer_feedback && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink)', marginTop: '0.5rem', backgroundColor: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-line)' }}>
                        <strong>Feedback:</strong> {a.reviewer_feedback}
                      </p>
                    )}
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                      <span>Due: {a.due_date.split(' ')[0]}</span>
                      <Link href="/student/tasks" style={{ fontWeight: 700, color: 'var(--color-iris)' }}>
                        {a.sub_status ? 'View Submission History →' : 'Submit Code →'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Completion & Certification Gates */}
            <div className="tz-card">
              <div style={{ marginBottom: '1.25rem' }}>
                <span className="badge badge-iris">POLICY GATES (v2026.1)</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  Certificate Eligibility Checklist
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                  All 5 institutional gates must be confirmed before certificate issuance.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(checklist.gates).map(([key, gate]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-ink)',
                      backgroundColor: gate.satisfied ? 'var(--color-success-bg)' : '#fff',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{gate.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                        Current: <strong>{gate.currentValue}</strong> (Target: {gate.targetValue})
                      </div>
                    </div>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: gate.satisfied ? 'var(--color-success)' : 'var(--color-sand)',
                        color: gate.satisfied ? '#fff' : 'var(--color-ink-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 900,
                      }}
                    >
                      {gate.satisfied ? '✓' : '○'}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-line)', textAlign: 'center' }}>
                {checklist.overallEligible ? (
                  <Link href="/student/documents" className="btn btn-volt" style={{ width: '100%' }}>
                    Claim Verified QR Certificate →
                  </Link>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                    Complete Milestone 3 & 4 and approved reports to unlock certification.
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
