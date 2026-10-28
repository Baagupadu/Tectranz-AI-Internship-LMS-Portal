import { getDb, withTransaction } from '@/lib/db/connection';

export interface AttendanceSummary {
  enrolmentId: number;
  totalConductedSessions: number;
  mandatoryConductedSessions: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendancePercentage: number;
  isEligibleUnderPolicy: boolean;
  minAttendanceRequiredPercent: number;
  hoursBreakdown: {
    liveSessionHours: number;
    recordedLessonHours: number;
    logbookApprovedHours: number;
    totalApprovedEngagementHours: number;
    minRequiredHours: number;
    isHoursEligible: boolean;
  };
}

export class AttendanceService {
  /**
   * Calculate comprehensive attendance and engagement hours for an enrolment.
   * Accurately factors in:
   * 1. Cancelled sessions are excluded from denominator.
   * 2. Optional sessions (is_required = 0) do not penalize if missed.
   * 3. Excused absences count towards eligible attendance.
   * 4. Late attendance counts proportionally (75%).
   */
  static getAttendanceSummary(enrolmentId: number): AttendanceSummary {
    const db = getDb();

    // Fetch cohort policy requirements
    const policy = db.prepare(`
      SELECT pv.min_attendance_percent, pv.min_engagement_hours
      FROM enrolments e
      JOIN policy_versions pv ON e.policy_version_id = pv.id
      WHERE e.id = ?
    `).get(enrolmentId) as { min_attendance_percent: number; min_engagement_hours: number } | undefined;

    const minAttendanceRequired = policy ? policy.min_attendance_percent : 75.0;
    const minEngagementRequired = policy ? policy.min_engagement_hours : 120.0;

    // Get live session attendance statistics
    // Filter for conducted sessions (status = 'completed')
    const records = db.prepare(`
      SELECT 
        ar.status as attendance_status,
        ls.is_required,
        ls.scheduled_start,
        ls.scheduled_end,
        ls.status as session_status
      FROM live_sessions ls
      JOIN enrolments e ON e.cohort_id = ls.cohort_id
      LEFT JOIN attendance_records ar ON ar.live_session_id = ls.id AND ar.enrolment_id = e.id
      WHERE e.id = ? AND ls.status = 'completed'
    `).all(enrolmentId) as Array<{
      attendance_status: string | null;
      is_required: number;
      scheduled_start: string;
      scheduled_end: string;
      session_status: string;
    }>;

    let totalConductedSessions = records.length;
    let mandatoryConductedSessions = 0;
    let presentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let absentCount = 0;
    let liveSessionMinutes = 0;

    for (const r of records) {
      if (r.is_required === 1) {
        mandatoryConductedSessions++;
      }

      if (r.attendance_status === 'present') {
        presentCount++;
        // Calculate minutes
        const dur = (new Date(r.scheduled_end).getTime() - new Date(r.scheduled_start).getTime()) / (1000 * 60);
        liveSessionMinutes += isNaN(dur) || dur <= 0 ? 90 : dur;
      } else if (r.attendance_status === 'late') {
        lateCount++;
        const dur = (new Date(r.scheduled_end).getTime() - new Date(r.scheduled_start).getTime()) / (1000 * 60);
        liveSessionMinutes += (isNaN(dur) || dur <= 0 ? 90 : dur) * 0.75;
      } else if (r.attendance_status === 'excused') {
        excusedCount++;
      } else {
        // Missing record or explicit absent on mandatory session
        if (r.is_required === 1) {
          absentCount++;
        }
      }
    }

    // Attendance calculation:
    // (present + excused + 0.75 * late) / mandatoryConductedSessions
    let attendancePercentage = 100.0;
    if (mandatoryConductedSessions > 0) {
      const weightedPresent = presentCount + excusedCount + (lateCount * 0.75);
      attendancePercentage = Math.round((weightedPresent / mandatoryConductedSessions) * 1000) / 10;
    }

    // Recorded lessons hours
    const lessonRow = db.prepare(`
      SELECT SUM(cl.duration_minutes) as total_lesson_mins
      FROM lesson_completions lc
      JOIN curriculum_lessons cl ON lc.lesson_id = cl.id
      WHERE lc.enrolment_id = ? AND lc.status = 'completed'
    `).get(enrolmentId) as { total_lesson_mins: number | null };
    const recordedLessonMinutes = lessonRow && lessonRow.total_lesson_mins ? lessonRow.total_lesson_mins : 0;

    // Approved Logbook hours
    const logbookRow = db.prepare(`
      SELECT SUM(duration_minutes) as total_log_mins
      FROM activity_logbook
      WHERE enrolment_id = ? AND status = 'approved'
    `).get(enrolmentId) as { total_log_mins: number | null };
    const logbookApprovedMinutes = logbookRow && logbookRow.total_log_mins ? logbookRow.total_log_mins : 0;

    const liveSessionHours = Math.round((liveSessionMinutes / 60) * 10) / 10;
    const recordedLessonHours = Math.round((recordedLessonMinutes / 60) * 10) / 10;
    const logbookApprovedHours = Math.round((logbookApprovedMinutes / 60) * 10) / 10;
    const totalApprovedEngagementHours = Math.round((liveSessionHours + recordedLessonHours + logbookApprovedHours) * 10) / 10;

    return {
      enrolmentId,
      totalConductedSessions,
      mandatoryConductedSessions,
      presentCount,
      lateCount,
      excusedCount,
      absentCount,
      attendancePercentage,
      isEligibleUnderPolicy: attendancePercentage >= minAttendanceRequired,
      minAttendanceRequiredPercent: minAttendanceRequired,
      hoursBreakdown: {
        liveSessionHours,
        recordedLessonHours,
        logbookApprovedHours,
        totalApprovedEngagementHours,
        minRequiredHours: minEngagementRequired,
        isHoursEligible: totalApprovedEngagementHours >= minEngagementRequired,
      },
    };
  }

  /**
   * Request attendance correction with audit record
   */
  static submitCorrectionRequest(
    enrolmentId: number,
    attendanceRecordId: number,
    requestedStatus: 'present' | 'excused',
    reason: string,
    evidenceUrl?: string
  ): number {
    const db = getDb();
    const res = db.prepare(`
      INSERT INTO attendance_corrections (
        attendance_record_id, enrolment_id, requested_status, reason, evidence_url, decision
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(attendanceRecordId, enrolmentId, requestedStatus, reason, evidenceUrl || null);

    return Number(res.lastInsertRowid);
  }

  /**
   * Review attendance correction (Mentor or Admin action)
   */
  static reviewCorrectionRequest(
    correctionId: number,
    reviewerId: number,
    decision: 'approved' | 'rejected',
    reviewerNotes: string
  ): void {
    withTransaction((database) => {
      const correction = database.prepare(`
        SELECT * FROM attendance_corrections WHERE id = ?
      `).get(correctionId) as {
        id: number;
        attendance_record_id: number;
        requested_status: string;
      } | undefined;

      if (!correction) {
        throw new Error('Attendance correction request not found');
      }

      database.prepare(`
        UPDATE attendance_corrections 
        SET decision = ?, reviewer_id = ?, reviewer_notes = ?, resolved_at = datetime('now')
        WHERE id = ?
      `).run(decision, reviewerId, reviewerNotes, correctionId);

      if (decision === 'approved') {
        database.prepare(`
          UPDATE attendance_records
          SET status = ?, verified_by_id = ?, notes = ?, marked_at = datetime('now')
          WHERE id = ?
        `).run(
          correction.requested_status,
          reviewerId,
          `Updated via approved correction request #${correctionId}: ${reviewerNotes}`,
          correction.attendance_record_id
        );
      }

      database.prepare(`
        INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata_json)
        VALUES (?, 'ATTENDANCE_CORRECTION_REVIEWED', 'attendance_corrections', ?, ?)
      `).run(reviewerId, String(correctionId), JSON.stringify({ decision, notes: reviewerNotes }));
    });
  }
}
