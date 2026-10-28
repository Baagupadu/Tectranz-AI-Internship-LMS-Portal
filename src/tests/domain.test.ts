import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { initSchema } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';
import { getDb } from '@/lib/db/connection';
import { PaymentService } from '@/lib/services/payment.service';
import { AttendanceService } from '@/lib/services/attendance.service';
import { ScorecardService } from '@/lib/services/scorecard.service';
import { CertificateService } from '@/lib/services/certificate.service';
import { JobsService } from '@/lib/services/jobs.service';
import { assertEnrolmentAccess, ForbiddenError } from '@/lib/auth/permissions';
import { SessionUser } from '@/lib/auth/session';

before(async () => {
  initSchema();
  await seedDatabase();
});

describe('1. Payment & Enrolment Workflows', () => {
  it('rejects callbacks with invalid signature', async () => {
    const result = await PaymentService.processPaymentConfirmation({
      orderId: 'order_fake_123',
      paymentId: 'pay_fake_123',
      signature: 'invalid_tampered_signature',
      amount: 4999,
      currency: 'INR',
      email: 'hacker@example.com',
      fullName: 'Hacker Joe',
      planSlug: 'professional',
    });

    assert.equal(result.success, false);
    assert.match(result.message, /Invalid payment signature/);
  });

  it('rejects payments where amount is less than plan price', async () => {
    const result = await PaymentService.processPaymentConfirmation({
      orderId: 'order_test_underpaid',
      paymentId: 'pay_test_underpaid',
      signature: 'sig_valid_test_token',
      amount: 500, // Professional is ₹4999
      currency: 'INR',
      email: 'underpaid@example.com',
      fullName: 'Underpaid User',
      planSlug: 'professional',
    });

    assert.equal(result.success, false);
    assert.match(result.message, /less than required plan price/);
  });

  it('verifies valid payment and creates enrolment with unique registration ID', async () => {
    const result = await PaymentService.processPaymentConfirmation({
      orderId: 'order_test_valid_001',
      paymentId: 'pay_test_valid_001',
      signature: 'sig_valid_test_token',
      amount: 4999,
      currency: 'INR',
      email: 'newstudent@example.com',
      fullName: 'Kavya Patel',
      planSlug: 'professional',
      trackSlug: 'genai-llm',
    });

    assert.equal(result.success, true);
    assert.ok(result.enrolmentId);
    assert.match(result.registrationId || '', /^TZ-2026-L1-\d{4}$/);

    // Verify DB record
    const db = getDb();
    const enrolment = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(result.enrolmentId) as {
      status: string;
      payment_status: string;
    };
    assert.equal(enrolment.status, 'active');
    assert.equal(enrolment.payment_status, 'paid');
  });

  it('handles duplicate webhook callbacks idempotently without duplicating enrolments', async () => {
    const firstCall = await PaymentService.processPaymentConfirmation({
      orderId: 'order_test_idempotent_002',
      paymentId: 'pay_test_idempotent_002',
      signature: 'sig_valid_test_token',
      amount: 9999,
      currency: 'INR',
      email: 'arjun.singh@example.com',
      fullName: 'Arjun Singh',
      planSlug: 'industry',
      trackSlug: 'genai-llm',
    });

    assert.equal(firstCall.success, true);
    const originalEnrolmentId = firstCall.enrolmentId;

    // Replay identical callback
    const secondCall = await PaymentService.processPaymentConfirmation({
      orderId: 'order_test_idempotent_002',
      paymentId: 'pay_test_idempotent_002',
      signature: 'sig_valid_test_token',
      amount: 9999,
      currency: 'INR',
      email: 'arjun.singh@example.com',
      fullName: 'Arjun Singh',
      planSlug: 'industry',
      trackSlug: 'genai-llm',
    });

    assert.equal(secondCall.success, true);
    assert.equal(secondCall.isIdempotentReplay, true);
    assert.equal(secondCall.enrolmentId, originalEnrolmentId);

    // Verify no duplicate enrolment row in database
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM enrolments WHERE registration_id = ?').get(firstCall.registrationId) as { c: number };
    assert.equal(count.c, 1);
  });
});

describe('2. Authorization & Permissions', () => {
  const studentUser: SessionUser = {
    id: 1,
    email: 'student@tectranz.com',
    role: 'student',
    fullName: 'Aarav Sharma',
    enrolmentId: 1,
  };

  const otherStudentUser: SessionUser = {
    id: 99,
    email: 'other@tectranz.com',
    role: 'student',
    fullName: 'Other Student',
    enrolmentId: 99,
  };

  it('allows a student to access their own enrolment', () => {
    assert.doesNotThrow(() => assertEnrolmentAccess(studentUser, 1));
  });

  it('forbids a student from accessing another student enrolment', () => {
    assert.throws(() => assertEnrolmentAccess(otherStudentUser, 1), ForbiddenError);
  });

  it('allows administrator full access', () => {
    const adminUser: SessionUser = {
      id: 4,
      email: 'admin@tectranz.com',
      role: 'admin',
      fullName: 'Sunita Rao',
    };
    assert.doesNotThrow(() => assertEnrolmentAccess(adminUser, 1));
  });
});

describe('3. Attendance & Hours Calculations', () => {
  it('correctly calculates attendance percentage excluding cancelled and non-penalizing optional sessions', () => {
    const summary = AttendanceService.getAttendanceSummary(1);
    assert.equal(summary.enrolmentId, 1);
    assert.ok(summary.presentCount >= 2);
    assert.ok(summary.attendancePercentage >= 75.0);
    assert.equal(summary.isEligibleUnderPolicy, true);
    assert.ok(summary.hoursBreakdown.totalApprovedEngagementHours > 0);
  });
});

describe('4. Scorecard & Completion Gates', () => {
  it('marks work as missing/under review without corrupting score to 0', () => {
    const assessments = ScorecardService.getAssessments(1);
    assert.ok(assessments.length > 0);

    const assignment1 = assessments.find((a) => a.id === 1);
    assert.equal(assignment1?.status, 'graded');
    assert.equal(assignment1?.score, 96);

    const assignment2 = assessments.find((a) => a.id === 2);
    assert.equal(assignment2?.status, 'under_review');
    assert.equal(assignment2?.score, null); // Should not be 0
  });

  it('evaluates completion checklist accurately and blocks certificate for incomplete students', async () => {
    // Student 1 has not finished capstone viva or all 4 reports
    const evaluation = ScorecardService.evaluateCompletion(1);
    assert.equal(evaluation.overallEligible, false);
    assert.ok(evaluation.missingRequirements.length > 0);

    // Attempting to issue certificate for ineligible student should fail
    const issueAttempt = await CertificateService.issueCertificate(1, 4, false);
    assert.equal(issueAttempt.success, false);
    assert.match(issueAttempt.message, /Student has not met all completion criteria/);
  });

  it('verifies public certificate lookup and status handling', () => {
    const db = getDb();
    // Ensure test certificate is in issued state
    db.prepare("UPDATE certificates SET status = 'issued', revoked_reason = NULL WHERE certificate_id = 'TZ-CERT-2026-AIE-8921'").run();

    // Student 2 (Riya Verma) has an issued certificate in seed data
    const cert = CertificateService.verifyCertificatePublic('TZ-CERT-2026-AIE-8921');
    assert.equal(cert.valid, true);
    assert.equal(cert.recipientName, 'Riya Verma');
    assert.equal(cert.trackName, 'Computer Vision Engineering');
    assert.equal(cert.status, 'issued');

    // Revoking test
    CertificateService.revokeCertificate('TZ-CERT-2026-AIE-8921', 4, 'Plagiarism detected in final capstone code');
    const revokedLookup = CertificateService.verifyCertificatePublic('TZ-CERT-2026-AIE-8921');
    assert.equal(revokedLookup.valid, false);
    assert.equal(revokedLookup.status, 'revoked');
    assert.match(revokedLookup.revocationReason || '', /Plagiarism/);

    // Reset back to issued so dev server / demonstration verification route works
    db.prepare("UPDATE certificates SET status = 'issued', revoked_reason = NULL WHERE certificate_id = 'TZ-CERT-2026-AIE-8921'").run();
  });
});

describe('5. Background Jobs & Deduplication', () => {
  it('deduplicates identical queued jobs', () => {
    const jobPayload = { userId: 42, event: 'test_notification' };
    const id1 = JobsService.enqueueJob('test_event', jobPayload);
    const id2 = JobsService.enqueueJob('test_event', jobPayload);

    assert.equal(id1, id2); // Identical payload returns same job ID
  });

  it('processes queued jobs and updates delivery status', () => {
    JobsService.enqueueJob('email_enrolment_welcome', { userId: 1, email: 'student@tectranz.com', regId: 'TEST-01' });
    const result = JobsService.processPendingJobs(5);
    assert.ok(result.processed >= 1);
  });
});
