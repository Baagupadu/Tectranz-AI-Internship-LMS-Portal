import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { createSessionToken, getUserFullDetails } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const { role } = await req.json();

    const db = getDb();
    let query = 'SELECT id FROM users WHERE role = ? AND is_active = 1 LIMIT 1';
    let params: string[] = [role];

    if (role === 'student_graduated') {
      // Pick Riya Verma who has completed requirements & certificate
      query = 'SELECT id FROM users WHERE email = ?';
      params = ['riya.verma@tectranz.com'];
    }

    const targetUser = db.prepare(query).get(...params) as { id: number } | undefined;

    if (!targetUser) {
      return NextResponse.json({ error: `No active demo user found for role ${role}` }, { status: 404 });
    }

    const fullDetails = getUserFullDetails(targetUser.id);
    if (!fullDetails) {
      return NextResponse.json({ error: 'Failed to resolve user details' }, { status: 500 });
    }

    const token = await createSessionToken(fullDetails);

    const response = NextResponse.json({
      success: true,
      user: fullDetails,
    });

    response.cookies.set('tectranz_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Demo switch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
