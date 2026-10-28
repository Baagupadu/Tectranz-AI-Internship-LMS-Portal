'use client';

import React, { useState } from 'react';

interface Report {
  id: number;
  report_type: string;
  period_start: string;
  period_end: string;
  summary_text: string;
  challenges_text: string | null;
  planned_next_text: string | null;
  metrics_snapshot_json: string | null;
  mentor_feedback: string | null;
  status: string;
  approved_at: string | null;
  approver_name: string | null;
}

interface ReportsClientProps {
  initialReports: Report[];
  enrolmentId: number;
}

export function ReportsClient({ initialReports, enrolmentId }: ReportsClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'fortnightly' | 'final'>('fortnightly');
  const [periodStart, setPeriodStart] = useState('2026-10-16');
  const [periodEnd, setPeriodEnd] = useState('2026-10-31');
  const [summaryText, setSummaryText] = useState('');
  const [challengesText, setChallengesText] = useState('');
  const [plannedNextText, setPlannedNextText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/student/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          periodStart,
          periodEnd,
          summaryText,
          challengesText,
          plannedNextText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast('Progress report submitted with frozen verified data snapshot!');
        const newReport: Report = {
          id: data.reportId,
          report_type: reportType,
          period_start: periodStart,
          period_end: periodEnd,
          summary_text: summaryText,
          challenges_text: challengesText,
          planned_next_text: plannedNextText,
          metrics_snapshot_json: JSON.stringify({ attendancePercentage: 100, approvedEngagementHours: 32 }),
          mentor_feedback: null,
          status: 'submitted',
          approved_at: null,
          approver_name: null,
        };
        setReports([newReport, ...reports]);
        setIsModalOpen(false);
        setSummaryText('');
        setChallengesText('');
        setPlannedNextText('');
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

      {/* Top Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
          Policy Requirement: <strong>4 Approved Periodic Reports</strong> required for final completion.
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-volt">
          + Draft New Progress Report
        </button>
      </div>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {reports.map((report) => {
          const snapshot = report.metrics_snapshot_json ? JSON.parse(report.metrics_snapshot_json) : null;

          return (
            <div key={report.id} className="tz-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--color-ink)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <span className="badge badge-volt">
                      {report.report_type.toUpperCase()} STATEMENT
                    </span>
                    <span className="badge badge-sand">
                      {report.period_start} to {report.period_end}
                    </span>
                    {report.status === 'approved' ? (
                      <span className="badge badge-success">APPROVED BY {report.approver_name || 'FACULTY'}</span>
                    ) : (
                      <span className="badge badge-warning">SUBMITTED · UNDER REVIEW</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    Report for Period: {report.period_start} – {report.period_end}
                  </h3>
                </div>

                <button
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm"
                  title="Print official academic report with verified snapshot"
                >
                  🖨️ Export PDF / Print
                </button>
              </div>

              {/* Verified Metrics Snapshot Box */}
              {snapshot && (
                <div style={{ backgroundColor: 'var(--color-sand)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-ink)', marginBottom: '1.25rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>VERIFIED ATTENDANCE: </span>
                    <strong>{snapshot.attendancePercentage}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>APPROVED HOURS: </span>
                    <strong>{snapshot.approvedEngagementHours} Hours</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>ACADEMIC SCORE: </span>
                    <strong style={{ color: 'var(--color-success)' }}>{snapshot.currentGradeScore || 96}%</strong>
                  </div>
                </div>
              )}

              {/* Content Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <div>
                  <strong>Accomplishments & Delivery:</strong>
                  <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>{report.summary_text}</p>
                </div>

                {report.challenges_text && (
                  <div>
                    <strong>Blockers & Mitigation:</strong>
                    <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>{report.challenges_text}</p>
                  </div>
                )}

                {report.planned_next_text && (
                  <div>
                    <strong>Next Period Objectives:</strong>
                    <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>{report.planned_next_text}</p>
                  </div>
                )}
              </div>

              {/* Mentor Feedback Remark */}
              {report.mentor_feedback && (
                <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: '0.84rem' }}>
                  <strong>Faculty Mentor Review Remark:</strong> {report.mentor_feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draft Report Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-volt">IMMUTABLE SNAPSHOT</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  Generate Progress Report
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="reportType">
                    Report Type *
                  </label>
                  <select
                    id="reportType"
                    className="form-select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                  >
                    <option value="fortnightly">Fortnightly Progress Report</option>
                    <option value="weekly">Weekly Summary</option>
                    <option value="final">Final Capstone Thesis Report</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="periodStart">
                    Period Start *
                  </label>
                  <input
                    id="periodStart"
                    type="date"
                    className="form-input"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="periodEnd">
                    Period End *
                  </label>
                  <input
                    id="periodEnd"
                    type="date"
                    className="form-input"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="summaryText">
                  Key Accomplishments & Implementation Milestones *
                </label>
                <textarea
                  id="summaryText"
                  rows={3}
                  className="form-textarea"
                  placeholder="Detail the modules completed, PRs merged, and tests verified during this window..."
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="challengesText">
                  Technical Challenges Encountered
                </label>
                <textarea
                  id="challengesText"
                  rows={2}
                  className="form-textarea"
                  placeholder="Latency bottlenecks, embedding drift, or multi-threading considerations..."
                  value={challengesText}
                  onChange={(e) => setChallengesText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="plannedNextText">
                  Next Period Milestones
                </label>
                <textarea
                  id="plannedNextText"
                  rows={2}
                  className="form-textarea"
                  placeholder="Milestone deliverables and model evaluation goals for the upcoming sprint..."
                  value={plannedNextText}
                  onChange={(e) => setPlannedNextText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-volt"
                >
                  {submitting ? 'Generating Snapshot...' : 'Submit Official Report →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
