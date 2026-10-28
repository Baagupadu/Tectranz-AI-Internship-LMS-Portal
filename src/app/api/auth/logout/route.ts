import { NextResponse } from 'next/server';
import { revokeCurrentSession, getCurrentUser } from '@/lib/auth/session';

export async function POST() {
  await revokeCurrentSession();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('tectranz_session');
  return response;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
