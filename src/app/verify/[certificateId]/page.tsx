import React from 'react';
import Link from 'next/link';
import { CertificateService } from '@/lib/services/certificate.service';
import { getDb } from '@/lib/db/connection';

export const dynamic = 'force-dynamic';

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const verification = CertificateService.verifyCertificatePublic(certificateId);

  // Retrieve QR code data URL if issued
  const db = getDb();
  const certRow = db.prepare('SELECT qr_code_data FROM certificates WHERE certificate_id = ?').get(certificateId) as {
    qr_code_data: string;
  } | undefined;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <header style={{ padding: '1.25rem 2rem', borderBottom: '2px solid var(--color-ink)', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-volt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
              }}
            >
              TZ
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
              Tectranz Credential Registry
            </span>
          </Link>
          <Link href="/login" className="btn btn-volt btn-sm">
            Student Portal →
          </Link>
        </div>
      </header>

      {/* Verification Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '780px' }}>
          
          {verification.valid ? (
            <div className="tz-card" style={{ padding: '3rem 2.5rem', border: '3px solid var(--color-ink)', boxShadow: 'var(--shadow-pop-lg)' }}>
              {/* Authenticity Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--color-ink)', paddingBottom: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-volt)',
                      border: '2px solid var(--color-ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <span className="badge badge-volt">AUTHENTICATED CREDENTIAL</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>
                      Official Certificate Verified
                    </h1>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {verification.certificateId}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                    Registry Status: VALID & ACTIVE
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                      RECIPIENT NAME
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                      {verification.recipientName}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                      SPECIALIZED TRACK
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-iris)' }}>
                      {verification.trackName}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                      INDUSTRY PARTNER CO-SIGNER
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                      🏢 {verification.partnerName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                        ISSUE DATE
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {verification.issueDate}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                        EVALUATION GRADE
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-success)' }}>
                        {verification.completionGrade}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                        ENGAGEMENT HOURS
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        {verification.totalHoursCompleted} Hours
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Presentation */}
                {certRow?.qr_code_data && (
                  <div style={{ textAlign: 'center', backgroundColor: 'var(--color-sand)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-ink)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={certRow.qr_code_data}
                      alt={`Cryptographic QR for ${verification.certificateId}`}
                      style={{ width: '160px', height: '160px', margin: '0 auto', display: 'block', borderRadius: '8px', border: '1px solid var(--color-ink)' }}
                    />
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '0.75rem', color: 'var(--color-ink-muted)' }}>
                      Scan to verify authenticity directly against the Tectranz master ledger.
                    </div>
                  </div>
                )}
              </div>

              {/* UGC & AICTE Academic Note */}
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎓</span>
                  <span>UGC & AICTE Framework Aligned · 3 to 4 Academic Credits Eligible</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  TECTRANZ ACADEMIC COUNCIL &copy; 2026
                </div>
              </div>
            </div>
          ) : (
            <div className="tz-card" style={{ padding: '3rem 2rem', border: '3px solid var(--color-danger)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <span className="badge badge-danger">INVALID / REVOKED CREDENTIAL</span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--color-danger)' }}>
                Verification Failed
              </h1>
              <p style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--color-ink-muted)', maxWidth: '540px', margin: '1rem auto' }}>
                {verification.message}
              </p>
              {verification.revocationReason && (
                <div style={{ backgroundColor: 'var(--color-danger-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', maxWidth: '500px', margin: '1rem auto', textAlign: 'left', fontSize: '0.86rem' }}>
                  <strong>Formal Revocation Note:</strong> {verification.revocationReason}
                </div>
              )}
              <div style={{ marginTop: '2rem' }}>
                <Link href="/" className="btn btn-outline">
                  Return to Portal Home
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
