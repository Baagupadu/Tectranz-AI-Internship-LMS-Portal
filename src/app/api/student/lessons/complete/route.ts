import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.enrolmentId) {
      return NextResponse.json({ error: 'Unauthorized or active enrolment missing' }, { status: 401 });
    }

    const { lessonId, progressSeconds, evidenceText } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO lesson_completions (enrolment_id, lesson_id, status, progress_seconds, completion_evidence, completed_at)
      VALUES (?, ?, 'completed', ?, ?, datetime('now'))
      ON CONFLICT(enrolment_id, lesson_id) DO UPDATE SET
        status = 'completed',
        progress_seconds = excluded.progress_seconds,
        completion_evidence = excluded.completion_evidence,
        completed_at = datetime('now')
    `).run(user.enrolmentId, Number(lessonId), Number(progressSeconds || 2700), evidenceText || 'Completed');

    return NextResponse.json({ success: true, message: 'Lesson completion recorded' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record completion';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
