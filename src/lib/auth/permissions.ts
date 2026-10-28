import { SessionUser } from './session';
import { getDb } from '@/lib/db/connection';

export class ForbiddenError extends Error {
  constructor(message = 'Access denied: insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function assertRole(user: SessionUser | null, allowedRoles: string[]): void {
  if (!user) {
    throw new ForbiddenError('Authentication required');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(`Role ${user.role} is not authorized for this operation`);
  }
}

/**
 * Validates object-level access:
 * Students can only access their own enrolment ID.
 * Mentors can access enrolments in their assigned cohorts.
 * Admins can access all enrolments.
 */
export function assertEnrolmentAccess(user: SessionUser, enrolmentId: number): void {
  if (user.role === 'admin') return;

  if (user.role === 'student') {
    if (user.enrolmentId !== enrolmentId) {
      throw new ForbiddenError('Access denied: You can only view your own records');
    }
    return;
  }

  if (user.role === 'mentor') {
    const db = getDb();
    const enrolment = db.prepare(`
      SELECT e.id FROM enrolments e
      JOIN cohorts c ON e.cohort_id = c.id
      WHERE e.id = ? AND (e.assigned_mentor_id = ? OR c.lead_mentor_id = ?)
    `).get(enrolmentId, user.id, user.id);

    if (!enrolment) {
      throw new ForbiddenError('Access denied: This student is not in your assigned cohort');
    }
    return;
  }

  if (user.role === 'supervisor' || user.role === 'finance') {
    return;
  }

  throw new ForbiddenError('Access denied to this student enrolment');
}

/**
 * Validates project review access:
 * Reviewer must be assigned to partner organisation or admin.
 */
export function assertProjectReviewAccess(user: SessionUser, projectId: number): void {
  if (user.role === 'admin') return;

  if (user.role === 'reviewer' || user.role === 'mentor') {
    const db = getDb();
    const project = db.prepare(`
      SELECT sp.id FROM student_projects sp
      WHERE sp.id = ? AND (sp.mentor_id = ? OR sp.partner_id IS NOT NULL)
    `).get(projectId, user.id);

    if (!project) {
      throw new ForbiddenError('Access denied: You are not assigned to review this project');
    }
    return;
  }

  throw new ForbiddenError('Access denied: Reviewer permissions required');
}
