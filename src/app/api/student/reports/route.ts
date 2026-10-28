import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';
import { AttendanceService } from '@/lib/services/attendance.service';
import { ScorecardService } from '@/lib/services/scorecard.service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.enrolmentId) {
      return NextResponse.json({ error: 'Unauthorized or active enrolment missing' }, { status: 401 });
    }

    const { reportType, periodStart, periodEnd, summaryText, challengesText, plannedNextText } = await req.json();

    if (!reportType || !periodStart || !periodEnd || !summaryText) {
      return NextResponse.json({ error: 'Report type, date bounds, and summary are required' }, { status: 400 });
    }

    // Freeze snapshot of current verified metrics
    const attendance = AttendanceService.getAttendanceSummary(user.enrolmentId);
    const evaluation = ScorecardService.evaluateCompletion(user.enrolmentId);

    const snapshot = {
      attendancePercentage: attendance.attendancePercentage,
      approvedEngagementHours: attendance.hoursBreakdown.totalApprovedEngagementHours,
      currentGradeScore: evaluation.completionScore,
      submittedAt: new Date().toISOString(),
      studentName: user.fullName,
      registrationId: user.registrationId,
    };

    const db = getDb();
    const res = db.prepare(`
      INSERT INTO periodic_reports (
        enrolment_id, report_type, period_start, period_end, summary_text, challenges_text, planned_next_text,
        metrics_snapshot_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
    `).run(
      user.enrolmentId,
      reportType,
      periodStart,
      periodEnd,
      summaryText,
      challengesText || null,
      plannedNextText || null,
      JSON.stringify(snapshot)
    );

    return NextResponse.json({
      success: true,
      reportId: Number(res.lastInsertRowid),
      message: `${reportType.toUpperCase()} progress report submitted with verified data snapshot.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Report generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
