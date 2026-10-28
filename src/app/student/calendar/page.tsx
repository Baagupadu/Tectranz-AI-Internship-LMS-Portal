import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { CalendarService } from '@/lib/services/calendar.service';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export const dynamic = 'force-dynamic';

export default async function StudentCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const enrolmentId = user.enrolmentId || 1;
  const events = CalendarService.getEvents(enrolmentId);

  return (
    <div className="app-container">
      <StudentSidebar user={user} />
      <div className="app-main">
        <AppHeader user={user} />
        <main className="app-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-volt">COHORT SCHEDULE</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>
                Calendar & Timetable
              </h1>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
                Combined Live Lectures, Mentor Office Hours, Assignment Deadlines, and Partner Review Viva.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--color-sand)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-ink)' }}>
                Timezone: Asia/Kolkata (IST)
              </div>
              <a
                href={`/api/calendar/feed/${enrolmentId}`}
                download={`tectranz-schedule-${enrolmentId}.ics`}
                className="btn btn-volt"
              >
                📥 Export to iCal (.ics)
              </a>
            </div>
          </div>

          {/* Agenda Event Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {events.map((event) => {
              const startDate = new Date(event.start);
              const isPast = startDate < new Date();

              return (
                <div
                  key={event.id}
                  className="tz-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderLeft: `6px solid ${
                      event.category === 'class'
                        ? 'var(--color-iris)'
                        : event.category === 'assignment_due'
                        ? 'var(--color-danger)'
                        : event.category === 'milestone_due'
                        ? 'var(--color-volt)'
                        : 'var(--color-success)'
                    }`,
                    opacity: isPast ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Date Badge Box */}
                    <div
                      style={{
                        minWidth: '70px',
                        textAlign: 'center',
                        backgroundColor: 'var(--color-sand)',
                        padding: '0.6rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-ink)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-iris)' }}>
                        {startDate.toLocaleString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                        {startDate.getDate()}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                        <span className="badge badge-sand">
                          {event.category.toUpperCase().replace('_', ' ')}
                        </span>
                        {event.isRequired && (
                          <span className="badge badge-danger">MANDATORY</span>
                        )}
                        {isPast && <span className="badge badge-sand">COMPLETED</span>}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{event.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
                        {event.description}
                      </p>
                      <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', marginTop: '0.4rem', color: 'var(--color-ink)' }}>
                        🕒 {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} IST
                      </div>
                    </div>
                  </div>

                  {event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-volt btn-sm"
                    >
                      Launch Session ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
