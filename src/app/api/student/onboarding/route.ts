import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, collegeName, graduationYear, semester, degreeBranch, githubUrl, linkedinUrl, timezone, consentGiven } = await req.json();

    if (!consentGiven) {
      return NextResponse.json({ error: 'Programme code of conduct consent is mandatory' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE student_profiles
      SET phone = ?, college_name = ?, graduation_year = ?, semester = ?,
          degree_branch = ?, github_url = ?, linkedin_url = ?, timezone = ?,
          consent_signed_at = datetime('now')
      WHERE user_id = ?
    `).run(
      phone || null,
      collegeName || null,
      graduationYear ? Number(graduationYear) : null,
      semester || null,
      degreeBranch || null,
      githubUrl || null,
      linkedinUrl || null,
      timezone || 'Asia/Kolkata',
      user.id
    );

    // Mark onboarding complete on active enrolment
    if (user.enrolmentId) {
      db.prepare(`
        UPDATE enrolments SET onboarding_completed = 1 WHERE id = ?
      `).run(user.enrolmentId);
    }

    return NextResponse.json({ success: true, message: 'Onboarding profile details saved successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Onboarding update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
