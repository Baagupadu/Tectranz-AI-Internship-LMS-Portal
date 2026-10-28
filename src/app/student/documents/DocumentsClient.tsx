'use client';

import React from 'react';
import Link from 'next/link';

interface DocumentRecord {
  id: number;
  doc_type: string;
  title: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
}

interface CertificateRecord {
  certificate_id: string;
  status: string;
  issue_date: string;
  qr_code_data: string;
  completion_grade: string;
  track_name: string;
}

interface DocumentsClientProps {
  documents: DocumentRecord[];
  certificate?: CertificateRecord | null;
}

export function DocumentsClient({ documents, certificate }: DocumentsClientProps) {
  return (
    <div>
      {/* Certificate Banner (if issued) */}
      {certificate ? (
        <div
          className="tz-card"
          style={{
            backgroundColor: 'var(--color-sand)',
            border: '3px solid var(--color-ink)',
            boxShadow: 'var(--shadow-pop-lg)',
            padding: '2.5rem 2rem',
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-volt">GRADUATION CREDENTIAL ISSUED</span>
              <span className="badge badge-iris">{certificate.certificate_id}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              Official Certificate of Completion & Industry Verification
            </h2>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Awarded: <strong>{certificate.completion_grade}</strong> · Track: {certificate.track_name} · Issued: {certificate.issue_date}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/verify/${certificate.certificate_id}`}
              className="btn btn-volt"
              target="_blank"
            >
              🔍 View Public QR Verification Page ↗
            </Link>
            <button
              onClick={() => window.print()}
              className="btn btn-outline"
            >
              📥 Download Certificate PDF
            </button>
          </div>
        </div>
      ) : (
        <div
          className="tz-card"
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem 2rem',
            marginBottom: '2.5rem',
            borderLeft: '6px solid var(--color-iris)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Certificate Pending Final Completion</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-muted)', marginTop: '0.3rem' }}>
            Your certificate is locked until all 5 institutional policy gates (Attendance &ge; 75%, 120 Hours, Capstone Defense & Viva, and 4 approved reports) are verified by the faculty board.
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <Link href="/student/dashboard" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-iris)' }}>
              Check Completion Gate Progress →
            </Link>
          </div>
        </div>
      )}

      {/* Document Repository List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Official Programme Records</h3>

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="tz-card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-sand)',
                  border: '2px solid var(--color-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                }}
              >
                📄
              </div>
              <div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-sand">
                    {doc.doc_type.toUpperCase().replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                    {Math.round(doc.file_size_bytes / 1024)} KB · PDF
                  </span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{doc.title}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  Generated: {doc.created_at.split(' ')[0]}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm"
            >
              📥 Download Document
            </button>
          </div>
        ))}
      </div>

      {/* Academic Credit Guidance Note */}
      <div
        style={{
          marginTop: '3rem',
          backgroundColor: 'var(--color-sand)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--color-ink)',
          fontSize: '0.82rem',
          color: 'var(--color-ink-muted)',
          lineHeight: 1.5,
        }}
      >
        <strong>Institutional Academic Credit Disclosure:</strong> Tectranz programmes are designed according to the UGC & AICTE National Credit Framework (NCrF) guidelines for 3 to 4 credits (60–120 hours minimum engagement). Credit conversion is granted by the student’s degree-granting university or autonomous institution based on the verified completion docket and defended viva report provided herein.
      </div>
    </div>
  );
}
