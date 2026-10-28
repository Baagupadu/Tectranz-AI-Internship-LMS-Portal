'use client';

import React, { useState } from 'react';

interface Phase {
  id: number;
  phase_number: number;
  title: string;
  description: string;
  start_week: number;
  end_week: number;
}

interface Module {
  id: number;
  phase_id: number;
  module_number: number;
  title: string;
  description: string;
  week_number: number;
}

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  lesson_type: string;
  duration_minutes: number;
  video_url: string | null;
  transcript_text: string | null;
  resources_json: string | null;
  order_index: number;
  completion_status: string | null;
  progress_seconds: number | null;
}

interface LearningClientProps {
  phases: Phase[];
  modules: Module[];
  lessons: Lesson[];
  enrolmentId: number;
}

export function LearningClient({ phases, modules, lessons, enrolmentId }: LearningClientProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0] || null);
  const [completionState, setCompletionState] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    lessons.forEach((l) => {
      if (l.completion_status === 'completed') initial[l.id] = true;
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleMarkComplete = async (lessonId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/lessons/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          progressSeconds: 2700,
          evidenceText: 'Watched lesson and completed practical code lab',
        }),
      });

      if (res.ok) {
        setCompletionState((prev) => ({ ...prev, [lessonId]: true }));
        setToast('Lesson marked complete! Engagement hours recorded.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parsedResources = selectedLesson?.resources_json ? JSON.parse(selectedLesson.resources_json) : {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '2rem', alignItems: 'start' }}>
      {/* Toast Notification */}
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

      {/* Main Video / Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Mock/Real Video Player Screen */}
        <div
          style={{
            backgroundColor: '#050414',
            border: '3px solid var(--color-ink)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            aspectRatio: '16/9',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            color: '#fff',
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-volt)',
                color: 'var(--color-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                border: '2px solid var(--color-ink)',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
              title="Play masterclass video"
            >
              ▶
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {selectedLesson ? selectedLesson.title : 'Frontier LLM Architectures'}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.4rem' }}>
              45 Mins · Stream from Tectranz Private CDN · Resume Playback Enabled
            </p>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0.75rem 1.25rem',
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
            }}
          >
            <span>Progress: 100%</span>
            <span>Video Speed: 1.25x</span>
            <span>Asia/Kolkata Server</span>
          </div>
        </div>

        {/* Lesson Details & Actions Card */}
        <div className="tz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-sand">
                  {selectedLesson?.lesson_type === 'recorded' ? '📹 RECORDED MASTERCLASS' : '🧪 PRACTICAL LAB'}
                </span>
                <span className="badge badge-volt">{selectedLesson?.duration_minutes} MINUTES</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedLesson?.title}</h2>
            </div>

            <button
              onClick={() => selectedLesson && handleMarkComplete(selectedLesson.id)}
              disabled={loading || (selectedLesson && completionState[selectedLesson.id])}
              className={`btn ${selectedLesson && completionState[selectedLesson.id] ? 'btn-outline' : 'btn-volt'}`}
            >
              {selectedLesson && completionState[selectedLesson.id] ? '✓ Lesson Completed' : 'Mark as Completed'}
            </button>
          </div>

          {/* Transcript / Overview */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-line)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Lesson Notes & Transcript Excerpt:
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
              {selectedLesson?.transcript_text ||
                'Welcome to Tectranz AI Engineering. In this module, we focus on production patterns that sit around foundation models. We examine token serialization, deterministic function calling with Pydantic schemas, and structured error boundaries.'}
            </p>
          </div>

          {/* Attached Resources */}
          {Object.keys(parsedResources).length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-line)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Attached Code Labs & Slides:
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {Object.entries(parsedResources).map(([key, val]) => (
                  <a
                    key={key}
                    href={String(val)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    🔗 {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Accordion Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Course Modules</h3>

        {phases.map((phase) => {
          const phaseModules = modules.filter((m) => m.phase_id === phase.id);

          return (
            <div
              key={phase.id}
              style={{
                border: '2px solid var(--color-ink)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#fff',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-pop-sm)',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-sand)',
                  padding: '0.75rem 1rem',
                  borderBottom: '2px solid var(--color-ink)',
                }}
              >
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-iris)' }}>
                  PHASE {phase.phase_number} (WEEKS {phase.start_week}–{phase.end_week})
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-ink)' }}>
                  {phase.title}
                </div>
              </div>

              <div style={{ padding: '0.5rem' }}>
                {phaseModules.map((mod) => {
                  const modLessons = lessons.filter((l) => l.module_id === mod.id);

                  return (
                    <div key={mod.id} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.5rem', color: 'var(--color-ink-muted)' }}>
                        {mod.title}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {modLessons.map((l) => {
                          const isSelected = selectedLesson?.id === l.id;
                          const isDone = completionState[l.id];

                          return (
                            <button
                              key={l.id}
                              onClick={() => setSelectedLesson(l)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.55rem 0.65rem',
                                borderRadius: 'var(--radius-md)',
                                border: isSelected ? '2px solid var(--color-ink)' : '1px solid transparent',
                                backgroundColor: isSelected ? 'var(--color-volt-light)' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{isDone ? '✅' : '📹'}</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 800 : 600, color: 'var(--color-ink)' }}>
                                  {l.title}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                                {l.duration_minutes}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
