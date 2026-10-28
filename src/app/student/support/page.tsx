import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { SupportClient } from './SupportClient';

export const dynamic = 'force-dynamic';

export default async function StudentSupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();

  const tickets = db.prepare(`
    SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC
  `).all(user.id) as Array<{
    id: number;
    category: string;
    subject: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;

  const messages = db.prepare(`
    SELECT sm.*, u.role as sender_role,
           COALESCE(sp.full_name, mp.full_name, u.email) as sender_name
    FROM support_messages sm
    JOIN users u ON sm.sender_id = u.id
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
    JOIN support_tickets st ON sm.ticket_id = st.id
    WHERE st.user_id = ?
    ORDER BY sm.created_at ASC
  `).all(user.id) as Array<{
    id: number;
    ticket_id: number;
    sender_id: number;
    sender_role: string;
    sender_name: string;
    message: string;
    created_at: string;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">MENTOR & TECH DESK</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Academic Helpdesk & Mentor Inquiries
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Ask questions on curriculum architectures, capstone code debugging, attendance verification, or administrative queries.
            </p>
          </div>

          <SupportClient initialTickets={toPlain(tickets)} initialMessages={toPlain(messages)} currentUserId={user.id} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
