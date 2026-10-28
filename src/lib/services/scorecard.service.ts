import { getDb } from '@/lib/db/connection';
import { AttendanceService } from './attendance.service';

export interface AssessmentItem {
  id: number;
  title: string;
  category: 'assignment' | 'milestone' | 'viva';
  maxPoints: number;
  score: number | null; // null means ungraded / pending
  status: 'graded' | 'under_review' | 'submitted' | 'missing' | 'not_due';
  dueDate: string;
  feedback?: string;
  submissionCount: number;
}

export interface CompletionChecklist {
  overallEligible: boolean;
  completionScore: number;
  gates: {
    attendance: {
      name: string;
      satisfied: boolean;
      currentValue: string;
      targetValue: string;
    };
    engagementHours: {
      name: string;
      satisfied: boolean;
      currentValue: string;
      targetValue: string;
    };
    assignments: {
      name: string;
      satisfied: boolean;
      currentValue: string;
      targetValue: string;
    };
    capstoneProject: {
      name: string;
      satisfied: boolean;
      currentValue: string;
      targetValue: string;
    };
    reports: {
      name: string;
      satisfied: boolean;
      currentValue: string;
      targetValue: string;
    };
  };
  missingRequirements: string[];
}

export class ScorecardService {
  /**
   * Retrieves all graded and pending assessments for an enrolment.
   */
  static getAssessments(enrolmentId: number): AssessmentItem[] {
    const db = getDb();

    // Get cohort assignments
    const assignments = db.prepare(`
      SELECT 
        a.id, a.title, a.max_points, a.due_date,
        sub.id as submission_id,
        sub.status as submission_status,
        sub.score,
        sub.reviewer_feedback,
        (SELECT COUNT(*) FROM assignment_submissions s2 WHERE s2.assignment_id = a.id AND s2.enrolment_id = e.id) as sub_count
      FROM assignments a
      JOIN enrolments e ON e.cohort_id = a.cohort_id
      LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.enrolment_id = e.id
        AND sub.version_number = (
          SELECT MAX(s3.version_number) FROM assignment_submissions s3 
          WHERE s3.assignment_id = a.id AND s3.enrolment_id = e.id
        )
      WHERE e.id = ?
      ORDER BY a.order_index ASC
    `).all(enrolmentId) as Array<{
      id: number;
      title: string;
      max_points: number;
      due_date: string;
      submission_id: number | null;
      submission_status: string | null;
      score: number | null;
      reviewer_feedback: string | null;
      sub_count: number;
    }>;

    const items: AssessmentItem[] = assignments.map((a) => {
      let status: AssessmentItem['status'] = 'missing';
      const now = new Date();
      const due = new Date(a.due_date);

      if (a.submission_status === 'graded') {
        status = 'graded';
      } else if (a.submission_status === 'under_review') {
        status = 'under_review';
      } else if (a.submission_status === 'submitted' || a.submission_status === 'resubmitted') {
        status = 'submitted';
      } else if (now < due) {
        status = 'not_due';
      } else {
        status = 'missing';
      }

      return {
        id: a.id,
        title: a.title,
        category: 'assignment',
        maxPoints: a.max_points,
        score: a.score,
        status,
        dueDate: a.due_date,
        feedback: a.reviewer_feedback || undefined,
        submissionCount: a.sub_count,
      };
    });

    return items;
  }

  /**
   * Evaluate full completion checklist against the enrolment's policy version.
   */
  static evaluateCompletion(enrolmentId: number): CompletionChecklist {
    const db = getDb();

    // Get policy requirements
    const policy = db.prepare(`
      SELECT pv.*, e.status as enrolment_status
      FROM enrolments e
      JOIN policy_versions pv ON e.policy_version_id = pv.id
      WHERE e.id = ?
    `).get(enrolmentId) as {
      min_attendance_percent: number;
      min_engagement_hours: number;
      required_projects_count: number;
      required_reports_count: number;
      passing_grade_percent: number;
      enrolment_status: string;
    } | undefined;

    if (!policy) {
      throw new Error(`Enrolment #${enrolmentId} not found`);
    }

    const attendanceSummary = AttendanceService.getAttendanceSummary(enrolmentId);
    const assessments = this.getAssessments(enrolmentId);

    // Calculate score on graded items
    const gradedAssessments = assessments.filter((a) => a.score !== null);
    let totalScore = 0;
    let totalMax = 0;
    for (const g of gradedAssessments) {
      totalScore += g.score || 0;
      totalMax += g.maxPoints;
    }
    const currentGradePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0;

    // Check project status
    const projects = db.prepare(`
      SELECT * FROM student_projects WHERE enrolment_id = ?
    `).all(enrolmentId) as Array<{
      id: number;
      project_type: string;
      status: string;
      viva_status: string;
      viva_score: number | null;
    }>;

    const acceptedCapstone = projects.find(
      (p) => p.project_type === 'capstone' && p.status === 'accepted' && p.viva_status === 'passed'
    );

    // Check approved reports
    const reportCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM periodic_reports WHERE enrolment_id = ? AND status = 'approved'
    `).get(enrolmentId) as { count: number };
    const approvedReportsCount = reportCountRow ? reportCountRow.count : 0;

    // Evaluate gates
    const missingRequirements: string[] = [];

    const attendanceGate = {
      name: 'Session Attendance',
      satisfied: attendanceSummary.attendancePercentage >= policy.min_attendance_percent,
      currentValue: `${attendanceSummary.attendancePercentage}%`,
      targetValue: `>= ${policy.min_attendance_percent}%`,
    };
    if (!attendanceGate.satisfied) {
      missingRequirements.push(
        `Attendance (${attendanceGate.currentValue}) is below threshold of ${attendanceGate.targetValue}`
      );
    }

    const hoursGate = {
      name: 'Approved Engagement Hours',
      satisfied: attendanceSummary.hoursBreakdown.totalApprovedEngagementHours >= policy.min_engagement_hours,
      currentValue: `${attendanceSummary.hoursBreakdown.totalApprovedEngagementHours}h`,
      targetValue: `>= ${policy.min_engagement_hours}h`,
    };
    if (!hoursGate.satisfied) {
      missingRequirements.push(
        `Engagement Hours (${hoursGate.currentValue}) below required ${hoursGate.targetValue}`
      );
    }

    const assignmentsGate = {
      name: 'Core Assignments Passing Grade',
      satisfied: currentGradePercent >= policy.passing_grade_percent && !assessments.some((a) => a.status === 'missing'),
      currentValue: `${currentGradePercent}%`,
      targetValue: `>= ${policy.passing_grade_percent}% with no missing assignments`,
    };
    if (!assignmentsGate.satisfied) {
      missingRequirements.push(`Assignments requirement not met (${assignmentsGate.currentValue})`);
    }

    const capstoneGate = {
      name: 'Partner Capstone & Defended Review',
      satisfied: !!acceptedCapstone,
      currentValue: acceptedCapstone ? 'Accepted & Viva Passed' : 'In Progress / Pending Review',
      targetValue: 'Accepted by Partner with Passed Viva',
    };
    if (!capstoneGate.satisfied) {
      missingRequirements.push('Capstone project must be formally accepted by partner reviewer and viva passed');
    }

    const reportsGate = {
      name: 'Approved Periodic Reports',
      satisfied: approvedReportsCount >= policy.required_reports_count,
      currentValue: `${approvedReportsCount} approved`,
      targetValue: `>= ${policy.required_reports_count} approved`,
    };
    if (!reportsGate.satisfied) {
      missingRequirements.push(
        `Approved reports (${reportsGate.currentValue}) below policy requirement of ${reportsGate.targetValue}`
      );
    }

    const overallEligible =
      attendanceGate.satisfied &&
      hoursGate.satisfied &&
      assignmentsGate.satisfied &&
      capstoneGate.satisfied &&
      reportsGate.satisfied;

    return {
      overallEligible,
      completionScore: currentGradePercent,
      gates: {
        attendance: attendanceGate,
        engagementHours: hoursGate,
        assignments: assignmentsGate,
        capstoneProject: capstoneGate,
        reports: reportsGate,
      },
      missingRequirements,
    };
  }
}
