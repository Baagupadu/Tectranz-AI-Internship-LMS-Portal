'use client';

import React, { useState } from 'react';

interface SessionRecord {
  session_id: number;
  title: string;
  session_type: string;
  scheduled_start: string;
  scheduled_end: string;
  is_required: number;
  record_id: number | null;
  attendance_status: string | null;
  attendance_notes: string | null;
  marked_at: string | null;
  verified_by_name: string | null;
}

interface CorrectionRequest {
  id: number;
  session_title: string;
  requested_status: string;
  reason: string;
  evidence_url: string | null;
  decision: string;
  reviewer_notes: string | null;
  resolved_at: string | null;
  reviewer_name: string | null;
}

interface AttendanceCorrectionClientProps {
  records: SessionRecord[];
  corrections: CorrectionRequest[];
  enrolmentId: number;
}

export function AttendanceCorrectionClient({ records, corrections, enrolmentId }: AttendanceCorrectionClientProps) {
  const [activeCorrectionRecord, setActiveCorrectionRecord] = useState<SessionRecord | null>(null);
  const [requestedStatus, setRequestedStatus] = useState<'present' | 'excused'>('present');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [localCorrections, setLocalCorrections] = useState<CorrectionRequest[]>(corrections);

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCorrectionRecord || !activeCorrectionRecord.record_id) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/attendance/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceRecordId: activeCorrectionRecord.record_id,
          requestedStatus,
          reason,
          evidenceUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast('Correction request submitted! An administrator or mentor will review the evidence.');
        const newReq: CorrectionRequest = {
          id: data.correctionId,
          session_title: activeCorrectionRecord.title,
          requested_status: requestedStatus,
          reason,
          evidence_url: evidenceUrl,
          decision: 'pending',
          reviewer_notes: null,
          resolved_at: null,
          reviewer_name: null,
        };
        setLocalCorrections([newReq, ...localCorrections]);
        setActiveCorrectionRecord(null);
        setReason('');
        setEvidenceUrl('');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-volt)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-volt)',
            boxShadow: 'var(--shadow-pop)',
            fontWeight: 700,
            zIndex: 1000,
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* Sessions Table Card */}
      <div className="tz-card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Conducted Sessions Ledger</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
              Individual verification records marked by faculty.
            </p>
          </div>
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
            Tamper-proof Server Verification
          </span>
        </div>

        <div className="tz-table-wrapper">
          <table className="tz-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Session Title</th>
                <th>Classification</th>
                <th>Status</th>
                <th>Verified By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const date = new Date(r.scheduled_start);
                const isPresent = r.attendance_status === 'present';
                const isLate = r.attendance_status === 'late';
                const isExcused = r.attendance_status === 'excused';

                return (
                  <tr key={r.session_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.title}</div>
                      {r.attendance_notes && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                          {r.attendance_notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-sand">
                        {r.session_type.toUpperCase().replace('_', ' ')}
                      </span>
                      {r.is_required === 1 && (
                        <span className="badge badge-iris" style={{ marginLeft: '0.3rem' }}>
                          MANDATORY
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          isPresent
                            ? 'badge-success'
                            : isLate
                            ? 'badge-warning'
                            : isExcused
                            ? 'badge-iris'
                            : 'badge-danger'
                        }`}
                      >
                        {r.attendance_status ? r.attendance_status.toUpperCase() : 'ABSENT'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {r.verified_by_name || 'Dr. Vikramaditya Sen'}
                    </td>
                    <td>
                      {r.record_id && (
                        <button
                          onClick={() => setActiveCorrectionRecord(r)}
                          className="btn btn-outline btn-sm"
                        >
                          Request Correction
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Appeals & Correction Requests History */}
      {localCorrections.length > 0 && (
        <div className="tz-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
            Correction Requests & Faculty Audit Trail
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {localCorrections.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-ink)',
                  backgroundColor: req.decision === 'approved' ? 'var(--color-success-bg)' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    Session: {req.session_title}
                  </div>
                  <span
                    className={`badge ${
                      req.decision === 'approved'
                        ? 'badge-success'
                        : req.decision === 'rejected'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    {req.decision.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                  <strong>Student Appeal:</strong> {req.reason} (Requested: {req.requested_status.toUpperCase()})
                </div>
                {req.reviewer_notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--color-line)' }}>
                    <strong>Faculty Decision:</strong> {req.reviewer_notes} ({req.reviewer_name || 'Director'})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      {activeCorrectionRecord && (
        <div className="modal-overlay" onClick={() => setActiveCorrectionRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-volt">AUDITED CORRECTION</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  Attendance Correction Appeal
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)' }}>
                  Session: {activeCorrectionRecord.title}
                </p>
              </div>
              <button
                onClick={() => setActiveCorrectionRecord(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection}>
              <div className="form-group">
                <label className="form-label" htmlFor="requestedStatus">
                  Requested Status *
                </label>
                <select
                  id="requestedStatus"
                  className="form-select"
                  value={requestedStatus}
                  onChange={(e) => setRequestedStatus(e.target.value as 'present' | 'excused')}
                >
                  <option value="present">Present (Attended with technical join issue)</option>
                  <option value="excused">Excused (Approved college exam / medical leaves)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reason">
                  Reason & Explanation *
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  className="form-textarea"
                  placeholder="Detail your technical or academic justification..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evidenceUrl">
                  Verification Evidence Link (Google Drive / GitHub Commit / Screenshot URL)
                </label>
                <input
                  id="evidenceUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveCorrectionRecord(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-volt"
                >
                  {submitting ? 'Submitting Appeal...' : 'Submit to Faculty Board →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
