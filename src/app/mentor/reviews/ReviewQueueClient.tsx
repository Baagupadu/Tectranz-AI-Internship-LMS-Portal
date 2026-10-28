'use client';

import React, { useState } from 'react';

interface SubmissionItem {
  id: number;
  assignment_title: string;
  max_points: number;
  rubric_json: string;
  student_name: string;
  registration_id: string;
  version_number: number;
  github_repo_url: string | null;
  demo_url: string | null;
  submission_text: string | null;
  status: string;
  score: number | null;
  reviewer_feedback: string | null;
  submitted_at: string;
}

export function ReviewQueueClient({ initialSubmissions }: { initialSubmissions: SubmissionItem[] }) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [activeSub, setActiveSub] = useState<SubmissionItem | null>(null);
  const [score, setScore] = useState<number>(90);
  const [decision, setDecision] = useState<'graded' | 'changes_requested'>('graded');
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleOpenGradeModal = (sub: SubmissionItem) => {
    setActiveSub(sub);
    setScore(sub.score !== null ? sub.score : 85);
    setDecision(sub.status === 'changes_requested' ? 'changes_requested' : 'graded');
    setFeedback(sub.reviewer_feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/mentor/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeSub.id,
          score,
          feedback,
          status: decision,
        }),
      });

      if (res.ok) {
        setToast(`Evaluation published! Score ${score}/100 sent to ${activeSub.student_name}.`);
        setSubmissions(
          submissions.map((s) =>
            s.id === activeSub.id
              ? { ...s, score, status: decision, reviewer_feedback: feedback }
              : s
          )
        );
        setActiveSub(null);
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

      {/* Review Queue Table */}
      <div className="tz-card">
        <div className="tz-table-wrapper">
          <table className="tz-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Version</th>
                <th>Repository & Demo</th>
                <th>Current Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 800 }}>{sub.student_name}</div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                      {sub.registration_id}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{sub.assignment_title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                      Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-sand">v{sub.version_number}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {sub.github_repo_url && (
                        <a href={sub.github_repo_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          Code ↗
                        </a>
                      )}
                      {sub.demo_url && (
                        <a href={sub.demo_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          Demo ↗
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        sub.status === 'graded'
                          ? 'badge-success'
                          : sub.status === 'changes_requested'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {sub.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {sub.score !== null ? (
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--color-success)' }}>
                        {sub.score} / {sub.max_points}
                      </strong>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Pending</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenGradeModal(sub)}
                      className="btn btn-volt btn-sm"
                    >
                      {sub.status === 'graded' ? 'Update Grade' : 'Score & Review →'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Modal Dialog */}
      {activeSub && (
        <div className="modal-overlay" onClick={() => setActiveSub(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-volt">EVALUATION RUBRIC AUDIT</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  Grade Submission: {activeSub.student_name}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)' }}>
                  {activeSub.assignment_title} (Iteration v{activeSub.version_number})
                </p>
              </div>
              <button
                onClick={() => setActiveSub(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrade}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="evalScore">
                    Awarded Score (0 to {activeSub.max_points}) *
                  </label>
                  <input
                    id="evalScore"
                    type="number"
                    min="0"
                    max={activeSub.max_points}
                    className="form-input"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="evalDecision">
                    Review Decision *
                  </label>
                  <select
                    id="evalDecision"
                    className="form-select"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                  >
                    <option value="graded">Approve & Publish Grade</option>
                    <option value="changes_requested">Request Code Changes (Re-submit)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evalFeedback">
                  Detailed Feedback & Rubric Remarks *
                </label>
                <textarea
                  id="evalFeedback"
                  rows={4}
                  className="form-textarea"
                  placeholder="Provide line-by-line feedback on schema handling, latency bottlenecks, test coverage, and code hygiene..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveSub(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-volt"
                >
                  {submitting ? 'Recording Grade...' : 'Publish Official Evaluation →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
