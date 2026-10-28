import React from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db/connection';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const db = getDb();

  const tracks = db.prepare('SELECT * FROM tracks ORDER BY id ASC').all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    duration_weeks: number;
  }>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-paper)' }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--color-volt)', fontWeight: 700 }}>● Tectranz Authenticated Learning Portal.</span>{' '}
        Students who have confirmed payment access their curriculum, partner capstones, and mentor reviews here.
      </div>

      {/* Main Header */}
      <header style={{ borderBottom: '2px solid var(--color-ink)', backgroundColor: '#fff', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-volt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                border: '2px solid var(--color-ink)',
              }}
            >
              TZ
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                Tectranz
              </span>
              <span style={{ marginLeft: '0.5rem', backgroundColor: 'var(--color-volt)', color: 'var(--color-ink)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                ACADEMY LMS
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/verify/TZ-CERT-2026-AIE-8921" className="btn btn-outline btn-sm">
              🔍 Verify Certificate
            </Link>
            {user ? (
              <Link href="/student/dashboard" className="btn btn-volt">
                Go to Dashboard ({user.fullName?.split(' ')[0]}) →
              </Link>
            ) : (
              <Link href="/login" className="btn btn-volt">
                Student Sign In →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
          <span className="badge badge-iris" style={{ marginBottom: '1.25rem' }}>
            POST-PAYMENT STUDENT JOURNEY
          </span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
            The enterprise internship platform where{' '}
            <span style={{ backgroundColor: 'var(--color-volt)', padding: '0 0.4rem', border: '2px solid var(--color-ink)', borderRadius: '6px' }}>
              real AI code gets shipped
            </span>
          </h1>
          <p style={{ marginTop: '1.5rem', fontSize: '1.2rem', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
            Welcome to the Tectranz learning management platform. Manage your 16-week journey: structured modules, live mentor code audits, weekly engagement logbooks, partner company capstones, and QR-verifiable AICTE/UGC credit certificates.
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-volt btn-lg">
              Launch Student Portal →
            </Link>
            <Link href="/verify/TZ-CERT-2026-AIE-8921" className="btn btn-outline btn-lg">
              Sample Credential Verification
            </Link>
          </div>
        </div>

        {/* 6 Track Showcase */}
        <section style={{ marginTop: '5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-volt">SIX SPECIALIZED LINES</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                Active Internship Tracks (16-Week Cohorts)
              </h2>
            </div>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.95rem', maxWidth: '400px' }}>
              Each track is paired with partner engineering teams, structured rubrics, and formal viva defense.
            </p>
          </div>

          <div className="grid-3">
            {tracks.map((t) => (
              <div key={t.id} className="tz-card tz-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-sand)',
                      border: '2px solid var(--color-ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {t.code}
                  </span>
                  <span className="badge badge-sand">{t.duration_weeks} WEEKS</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.75rem' }}>
                  {t.name}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)', lineHeight: 1.5, flex: 1 }}>
                  {t.description}
                </p>
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-iris)' }}>
                    Capstone + Partner Defense
                  </span>
                  <Link href="/login" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                    Access Portal →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Pillars */}
        <section style={{ marginTop: '5rem', backgroundColor: 'var(--color-sand)', border: '2px solid var(--color-ink)', borderRadius: 'var(--radius-xl)', padding: '3rem 2rem', boxShadow: 'var(--shadow-pop)' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', marginBottom: '3rem' }}>
            <span className="badge badge-iris">BUILT FOR RIGOR</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Production Quality Standard
            </h2>
            <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
              Policies, attendance calculation, and project gates are verified on server-side transactions.
            </p>
          </div>

          <div className="grid-3">
            <div className="tz-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Engagement Hours Audit</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                Track live lectures, recorded practical labs, and daily logbooks with mentor verification. Students cannot manipulate approved totals.
              </p>
            </div>

            <div className="tz-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Partner Company Capstones</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                Work on live partner problem statements from Aethelgard AI, Cognitiq Robotics, and NeuralDefense with defended code audits.
              </p>
            </div>

            <div className="tz-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>QR-Verified Certificates</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                Unique certificate IDs and public cryptographic QR verification pages with distinction honors and academic credit alignment.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '2px solid var(--color-ink)', backgroundColor: '#fff', padding: '2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
              Tectranz AI Academy &copy; 2026
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
              Official Authenticated Student Portal · All rights reserved.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.86rem', fontWeight: 600 }}>
            <Link href="/login">Portal Login</Link>
            <Link href="/verify/TZ-CERT-2026-AIE-8921">Public Verification</Link>
            <a href="https://aiintern.tectranz.com" target="_blank" rel="noopener noreferrer">
              Tectranz Public Website ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
