import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, category, subject, message, priority } = await req.json();

    const db = getDb();

    if (ticketId) {
      // Replying to existing ticket
      db.prepare(`
        INSERT INTO support_messages (ticket_id, sender_id, message)
        VALUES (?, ?, ?)
      `).run(Number(ticketId), user.id, message);

      db.prepare(`
        UPDATE support_tickets SET updated_at = datetime('now') WHERE id = ?
      `).run(Number(ticketId));

      return NextResponse.json({ success: true, message: 'Message added to ticket thread.' });
    }

    // Creating new ticket
    if (!category || !subject || !message) {
      return NextResponse.json({ error: 'Category, subject, and message are required' }, { status: 400 });
    }

    const res = db.prepare(`
      INSERT INTO support_tickets (user_id, enrolment_id, category, subject, priority, status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `).run(user.id, user.enrolmentId || null, category, subject, priority || 'medium');

    const newTicketId = Number(res.lastInsertRowid);

    db.prepare(`
      INSERT INTO support_messages (ticket_id, sender_id, message)
      VALUES (?, ?, ?)
    `).run(newTicketId, user.id, message);

    return NextResponse.json({
      success: true,
      ticketId: newTicketId,
      message: 'Support ticket opened. A mentor or support engineer will respond shortly.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Support ticket action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
