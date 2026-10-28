'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user.role === 'mentor') {
        router.push('/mentor/dashboard');
      } else if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo sign-in failed');
      }

      if (role === 'mentor') {
        router.push('/mentor/dashboard');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <header style={{ padding: '1.25rem 2rem', borderBottom: '2px solid var(--color-ink)', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              Tectranz Portal
            </span>
          </Link>
          <Link href="/" className="btn btn-outline btn-sm">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '980px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Form Card */}
          <div className="tz-card" style={{ padding: '2.5rem 2rem' }}>
            <span className="badge badge-iris">AUTHENTICATED ACCESS</span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '0.4rem' }}>
              Sign in to Tectranz
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)', marginBottom: '1.75rem' }}>
              Enter your registered student or mentor credentials.
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '2px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="student@tectranz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-iris)', fontWeight: 600 }}>
                    Default: tectranz123
                  </span>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-volt btn-lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In with Credentials →'}
              </button>
            </form>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-line)', fontSize: '0.8rem', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
              Confirmed fee payment? Your onboarding email contains your activation link.
            </div>
          </div>

          {/* Quick Demo Personas Card */}
          <div className="tz-card" style={{ backgroundColor: 'var(--color-sand)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="badge badge-volt">1-CLICK TEST LOGIN</span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                QA & Evaluation Mode
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Test All Roles Instantly
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Select any role below to test end-to-end capabilities with persistent seed data:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={() => handleDemoLogin('student')}
                disabled={loading}
                className="btn btn-outline"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.75rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>👨‍💻 Aarav Sharma (Student)</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                    GenAI & LLM Track · Week 4 · Capstone In Progress
                  </div>
                </div>
                <span className="badge badge-volt">Active</span>
              </button>

              <button
                onClick={() => handleDemoLogin('student_graduated')}
                disabled={loading}
                className="btn btn-outline"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.75rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>👩‍🎓 Riya Verma (Certified)</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                    Computer Vision · Capstone Accepted · QR Certificate Issued
                  </div>
                </div>
                <span className="badge badge-iris">Certified</span>
              </button>

              <button
                onClick={() => handleDemoLogin('mentor')}
                disabled={loading}
                className="btn btn-outline"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.75rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>👨‍🏫 Dr. Vikramaditya Sen (Mentor)</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                    AI Systems Architect · Reviews, Grading, Logbook Approvals
                  </div>
                </div>
                <span className="badge badge-sand">Faculty</span>
              </button>

              <button
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="btn btn-outline"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.75rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>👑 Sunita Rao (Director / Admin)</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                    Academic Ops · Configurable Policies, Thresholds & Certs
                  </div>
                </div>
                <span className="badge badge-sand">Admin</span>
              </button>

              <button
                onClick={() => handleDemoLogin('reviewer')}
                disabled={loading}
                className="btn btn-outline"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.75rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>🤝 Rajesh Nair (Partner Reviewer)</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                    Lead Partner Engineer at Aethelgard AI Labs
                  </div>
                </div>
                <span className="badge badge-sand">Partner</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
