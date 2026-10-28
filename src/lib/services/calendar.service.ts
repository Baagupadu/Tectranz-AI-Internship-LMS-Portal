import { getDb } from '@/lib/db/connection';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  category: 'class' | 'office_hours' | 'assignment_due' | 'milestone_due' | 'review';
  meetingLink?: string;
  isRequired: boolean;
}

export class CalendarService {
  /**
   * Fetch all calendar items for an enrolment
   */
  static getEvents(enrolmentId: number): CalendarEvent[] {
    const db = getDb();
    const enrolment = db.prepare('SELECT cohort_id FROM enrolments WHERE id = ?').get(enrolmentId) as { cohort_id: number } | undefined;
    if (!enrolment) return [];

    const cohortId = enrolment.cohort_id;
    const events: CalendarEvent[] = [];

    // 1. Live sessions
    const sessions = db.prepare(`
      SELECT * FROM live_sessions WHERE cohort_id = ? ORDER BY scheduled_start ASC
    `).all(cohortId) as Array<{
      id: number;
      title: string;
      session_type: string;
      scheduled_start: string;
      scheduled_end: string;
      meeting_link: string;
      is_required: number;
    }>;

    for (const s of sessions) {
      events.push({
        id: `sess-${s.id}`,
        title: s.title,
        description: `Session type: ${s.session_type}. ${s.is_required ? '[Mandatory Attendance]' : '[Optional Attendance]'}`,
        start: s.scheduled_start,
        end: s.scheduled_end,
        category: s.session_type === 'office_hours' ? 'office_hours' : 'class',
        meetingLink: s.meeting_link,
        isRequired: s.is_required === 1,
      });
    }

    // 2. Assignment due dates
    const assignments = db.prepare(`
      SELECT * FROM assignments WHERE cohort_id = ? ORDER BY due_date ASC
    `).all(cohortId) as Array<{
      id: number;
      title: string;
      description: string;
      due_date: string;
    }>;

    for (const a of assignments) {
      const dueDate = new Date(a.due_date);
      const startDate = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hr block for deadline reminder
      events.push({
        id: `assign-${a.id}`,
        title: `[Deadline] ${a.title}`,
        description: a.description,
        start: startDate.toISOString(),
        end: dueDate.toISOString(),
        category: 'assignment_due',
        isRequired: true,
      });
    }

    // 3. Project milestones
    const milestones = db.prepare(`
      SELECT pm.*, sp.title as project_title FROM project_milestones pm
      JOIN student_projects sp ON pm.student_project_id = sp.id
      WHERE sp.enrolment_id = ?
      ORDER BY pm.due_date ASC
    `).all(enrolmentId) as Array<{
      id: number;
      title: string;
      due_date: string;
      project_title: string;
    }>;

    for (const m of milestones) {
      const dueDate = new Date(m.due_date);
      const startDate = new Date(dueDate.getTime() - 60 * 60 * 1000);
      events.push({
        id: `milestone-${m.id}`,
        title: `[Milestone] ${m.title}`,
        description: `Deliverable for project: ${m.project_title}`,
        start: startDate.toISOString(),
        end: dueDate.toISOString(),
        category: 'milestone_due',
        isRequired: true,
      });
    }

    return events;
  }

  /**
   * Format an ISO date to iCalendar UTC format (e.g., 20261028T123000Z)
   */
  private static formatIcsDate(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Generate standard RFC 5545 iCalendar string
   */
  static generateIcsFeed(enrolmentId: number): string {
    const events = this.getEvents(enrolmentId);

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tectranz//Tectranz AI Internships LMS//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Tectranz Internship Schedule',
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    for (const e of events) {
      ics.push(
        'BEGIN:VEVENT',
        `UID:${e.id}@tectranz.com`,
        `DTSTAMP:${this.formatIcsDate(new Date().toISOString())}`,
        `DTSTART:${this.formatIcsDate(e.start)}`,
        `DTEND:${this.formatIcsDate(e.end)}`,
        `SUMMARY:${e.title.replace(/[,;]/g, ' ')}`,
        `DESCRIPTION:${e.description.replace(/[,;]/g, ' ')}`,
        e.meetingLink ? `LOCATION:${e.meetingLink}` : '',
        'END:VEVENT'
      );
    }

    ics.push('END:VCALENDAR');
    return ics.filter(Boolean).join('\r\n');
  }
}
