import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.enrolmentId) {
      return NextResponse.json({ error: 'Unauthorized or active enrolment missing' }, { status: 401 });
    }

    const { logDate, activityCategory, durationMinutes, learningOutcome, blockers, evidenceUrl } = await req.json();

    if (!logDate || !activityCategory || !durationMinutes || !learningOutcome) {
      return NextResponse.json({ error: 'Date, category, duration, and learning outcome are required' }, { status: 400 });
    }

    const db = getDb();
    const res = db.prepare(`
      INSERT INTO activity_logbook (
        enrolment_id, log_date, activity_category, duration_minutes, learning_outcome, blockers, evidence_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
    `).run(
      user.enrolmentId,
      logDate,
      activityCategory,
      Number(durationMinutes),
      learningOutcome,
      blockers || null,
      evidenceUrl || null
    );

    return NextResponse.json({
      success: true,
      logbookId: Number(res.lastInsertRowid),
      message: 'Logbook entry submitted for mentor sign-off.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logbook submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
