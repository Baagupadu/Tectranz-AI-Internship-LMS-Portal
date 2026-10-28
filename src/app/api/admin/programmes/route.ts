import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertRole(user, ['admin']);

    const { policyId, minAttendancePercent, minEngagementHours, requiredProjectsCount, requiredReportsCount, passingGradePercent } = await req.json();

    if (!policyId) {
      return NextResponse.json({ error: 'policyId is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE policy_versions
      SET min_attendance_percent = ?,
          min_engagement_hours = ?,
          required_projects_count = ?,
          required_reports_count = ?,
          passing_grade_percent = ?
      WHERE id = ?
    `).run(
      Number(minAttendancePercent || 75.0),
      Number(minEngagementHours || 120.0),
      Number(requiredProjectsCount || 2),
      Number(requiredReportsCount || 4),
      Number(passingGradePercent || 60.0),
      Number(policyId)
    );

    db.prepare(`
      INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata_json)
      VALUES (?, 'POLICY_UPDATED', 'policy_versions', ?, ?)
    `).run(user!.id, String(policyId), JSON.stringify({ minAttendancePercent, minEngagementHours, requiredProjectsCount }));

    return NextResponse.json({ success: true, message: 'Policy configuration updated successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Policy update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
