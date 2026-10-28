import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/connection';
import { createSessionToken, getUserFullDetails } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) as {
      id: number;
      email: string;
      password_hash: string;
      role: string;
      is_active: number;
    } | undefined;

    if (!user || user.is_active !== 1) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const fullDetails = getUserFullDetails(user.id);
    if (!fullDetails) {
      return NextResponse.json({ error: 'User details could not be resolved' }, { status: 500 });
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
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
