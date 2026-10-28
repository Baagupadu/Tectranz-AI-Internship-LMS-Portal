import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.enrolmentId) {
      return NextResponse.json({ error: 'Unauthorized or active enrolment missing' }, { status: 401 });
    }

    const { assignmentId, repoUrl, demoUrl, submissionText, fileAttachments } = await req.json();

    if (!assignmentId || (!repoUrl && !submissionText)) {
      return NextResponse.json({ error: 'Repository URL or submission text is required' }, { status: 400 });
    }

    const db = getDb();

    // Check existing submissions to compute next version number
    const countRow = db.prepare(`
      SELECT MAX(version_number) as max_v FROM assignment_submissions
      WHERE assignment_id = ? AND enrolment_id = ?
    `).get(Number(assignmentId), user.enrolmentId) as { max_v: number | null };

    const nextVersion = (countRow && countRow.max_v ? countRow.max_v : 0) + 1;

    const res = db.prepare(`
      INSERT INTO assignment_submissions (
        assignment_id, enrolment_id, version_number, github_repo_url, demo_url,
        submission_text, file_attachments_json, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', datetime('now'))
    `).run(
      Number(assignmentId),
      user.enrolmentId,
      nextVersion,
      repoUrl || null,
      demoUrl || null,
      submissionText || null,
      fileAttachments ? JSON.stringify(fileAttachments) : null
    );

    // Queue notification to cohort lead mentor
    const mentorRow = db.prepare(`
      SELECT c.lead_mentor_id, a.title FROM assignments a
      JOIN cohorts c ON a.cohort_id = c.id
      WHERE a.id = ?
    `).get(Number(assignmentId)) as { lead_mentor_id: number; title: string } | undefined;

    if (mentorRow && mentorRow.lead_mentor_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, notification_type, action_url)
        VALUES (?, 'New Submission Ready for Review', ?, 'info', '/mentor/reviews')
      `).run(mentorRow.lead_mentor_id, `${user.fullName} submitted ${mentorRow.title} (v${nextVersion}).`);
    }

    return NextResponse.json({
      success: true,
      submissionId: Number(res.lastInsertRowid),
      version: nextVersion,
      message: `Assignment submitted successfully (Version ${nextVersion}). Under review by mentor team.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Assignment submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
