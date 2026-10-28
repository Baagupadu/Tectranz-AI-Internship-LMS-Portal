'use client';

import React, { useState } from 'react';

interface ProfileData {
  full_name?: string;
  email?: string;
  phone?: string | null;
  college_name?: string | null;
  graduation_year?: number | null;
  semester?: string | null;
  degree_branch?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  timezone?: string;
  consent_signed_at?: string | null;
}

export function OnboardingClient({ initialProfile }: { initialProfile: ProfileData }) {
  const [fullName] = useState(initialProfile.full_name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '+91 ');
  const [collegeName, setCollegeName] = useState(initialProfile.college_name || 'Vellore Institute of Technology (VIT)');
  const [graduationYear, setGraduationYear] = useState(initialProfile.graduation_year || 2026);
  const [semester, setSemester] = useState(initialProfile.semester || '4.1');
  const [degreeBranch, setDegreeBranch] = useState(initialProfile.degree_branch || 'Computer Science & Engineering');
  const [githubUrl, setGithubUrl] = useState(initialProfile.github_url || 'https://github.com/');
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedin_url || 'https://linkedin.com/in/');
  const [timezone, setTimezone] = useState(initialProfile.timezone || 'Asia/Kolkata');
  const [consentGiven, setConsentGiven] = useState(!!initialProfile.consent_signed_at);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          collegeName,
          graduationYear,
          semester,
          degreeBranch,
          githubUrl,
          linkedinUrl,
          timezone,
          consentGiven,
        }),
      });

      if (res.ok) {
        setToast('Academic profile updated and confirmed! Onboarding complete.');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
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

      <div className="tz-card" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input id="fullName" type="text" className="form-input" value={fullName} disabled />
              <span className="form-hint">Matches verified payment receipt identity.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="collegeName">College / University Name *</label>
              <input
                id="collegeName"
                type="text"
                className="form-input"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="degreeBranch">Branch / Major *</label>
              <input
                id="degreeBranch"
                type="text"
                className="form-input"
                value={degreeBranch}
                onChange={(e) => setDegreeBranch(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="semester">Current Semester Standing *</label>
              <select
                id="semester"
                className="form-select"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="4.1">4.1 (Semester 7 - Attending Classes)</option>
                <option value="4.2">4.2 (Semester 8 - Project Semester)</option>
                <option value="Graduated">Recent Graduate / Job Seeker</option>
                <option value="3.2">3.2 (Semester 6)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="graduationYear">Graduation Year *</label>
              <input
                id="graduationYear"
                type="number"
                className="form-input"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="timezone">Programme Timezone *</label>
              <select
                id="timezone"
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - Standard)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="githubUrl">GitHub Profile URL *</label>
              <input
                id="githubUrl"
                type="url"
                className="form-input"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                required
              />
              <span className="form-hint">Used for assignment code repositories & pull requests.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="linkedinUrl">LinkedIn Profile URL</label>
              <input
                id="linkedinUrl"
                type="url"
                className="form-input"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Academic & Partner Consent */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-ink)',
              backgroundColor: 'var(--color-sand)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                style={{ width: '20px', height: '20px', marginTop: '2px' }}
                required
              />
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                <strong>Tectranz Code of Conduct & Academic Credit Terms:</strong> I confirm that all code submitted in assignments and partner capstone projects will be my original work. I authorize Tectranz to share progress statements and verified hours with my university internship supervisor and partner company mentors.
              </div>
            </label>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-volt btn-lg"
            >
              {saving ? 'Saving Profile...' : 'Save Academic Details →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
