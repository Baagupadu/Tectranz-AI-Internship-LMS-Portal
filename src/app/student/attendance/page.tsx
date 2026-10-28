import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AttendanceService } from '@/lib/services/attendance.service';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AttendanceCorrectionClient } from './AttendanceCorrectionClient';

export const dynamic = 'force-dynamic';

export default async function StudentAttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const enrolmentId = user.enrolmentId || 1;

  const summary = AttendanceService.getAttendanceSummary(enrolmentId);

  // All session attendance records
  const sessionRecords = db.prepare(`
    SELECT 
      ls.id as session_id,
      ls.title,
      ls.session_type,
      ls.scheduled_start,
      ls.scheduled_end,
      ls.is_required,
      ar.id as record_id,
      ar.status as attendance_status,
      ar.notes as attendance_notes,
      ar.marked_at,
      mp.full_name as verified_by_name
    FROM live_sessions ls
    JOIN cohorts c ON ls.cohort_id = c.id
    JOIN enrolments e ON e.cohort_id = c.id
    LEFT JOIN attendance_records ar ON ar.live_session_id = ls.id AND ar.enrolment_id = e.id
    LEFT JOIN users vu ON ar.verified_by_id = vu.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = vu.id
    WHERE e.id = ?
    ORDER BY ls.scheduled_start DESC
  `).all(enrolmentId) as Array<{
    session_id: number;
    title: string;
    session_type: string;
    scheduled_start: string;
    scheduled_end: string;
    is_required: number;
    record_id: number | null;
    attendance_status: string | null;
    attendance_notes: string | null;
    marked_at: string | null;
    verified_by_name: string | null;
  }>;

  // Previous correction requests
  const correctionRequests = db.prepare(`
    SELECT ac.*, ls.title as session_title, mp.full_name as reviewer_name
    FROM attendance_corrections ac
    JOIN attendance_records ar ON ac.attendance_record_id = ar.id
    JOIN live_sessions ls ON ar.live_session_id = ls.id
    LEFT JOIN users ru ON ac.reviewer_id = ru.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = ru.id
    WHERE ac.enrolment_id = ?
    ORDER BY ac.id DESC
  `).all(enrolmentId) as Array<{
    id: number;
    session_title: string;
    requested_status: string;
    reason: string;
    evidence_url: string | null;
    decision: string;
    reviewer_notes: string | null;
    resolved_at: string | null;
    reviewer_name: string | null;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">ACADEMIC RECORD</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Attendance & Approved Engagement Hours
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Audited logs of all live sessions, office hours, and recorded masterclasses. Correction requests are audited by the mentor board.
            </p>
          </div>

          {/* Top Metrics Cards */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="tz-card">
              <span className="badge badge-volt">ATTENDANCE RATE</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {summary.attendancePercentage}%
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Present: {summary.presentCount} · Late: {summary.lateCount} · Excused: {summary.excusedCount}
              </p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.74rem', color: summary.isEligibleUnderPolicy ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                {summary.isEligibleUnderPolicy ? '✓ Satisfies institutional threshold (≥ 75%)' : '⚠️ Below 75% threshold'}
              </div>
            </div>

            <div className="tz-card">
              <span className="badge badge-iris">APPROVED HOURS</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {summary.hoursBreakdown.totalApprovedEngagementHours}h
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Target: {summary.hoursBreakdown.minRequiredHours}h minimum for academic credits
              </p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.74rem', color: 'var(--color-iris)', fontWeight: 700 }}>
                Live: {summary.hoursBreakdown.liveSessionHours}h | Labs: {summary.hoursBreakdown.recordedLessonHours}h | Logbook: {summary.hoursBreakdown.logbookApprovedHours}h
              </div>
            </div>

            <div className="tz-card">
              <span className="badge badge-sand">CORRECTIONS & APPEALS</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {correctionRequests.length}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Audited appeals submitted with evidence
              </p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                Protected ledger: direct record tampering prevented
              </div>
            </div>
          </div>

          <AttendanceCorrectionClient
            records={toPlain(sessionRecords)}
            corrections={toPlain(correctionRequests)}
            enrolmentId={enrolmentId}
          />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
