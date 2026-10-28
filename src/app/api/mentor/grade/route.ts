import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertRole(user, ['mentor', 'admin']);

    const { submissionId, score, feedback, status } = await req.json();

    if (!submissionId || score === undefined) {
      return NextResponse.json({ error: 'submissionId and score are required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE assignment_submissions
      SET score = ?, reviewer_id = ?, reviewer_feedback = ?, status = ?, graded_at = datetime('now')
      WHERE id = ?
    `).run(Number(score), user!.id, feedback || 'Approved', status || 'graded', Number(submissionId));

    // Notify student
    const studentInfo = db.prepare(`
      SELECT e.user_id, a.title FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN enrolments e ON s.enrolment_id = e.id
      WHERE s.id = ?
    `).get(Number(submissionId)) as { user_id: number; title: string } | undefined;

    if (studentInfo) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, notification_type, action_url)
        VALUES (?, 'Assignment Graded', ?, 'feedback', '/student/tasks')
      `).run(studentInfo.user_id, `Your submission for ${studentInfo.title} was graded: ${score}/100.`);
    }

    return NextResponse.json({ success: true, message: 'Grade and feedback recorded successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Grading failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
