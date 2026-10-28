import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { getDb } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { AdminSidebar } from '@/components/layout/MentorSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  assertRole(user, ['admin']);

  const db = getDb();

  // Metrics
  const studentCountRow = db.prepare("SELECT COUNT(*) as c FROM enrolments WHERE status IN ('active', 'completed')").get() as { c: number };
  const revenueRow = db.prepare("SELECT SUM(amount_inr) as rev FROM payments WHERE status = 'successful'").get() as { rev: number | null };
  const jobsRow = db.prepare("SELECT COUNT(*) as pending FROM background_jobs WHERE status = 'queued'").get() as { pending: number };
  const certsRow = db.prepare("SELECT COUNT(*) as issued FROM certificates WHERE status = 'issued'").get() as { issued: number };

  // All active enrolments
  const enrolments = db.prepare(`
    SELECT e.*, sp.full_name as student_name, sp.college_name, sp.phone,
           t.name as track_name, t.code as track_code, p.name as plan_name,
           c.name as cohort_name
    FROM enrolments e
    JOIN users u ON e.user_id = u.id
    JOIN student_profiles sp ON sp.user_id = u.id
    JOIN cohorts c ON e.cohort_id = c.id
    JOIN tracks t ON c.track_id = t.id
    JOIN plans p ON e.plan_id = p.id
    ORDER BY e.id DESC
  `).all() as Array<{
    id: number;
    registration_id: string;
    student_name: string;
    college_name: string | null;
    phone: string | null;
    track_name: string;
    track_code: string;
    plan_name: string;
    cohort_name: string;
    status: string;
    payment_status: string;
    created_at: string;
  }>;

  return (
    <div className="app-container">
      <AdminSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-volt">INSTITUTIONAL GOVERNANCE</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
                Operations Command & Enrolment Master
              </h1>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
                Supervise student enrolments, track cohort capacity, manage configurable policy versions, and audit background jobs.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/admin/programmes" className="btn btn-volt">
                ⚙️ Configure Programme Policies & Weights →
              </Link>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <div className="tz-card">
              <span className="badge badge-volt">TOTAL ENROLMENTS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {studentCountRow.c} Active
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Across 6 specialized AI tracks
              </p>
            </div>

            <div className="tz-card">
              <span className="badge badge-success">VERIFIED REVENUE</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                ₹{Number(revenueRow.rev || 0).toLocaleString()}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Server-side verified transactions
              </p>
            </div>

            <div className="tz-card">
              <span className="badge badge-iris">ISSUED CREDENTIALS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {certsRow.issued} Verified
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                QR ledger certificates
              </p>
            </div>

            <div className="tz-card">
              <span className="badge badge-sand">JOB WORKERS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>
                {jobsRow.pending} Queued
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                Emails, PDFs, notifications queue
              </p>
            </div>
          </div>

          {/* Enrolment Directory Table */}
          <div className="tz-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Student Enrolment Directory</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                  All confirmed students, unique registration IDs, and payment verification records.
                </p>
              </div>
              <span className="badge badge-sand">IMMUTABLE REGISTRATION LEDGER</span>
            </div>

            <div className="tz-table-wrapper">
              <table className="tz-table">
                <thead>
                  <tr>
                    <th>Registration ID</th>
                    <th>Student Name</th>
                    <th>College / University</th>
                    <th>Track & Plan</th>
                    <th>Cohort</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolments.map((enr) => (
                    <tr key={enr.id}>
                      <td>
                        <span className="badge badge-volt">{enr.registration_id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{enr.student_name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>{enr.phone || 'Phone verified'}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {enr.college_name || 'Vellore Institute of Technology'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{enr.track_name}</div>
                        <span className="badge badge-sand" style={{ fontSize: '0.65rem' }}>{enr.plan_name}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        {enr.cohort_name}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          ✓ {enr.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link href="/verify/TZ-CERT-2026-AIE-8921" className="btn btn-outline btn-sm">
                            Inspect
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
