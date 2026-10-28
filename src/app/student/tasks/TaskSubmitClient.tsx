'use client';

import React, { useState } from 'react';

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  rubric_json: string;
  max_points: number;
  due_date: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  version_number: number;
  github_repo_url: string | null;
  demo_url: string | null;
  submission_text: string | null;
  status: string;
  score: number | null;
  reviewer_feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  reviewer_name: string | null;
}

interface TaskSubmitClientProps {
  assignments: Assignment[];
  submissions: Submission[];
}

export function TaskSubmitClient({ assignments, submissions }: TaskSubmitClientProps) {
  const [activeModalAssignment, setActiveModalAssignment] = useState<Assignment | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [localSubmissions, setLocalSubmissions] = useState<Submission[]>(submissions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalAssignment) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: activeModalAssignment.id,
          repoUrl,
          demoUrl,
          submissionText: notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Submitted Version ${data.version}! Queued for mentor review.`);
        // Append locally
        const newSub: Submission = {
          id: data.submissionId,
          assignment_id: activeModalAssignment.id,
          version_number: data.version,
          github_repo_url: repoUrl,
          demo_url: demoUrl,
          submission_text: notes,
          status: 'submitted',
          score: null,
          reviewer_feedback: null,
          submitted_at: new Date().toISOString(),
          graded_at: null,
          reviewer_name: null,
        };
        setLocalSubmissions([newSub, ...localSubmissions]);
        setActiveModalAssignment(null);
        setRepoUrl('');
        setDemoUrl('');
        setNotes('');
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

      {/* Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {assignments.map((assignment) => {
          const assignmentSubs = localSubmissions.filter((s) => s.assignment_id === assignment.id);
          const latestSub = assignmentSubs[0];
          const rubric = JSON.parse(assignment.rubric_json || '{}');

          return (
            <div key={assignment.id} className="tz-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--color-ink)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <span className="badge badge-sand">MAX SCORE: {assignment.max_points} PTS</span>
                    <span className="badge badge-iris">DUE: {assignment.due_date.split(' ')[0]}</span>
                    {latestSub ? (
                      latestSub.status === 'graded' ? (
                        <span className="badge badge-success">GRADED · {latestSub.score}/100</span>
                      ) : (
                        <span className="badge badge-warning">UNDER REVIEW (v{latestSub.version_number})</span>
                      )
                    ) : (
                      <span className="badge badge-danger">NOT SUBMITTED</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{assignment.title}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginTop: '0.3rem' }}>
                    {assignment.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveModalAssignment(assignment);
                    if (latestSub) {
                      setRepoUrl(latestSub.github_repo_url || '');
                      setDemoUrl(latestSub.demo_url || '');
                    }
                  }}
                  className="btn btn-volt"
                >
                  {latestSub ? 'Submit New Version (Resubmit) →' : 'Submit Solution →'}
                </button>
              </div>

              {/* Instructions & Rubrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: '0.4rem' }}>
                    Instructions & Acceptance Criteria:
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-ink)', lineHeight: 1.5, backgroundColor: 'var(--color-sand)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-ink)' }}>
                    {assignment.instructions}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: '0.4rem' }}>
                    Grading Rubric Weights:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {Object.entries(rubric).map(([item, weight]) => (
                      <div
                        key={item}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid var(--color-line)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <span style={{ textTransform: 'capitalize' }}>{item.replace(/_/g, ' ')}</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{String(weight)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Version History Drawer */}
              {assignmentSubs.length > 0 && (
                <div style={{ paddingTop: '1.25rem', borderTop: '1px dashed var(--color-line)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    Submission History ({assignmentSubs.length} Iteration{assignmentSubs.length > 1 ? 's' : ''}):
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {assignmentSubs.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid var(--color-ink)',
                          backgroundColor: sub.status === 'graded' ? 'var(--color-success-bg)' : '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                            Version {sub.version_number} · Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                          </span>
                          {sub.status === 'graded' ? (
                            <span className="badge badge-success">Score: {sub.score}/100</span>
                          ) : (
                            <span className="badge badge-warning">Awaiting Mentor Review</span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {sub.github_repo_url && (
                            <a href={sub.github_repo_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-iris)', fontWeight: 700 }}>
                              GitHub Repository ↗
                            </a>
                          )}
                          {sub.demo_url && (
                            <a href={sub.demo_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-iris)', fontWeight: 700 }}>
                              Live Deployment ↗
                            </a>
                          )}
                        </div>

                        {sub.reviewer_feedback && (
                          <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.85rem', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--color-line)', fontSize: '0.82rem' }}>
                            <strong>Reviewer Remark:</strong> {sub.reviewer_feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission Modal Dialog */}
      {activeModalAssignment && (
        <div className="modal-overlay" onClick={() => setActiveModalAssignment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-volt">SUBMIT CODE LAB</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  {activeModalAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalAssignment(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="repoUrl">
                  GitHub Repository URL *
                </label>
                <input
                  id="repoUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/your-username/assignment-repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                />
                <span className="form-hint">Must contain README and automated test suite.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="demoUrl">
                  Live Deployment / Streamlit / API URL (Optional)
                </label>
                <input
                  id="demoUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://your-app.fly.dev"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">
                  Technical Architecture Notes & Edge Case Handling
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  className="form-textarea"
                  placeholder="Explain how you addressed chunking trade-offs, schema validations, and error boundaries..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalAssignment(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-volt"
                >
                  {submitting ? 'Submitting to Ledger...' : 'Confirm Submission →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
