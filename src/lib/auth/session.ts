import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db/connection';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tectranz-lms-production-secure-secret-key-32chars!!'
);

const SESSION_COOKIE_NAME = 'tectranz_session';

export type UserRole = 'student' | 'mentor' | 'admin' | 'reviewer' | 'supervisor' | 'finance';

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
  enrolmentId?: number;
  registrationId?: string;
  cohortId?: number;
  trackId?: number;
  trackName?: string;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    enrolmentId: user.enrolmentId,
    registrationId: user.registrationId,
    cohortId: user.cohortId,
    trackId: user.trackId,
    trackName: user.trackName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  // Store active session hash in DB for revocation tracking
  const db = getDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, user.id, tokenHash, expiresAt);

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verify session is not revoked in DB
    const db = getDb();
    const session = db.prepare(`
      SELECT s.*, u.is_active 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND u.is_active = 1
    `).get(tokenHash) as { is_active: number } | undefined;

    if (!session) {
      return null;
    }

    return {
      id: Number(payload.id),
      email: String(payload.email),
      role: payload.role as UserRole,
      fullName: String(payload.fullName || ''),
      enrolmentId: payload.enrolmentId ? Number(payload.enrolmentId) : undefined,
      registrationId: payload.registrationId ? String(payload.registrationId) : undefined,
      cohortId: payload.cohortId ? Number(payload.cohortId) : undefined,
      trackId: payload.trackId ? Number(payload.trackId) : undefined,
      trackName: payload.trackName ? String(payload.trackName) : undefined,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDb();
    db.prepare(`
      UPDATE sessions SET revoked_at = datetime('now') WHERE token_hash = ?
    `).run(tokenHash);
  }
}

export function getUserFullDetails(userId: number): SessionUser | null {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.email, u.role,
      COALESCE(sp.full_name, mp.full_name, u.email) as full_name,
      e.id as enrolment_id,
      e.registration_id,
      e.cohort_id,
      c.track_id,
      t.name as track_name
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
    LEFT JOIN enrolments e ON e.user_id = u.id AND e.status IN ('active', 'completed')
    LEFT JOIN cohorts c ON e.cohort_id = c.id
    LEFT JOIN tracks t ON c.track_id = t.id
    WHERE u.id = ? AND u.is_active = 1
    ORDER BY e.id DESC
    LIMIT 1
  `).get(userId) as {
    id: number;
    email: string;
    role: UserRole;
    full_name: string;
    enrolment_id?: number;
    registration_id?: string;
    cohort_id?: number;
    track_id?: number;
    track_name?: string;
  } | undefined;

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
    enrolmentId: user.enrolment_id,
    registrationId: user.registration_id,
    cohortId: user.cohort_id,
    trackId: user.track_id,
    trackName: user.track_name,
  };
}
