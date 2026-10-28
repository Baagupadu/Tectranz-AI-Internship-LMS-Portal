'use client';

import React, { useState } from 'react';

interface Ticket {
  id: number;
  category: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface SupportClientProps {
  initialTickets: Ticket[];
  initialMessages: Message[];
  currentUserId: number;
}

export function SupportClient({ initialTickets, initialMessages, currentUserId }: SupportClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(initialTickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<'academic' | 'mentor' | 'payment' | 'attendance' | 'technical' | 'general'>('academic');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
  const ticketMessages = messages.filter((m) => m.ticket_id === selectedTicketId);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          message: replyText,
        }),
      });

      if (res.ok) {
        const newMsg: Message = {
          id: Date.now(),
          ticket_id: selectedTicketId,
          sender_id: currentUserId,
          sender_role: 'student',
          sender_name: 'You',
          message: replyText,
          created_at: new Date().toISOString(),
        };
        setMessages([...messages, newMsg]);
        setReplyText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/student/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject,
          priority,
          message: initialMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast('Support ticket created! A mentor will respond shortly.');
        const newTicket: Ticket = {
          id: data.ticketId,
          category,
          subject,
          priority,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const newMsg: Message = {
          id: Date.now(),
          ticket_id: data.ticketId,
          sender_id: currentUserId,
          sender_role: 'student',
          sender_name: 'You',
          message: initialMessage,
          created_at: new Date().toISOString(),
        };

        setTickets([newTicket, ...tickets]);
        setMessages([...messages, newMsg]);
        setSelectedTicketId(data.ticketId);
        setIsModalOpen(false);
        setSubject('');
        setInitialMessage('');
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

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
          Active Tickets: <strong>{tickets.length} Inquiries</strong>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-volt">
          + Open New Ticket
        </button>
      </div>

      {/* 2-Column Helpdesk UI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Tickets Left List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                style={{
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '2px solid var(--color-ink)' : '1px solid var(--color-line)',
                  backgroundColor: isSelected ? 'var(--color-sand)' : '#fff',
                  boxShadow: isSelected ? 'var(--shadow-pop-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="badge badge-sand">{ticket.category.toUpperCase()}</span>
                  <span
                    className={`badge ${
                      ticket.status === 'resolved'
                        ? 'badge-success'
                        : ticket.status === 'in_progress'
                        ? 'badge-iris'
                        : 'badge-warning'
                    }`}
                  >
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                  {ticket.subject}
                </h4>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
                  Updated: {ticket.updated_at.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Thread Right Pane */}
        {selectedTicket ? (
          <div className="tz-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span className="badge badge-sand">TICKET #{selectedTicket.id}</span>
                <span className="badge badge-iris">PRIORITY: {selectedTicket.priority.toUpperCase()}</span>
                <span className="badge badge-volt">STATUS: {selectedTicket.status.toUpperCase()}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedTicket.subject}</h3>
            </div>

            {/* Messages Thread */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {ticketMessages.map((msg) => {
                const isStudent = msg.sender_role === 'student';

                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isStudent ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: isStudent ? 'var(--color-volt-light)' : 'var(--color-sand)',
                      border: '1.5px solid var(--color-ink)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      boxShadow: 'var(--shadow-pop-sm)',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: isStudent ? 'var(--color-ink)' : 'var(--color-iris)', marginBottom: '0.2rem' }}>
                      {msg.sender_name} ({msg.sender_role.toUpperCase()})
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                      {msg.message}
                    </p>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-line)', paddingTop: '1.25rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type your response to the mentor or faculty desk..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
              />
              <button type="submit" disabled={submitting} className="btn btn-volt">
                Reply →
              </button>
            </form>
          </div>
        ) : (
          <div className="tz-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p>Select a ticket from the left panel to view message history.</p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-volt">HELP & INQUIRIES</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  Create Support Ticket
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="ticketCategory">
                    Category *
                  </label>
                  <select
                    id="ticketCategory"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="academic">Academic & Curriculum</option>
                    <option value="mentor">Mentor Code Review</option>
                    <option value="attendance">Attendance Appeal</option>
                    <option value="technical">Platform / Git Lab Issue</option>
                    <option value="payment">Fee & Tax Invoices</option>
                    <option value="general">General Support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ticketPriority">
                    Priority *
                  </label>
                  <select
                    id="ticketPriority"
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="low">Low (General guidance)</option>
                    <option value="medium">Medium (Standard query)</option>
                    <option value="high">High (Blocked on capstone)</option>
                    <option value="urgent">Urgent (Deadline critical)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ticketSubject">
                  Subject *
                </label>
                <input
                  id="ticketSubject"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Guidance on multi-page table extraction across SEC 10-K..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ticketMessage">
                  Detailed Message *
                </label>
                <textarea
                  id="ticketMessage"
                  rows={4}
                  className="form-textarea"
                  placeholder="Provide context, error traces, and code snippet links..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  required
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
                  {submitting ? 'Opening Ticket...' : 'Submit Support Ticket →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
