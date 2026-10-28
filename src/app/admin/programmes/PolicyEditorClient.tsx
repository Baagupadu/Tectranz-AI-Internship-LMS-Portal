'use client';

import React, { useState } from 'react';

interface PolicyVersion {
  id: number;
  version_tag: string;
  name: string;
  min_attendance_percent: number;
  min_engagement_hours: number;
  required_projects_count: number;
  required_reports_count: number;
  passing_grade_percent: number;
  late_penalty_per_day: number;
  resubmission_allowed: number;
  is_default: number;
}

interface TrackItem {
  id: number;
  code: string;
  name: string;
  duration_weeks: number;
}

interface PolicyEditorClientProps {
  policies: PolicyVersion[];
  tracks: TrackItem[];
}

export function PolicyEditorClient({ policies, tracks }: PolicyEditorClientProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyVersion>(policies[0]);
  const [minAttendancePercent, setMinAttendancePercent] = useState<number>(selectedPolicy.min_attendance_percent);
  const [minEngagementHours, setMinEngagementHours] = useState<number>(selectedPolicy.min_engagement_hours);
  const [requiredProjectsCount, setRequiredProjectsCount] = useState<number>(selectedPolicy.required_projects_count);
  const [requiredReportsCount, setRequiredReportsCount] = useState<number>(selectedPolicy.required_reports_count);
  const [passingGradePercent, setPassingGradePercent] = useState<number>(selectedPolicy.passing_grade_percent);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSelectPolicy = (p: PolicyVersion) => {
    setSelectedPolicy(p);
    setMinAttendancePercent(p.min_attendance_percent);
    setMinEngagementHours(p.min_engagement_hours);
    setRequiredProjectsCount(p.required_projects_count);
    setRequiredReportsCount(p.required_reports_count);
    setPassingGradePercent(p.passing_grade_percent);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId: selectedPolicy.id,
          minAttendancePercent,
          minEngagementHours,
          requiredProjectsCount,
          requiredReportsCount,
          passingGradePercent,
        }),
      });

      if (res.ok) {
        setToast(`Policy ${selectedPolicy.version_tag} updated and persisted in ledger!`);
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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

      {/* Policy Selector Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {policies.map((p) => {
          const isSelected = selectedPolicy.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPolicy(p)}
              className={`btn ${isSelected ? 'btn-volt' : 'btn-outline'}`}
            >
              📋 {p.name} ({p.version_tag})
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '2rem', alignItems: 'start' }}>
        {/* Policy Configuration Form */}
        <div className="tz-card" style={{ padding: '2.5rem' }}>
          <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <span className="badge badge-iris">EDITING VERSION: {selectedPolicy.version_tag}</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.4rem' }}>
              Academic Thresholds & Completion Gates
            </h2>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
              Changes take effect for active cohort certificate evaluation. Historical approved snapshots remain preserved.
            </p>
          </div>

          <form onSubmit={handleSavePolicy}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="minAttendance">
                  Attendance Threshold (%) *
                </label>
                <input
                  id="minAttendance"
                  type="number"
                  min="50"
                  max="100"
                  step="5"
                  className="form-input"
                  value={minAttendancePercent}
                  onChange={(e) => setMinAttendancePercent(Number(e.target.value))}
                  required
                />
                <span className="form-hint">Standard AICTE guidance recommends 75%.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="minHours">
                  Minimum Approved Engagement Hours *
                </label>
                <input
                  id="minHours"
                  type="number"
                  min="40"
                  max="480"
                  step="10"
                  className="form-input"
                  value={minEngagementHours}
                  onChange={(e) => setMinEngagementHours(Number(e.target.value))}
                  required
                />
                <span className="form-hint">Combines live lectures, labs, and approved logbook hours.</span>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="projCount">
                  Required Projects Count *
                </label>
                <select
                  id="projCount"
                  className="form-select"
                  value={requiredProjectsCount}
                  onChange={(e) => setRequiredProjectsCount(Number(e.target.value))}
                >
                  <option value={1}>1 Project (Capstone Only)</option>
                  <option value={2}>2 Projects (1 Minor + 1 Partner Capstone)</option>
                  <option value={3}>3 Projects (Advanced Research)</option>
                </select>
                <span className="form-hint">Configurable rule (no database schema rewrite needed).</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="repCount">
                  Required Progress Reports *
                </label>
                <select
                  id="repCount"
                  className="form-select"
                  value={requiredReportsCount}
                  onChange={(e) => setRequiredReportsCount(Number(e.target.value))}
                >
                  <option value={2}>2 Reports (Midterm + Final)</option>
                  <option value={4}>4 Reports (Fortnightly Reviews)</option>
                  <option value={8}>8 Reports (Fortnightly Intensive)</option>
                </select>
                <span className="form-hint">Faculty must sign off on each report.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="passingGrade">
                  Passing Grade Cutoff (%) *
                </label>
                <input
                  id="passingGrade"
                  type="number"
                  min="40"
                  max="90"
                  step="5"
                  className="form-input"
                  value={passingGradePercent}
                  onChange={(e) => setPassingGradePercent(Number(e.target.value))}
                  required
                />
                <span className="form-hint">Minimum average across assignments and viva.</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-volt btn-lg"
              >
                {saving ? 'Persisting Configuration...' : 'Save & Publish Policy Changes →'}
              </button>
            </div>
          </form>
        </div>

        {/* 16-Week Programme Duration Template Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="tz-card" style={{ backgroundColor: 'var(--color-sand)' }}>
            <span className="badge badge-volt">EDITABLE TEMPLATE</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.35rem' }}>
              Standard 16-Week Duration
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
              16 weeks is used as an editable programme blueprint, not a hardcoded system limitation. Track curricula can span 8, 12, or 24 weeks.
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {tracks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.65rem',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid var(--color-ink)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{t.code} · {t.name}</span>
                  <span className="badge badge-sand">{t.duration_weeks} Wks</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
