'use client';

import React, { useState } from 'react';

interface LogbookEntry {
  id: number;
  log_date: string;
  activity_category: string;
  duration_minutes: number;
  learning_outcome: string;
  blockers: string | null;
  evidence_url: string | null;
  status: string;
  approved_at: string | null;
  approver_name: string | null;
}

interface LogbookClientProps {
  initialEntries: LogbookEntry[];
  enrolmentId: number;
}

export function LogbookClient({ initialEntries, enrolmentId }: LogbookClientProps) {
  const [entries, setEntries] = useState<LogbookEntry[]>(initialEntries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityCategory, setActivityCategory] = useState<'coding' | 'learning' | 'debugging' | 'mentoring' | 'project_work'>('coding');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [learningOutcome, setLearningOutcome] = useState('');
  const [blockers, setBlockers] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const totalMinutes = entries.reduce((acc, curr) => acc + (curr.status === 'approved' ? curr.duration_minutes : 0), 0);
  const totalApprovedHours = Math.round((totalMinutes / 60) * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/student/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate,
          activityCategory,
          durationMinutes,
          learningOutcome,
          blockers,
          evidenceUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast('Logbook entry submitted for mentor approval!');
        const newEntry: LogbookEntry = {
          id: data.logbookId,
          log_date: logDate,
          activity_category: activityCategory,
          duration_minutes: Number(durationMinutes),
          learning_outcome: learningOutcome,
          blockers,
          evidence_url: evidenceUrl,
          status: 'submitted',
          approved_at: null,
          approver_name: null,
        };
        setEntries([newEntry, ...entries]);
        setIsModalOpen(false);
        setLearningOutcome('');
        setBlockers('');
        setEvidenceUrl('');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
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

      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-sand)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-ink)' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>APPROVED LOGBOOK HOURS: </span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--color-iris)' }}>{totalApprovedHours} Hours</strong>
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-volt">
          + Add Daily Logbook Entry
        </button>
      </div>

      {/* Logbook Entries Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="tz-card"
            style={{
              padding: '1.25rem 1.5rem',
              borderLeft: `6px solid ${entry.status === 'approved' ? 'var(--color-success)' : 'var(--color-warning)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-sand">{entry.log_date}</span>
                <span className="badge badge-iris">
                  {entry.activity_category.toUpperCase().replace('_', ' ')}
                </span>
                <span className="badge badge-volt">{entry.duration_minutes} MINS ({Math.round((entry.duration_minutes / 60) * 10) / 10}h)</span>
              </div>

              <div>
                {entry.status === 'approved' ? (
                  <span className="badge badge-success">
                    APPROVED BY {entry.approver_name || 'FACULTY'}
                  </span>
                ) : (
                  <span className="badge badge-warning">AWAITING MENTOR SIGN-OFF</span>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
              <strong>Outcome & Accomplishments:</strong> {entry.learning_outcome}
            </p>

            {entry.blockers && (
              <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem' }}>
                <strong>Technical Blockers:</strong> {entry.blockers}
              </p>
            )}

            {entry.evidence_url && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}>
                <a
                  href={entry.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-iris)', fontWeight: 700 }}
                >
                  🔗 View Code Commit / Pull Request Evidence ↗
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Log Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-volt">RECORD ENGINEERING HOURS</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  Log Daily Activity
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
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="logDate">
                    Date of Work *
                  </label>
                  <input
                    id="logDate"
                    type="date"
                    className="form-input"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="durationMinutes">
                    Duration (Minutes) *
                  </label>
                  <input
                    id="durationMinutes"
                    type="number"
                    min="30"
                    max="720"
                    step="30"
                    className="form-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="activityCategory">
                  Activity Category *
                </label>
                <select
                  id="activityCategory"
                  className="form-select"
                  value={activityCategory}
                  onChange={(e) => setActivityCategory(e.target.value as any)}
                >
                  <option value="coding">Coding & Feature Implementation</option>
                  <option value="learning">Curriculum Study & Masterclass</option>
                  <option value="debugging">Benchmarking & Latency Debugging</option>
                  <option value="project_work">Partner Capstone Architecture</option>
                  <option value="mentoring">Mentor Code Audit & Office Hours</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="learningOutcome">
                  Key Technical Outcomes & Work Done *
                </label>
                <textarea
                  id="learningOutcome"
                  rows={3}
                  className="form-textarea"
                  placeholder="Detail the modules, schemas, or models implemented today..."
                  value={learningOutcome}
                  onChange={(e) => setLearningOutcome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="blockers">
                  Blockers or Architecture Questions (Optional)
                </label>
                <input
                  id="blockers"
                  type="text"
                  className="form-input"
                  placeholder="Any rate limit issues, API quirks, or mentor help needed..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evidenceUrl">
                  Evidence Commit Link / Pull Request URL
                </label>
                <input
                  id="evidenceUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/your-username/repo/commit/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
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
                  {submitting ? 'Recording...' : 'Save & Submit Logbook →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
