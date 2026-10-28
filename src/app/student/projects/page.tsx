import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/connection';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export const dynamic = 'force-dynamic';

export default async function StudentProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const enrolmentId = user.enrolmentId || 1;

  // Active student capstone project
  const project = db.prepare(`
    SELECT sp.*, pc.title as catalogue_title, pc.problem_statement, pc.scope_details, pc.deliverables_json,
           po.name as partner_name, po.industry as partner_industry, po.website as partner_website,
           mp.full_name as mentor_name
    FROM student_projects sp
    LEFT JOIN project_catalogue pc ON sp.catalogue_project_id = pc.id
    LEFT JOIN partner_organizations po ON sp.partner_id = po.id
    LEFT JOIN users mu ON sp.mentor_id = mu.id
    LEFT JOIN mentor_profiles mp ON mp.user_id = mu.id
    WHERE sp.enrolment_id = ?
    ORDER BY sp.id DESC LIMIT 1
  `).get(enrolmentId) as {
    id: number;
    title: string;
    project_type: string;
    status: string;
    repo_url: string | null;
    demo_url: string | null;
    documentation_url: string | null;
    viva_status: string;
    viva_score: number | null;
    problem_statement: string | null;
    scope_details: string | null;
    deliverables_json: string | null;
    partner_name: string | null;
    partner_industry: string | null;
    partner_website: string | null;
    mentor_name: string | null;
  } | undefined;

  // Project milestones
  const milestones = project
    ? (db.prepare(`
        SELECT * FROM project_milestones WHERE student_project_id = ? ORDER BY milestone_number ASC
      `).all(project.id) as Array<{
        id: number;
        milestone_number: number;
        title: string;
        due_date: string;
        status: string;
        feedback: string | null;
      }>)
    : [];

  // Project catalogue (across 6 tracks)
  const catalogue = db.prepare(`
    SELECT pc.*, t.name as track_name, t.code as track_code, po.name as partner_name
    FROM project_catalogue pc
    JOIN tracks t ON pc.track_id = t.id
    LEFT JOIN partner_organizations po ON pc.partner_id = po.id
    ORDER BY pc.id ASC
  `).all() as Array<{
    id: number;
    title: string;
    difficulty: string;
    track_name: string;
    track_code: string;
    partner_name: string | null;
    problem_statement: string;
    scope_details: string;
    deliverables_json: string;
    reviewer_capacity: number;
  }>;

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-volt">INDUSTRY COLLABORATION</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              Partner Capstone Projects & Viva Defense
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
              Work on production AI problems from partner enterprises. Defended viva with company engineers required for graduation.
            </p>
          </div>

          {/* Active Project Workspace */}
          {project ? (
            <div className="tz-card" style={{ padding: '2.5rem 2rem', marginBottom: '3rem', border: '3px solid var(--color-ink)', boxShadow: 'var(--shadow-pop-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--color-ink)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-volt">ACTIVE CAPSTONE</span>
                    <span className="badge badge-sand">🏢 {project.partner_name || 'Aethelgard AI Labs'}</span>
                    <span className="badge badge-iris">Mentor: {project.mentor_name || 'Dr. Vikramaditya'}</span>
                  </div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>{project.title}</h2>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {project.repo_url && (
                    <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      GitHub Repo ↗
                    </a>
                  )}
                  {project.demo_url && (
                    <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="btn btn-volt btn-sm">
                      Live App ↗
                    </a>
                  )}
                  {project.documentation_url && (
                    <a href={project.documentation_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      Architecture Docs ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Problem Statement & Scope */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'var(--color-sand)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-ink)' }}>
                  <h4 style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-iris)', marginBottom: '0.4rem' }}>
                    APPROVED PROBLEM STATEMENT
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: 1.6 }}>
                    {project.problem_statement ||
                      'Financial institutions struggle to audit 300+ page SEC filings against complex ESG and solvency regulations without hallucination risks.'}
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--color-paper)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-ink)' }}>
                  <h4 style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-iris)', marginBottom: '0.4rem' }}>
                    TECHNICAL SCOPE & DELIVERABLES
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: 1.6 }}>
                    {project.scope_details ||
                      'Design a citation-enforced RAG and agentic auditing system that references exact paragraph coordinates in source PDFs with zero ungrounded claims.'}
                  </p>
                </div>
              </div>

              {/* Milestones Task Board */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
                  Milestones & Review Progress
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '1.2rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-ink)',
                        backgroundColor:
                          m.status === 'completed'
                            ? 'var(--color-success-bg)'
                            : m.status === 'in_review'
                            ? 'var(--color-warning-bg)'
                            : '#fff',
                        boxShadow: 'var(--shadow-pop-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                            M0{m.milestone_number}
                          </span>
                          <span
                            className={`badge ${
                              m.status === 'completed'
                                ? 'badge-success'
                                : m.status === 'in_review'
                                ? 'badge-warning'
                                : 'badge-sand'
                            }`}
                          >
                            {m.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800 }}>{m.title}</h4>
                      </div>

                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-line)', fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                        {m.feedback ? (
                          <span>
                            <strong>Review:</strong> {m.feedback}
                          </span>
                        ) : (
                          <span>Due: {m.due_date.split(' ')[0]}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Viva Defense Banner */}
              <div
                style={{
                  backgroundColor: 'var(--color-ink)',
                  color: '#fff',
                  padding: '1.25rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-volt)', fontWeight: 700 }}>
                    GATE 4: TECHNICAL DEFENSE & VIVA
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                    Week 16 Partner Defense Viva
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.1rem' }}>
                    Status:{' '}
                    <strong style={{ color: project.viva_status === 'passed' ? 'var(--color-volt)' : '#fff' }}>
                      {project.viva_status === 'passed' ? `Passed (${project.viva_score}/100)` : 'Pending Milestone 3 & 4 Completion'}
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
                  Evaluator: {project.partner_name} Lead Architect
                </div>
              </div>
            </div>
          ) : (
            <div className="tz-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '3rem' }}>
              <h3>No Capstone Currently Assigned</h3>
              <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
                Choose a project from the approved catalogue below to submit your proposal.
              </p>
            </div>
          )}

          {/* Partner Project Catalogue */}
          <section>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="badge badge-iris">APPROVED REPOSITORY</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.3rem' }}>
                Open Partner Capstone Catalogue
              </h2>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.88rem' }}>
                Explore live project briefs co-designed with industry partners across all 6 specialized lines.
              </p>
            </div>

            <div className="grid-3">
              {catalogue.map((cat) => (
                <div key={cat.id} className="tz-card tz-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-sand">{cat.track_code}</span>
                    <span className="badge badge-volt">
                      {cat.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.5rem' }}>
                    {cat.title}
                  </h3>

                  <div style={{ fontSize: '0.76rem', color: 'var(--color-iris)', fontWeight: 700, marginBottom: '0.75rem' }}>
                    🏢 Partner: {cat.partner_name || 'Tectranz Labs'}
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', lineHeight: 1.5, flex: 1 }}>
                    {cat.problem_statement}
                  </p>

                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                    <span style={{ color: 'var(--color-ink-muted)' }}>
                      Capacity: {cat.reviewer_capacity} Students
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--color-ink)' }}>
                      Assigned to Cohort ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
