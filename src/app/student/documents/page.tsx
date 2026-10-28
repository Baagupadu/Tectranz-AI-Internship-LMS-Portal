import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, toPlain } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { DocumentsClient } from './DocumentsClient';

export const dynamic = 'force-dynamic';

export default async function StudentDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const enrolmentId = user.enrolmentId || 1;

  const documents = db.prepare(`
    SELECT * FROM documents WHERE enrolment_id = ? ORDER BY id ASC
  `).all(enrolmentId) as Array<{
    id: number;
    doc_type: string;
    title: string;
    file_path: string;
    file_size_bytes: number;
    mime_type: string;
    created_at: string;
  }>;

  // Check if certificate is issued
  const certificate = db.prepare(`
    SELECT * FROM certificates WHERE enrolment_id = ?
  `).get(enrolmentId) as {
    certificate_id: string;
    status: string;
    issue_date: string;
    qr_code_data: string;
    completion_grade: string;
    track_name: string;
  } | undefined;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">SECURE VAULT</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Document Centre & Credentials
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Download official receipts, enrolment confirmations, partner placement offer letters, and verifiable completion certificates.
            </p>
          </div>

          <DocumentsClient
            documents={toPlain(documents)}
            certificate={certificate ? toPlain(certificate) : null}
          />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
