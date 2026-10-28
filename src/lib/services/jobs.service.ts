import { getDb, withTransaction } from '@/lib/db/connection';

export interface BackgroundJobRecord {
  id: number;
  job_type: string;
  payload_json: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retries: number;
  max_retries: number;
  last_error: string | null;
  scheduled_at: string;
  completed_at: string | null;
}

export class JobsService {
  /**
   * Enqueue a new background job with deduplication support
   */
  static enqueueJob(jobType: string, payload: Record<string, unknown>, maxRetries = 3): number {
    const db = getDb();
    const payloadStr = JSON.stringify(payload);

    // Deduplication check: if identical queued job exists, do not duplicate
    const existing = db.prepare(`
      SELECT id FROM background_jobs 
      WHERE job_type = ? AND payload_json = ? AND status IN ('queued', 'processing')
    `).get(jobType, payloadStr) as { id: number } | undefined;

    if (existing) {
      return existing.id;
    }

    const res = db.prepare(`
      INSERT INTO background_jobs (job_type, payload_json, status, max_retries)
      VALUES (?, ?, 'queued', ?)
    `).run(jobType, payloadStr, maxRetries);

    return Number(res.lastInsertRowid);
  }

  /**
   * Process pending queued jobs (can be invoked by route or timer)
   */
  static processPendingJobs(limit = 10): { processed: number; succeeded: number; failed: number } {
    const db = getDb();
    const jobs = db.prepare(`
      SELECT * FROM background_jobs 
      WHERE status = 'queued' AND scheduled_at <= datetime('now')
      ORDER BY id ASC LIMIT ?
    `).all(limit) as unknown as BackgroundJobRecord[];

    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      // Mark processing
      db.prepare(`UPDATE background_jobs SET status = 'processing' WHERE id = ?`).run(job.id);

      try {
        const payload = JSON.parse(job.payload_json);
        this.executeJobHandler(job.job_type, payload);

        // Mark completed
        db.prepare(`
          UPDATE background_jobs 
          SET status = 'completed', completed_at = datetime('now')
          WHERE id = ?
        `).run(job.id);
        succeeded++;
      } catch (err: unknown) {
        failed++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        const newRetries = job.retries + 1;
        const newStatus = newRetries >= job.max_retries ? 'failed' : 'queued';

        db.prepare(`
          UPDATE background_jobs 
          SET status = ?, retries = ?, last_error = ?,
              scheduled_at = datetime('now', '+' || (? * 2) || ' minutes')
          WHERE id = ?
        `).run(newStatus, newRetries, errorMessage, newRetries, job.id);
      }
    }

    return { processed: jobs.length, succeeded, failed };
  }

  /**
   * Job executor logic with sandbox email simulation
   */
  private static executeJobHandler(jobType: string, payload: Record<string, unknown>): void {
    const db = getDb();

    switch (jobType) {
      case 'email_enrolment_welcome':
        // Log to dev inbox and create user notification
        if (payload.userId) {
          db.prepare(`
            INSERT INTO notifications (user_id, title, message, notification_type, action_url)
            VALUES (?, 'Welcome to Tectranz!', ?, 'info', '/student/dashboard')
          `).run(
            Number(payload.userId),
            `Your payment was confirmed. Your Registration ID is ${payload.regId || 'assigned'}. Welcome to the cohort!`
          );
        }
        break;

      case 'deliver_certificate_email':
        // Audit cert email delivery
        if (payload.email) {
          console.log(`[JobSandbox] Delivered certificate ${payload.certificate_id} to ${payload.email}`);
        }
        break;

      case 'generate_pdf_report':
        // Report snapshot creation
        console.log(`[JobSandbox] Rendered PDF snapshot for report #${payload.report_id}`);
        break;

      default:
        console.log(`[JobSandbox] Executed generic job ${jobType}:`, payload);
        break;
    }
  }

  /**
   * Retry a failed job manually (Admin operation)
   */
  static retryJob(jobId: number): void {
    const db = getDb();
    db.prepare(`
      UPDATE background_jobs 
      SET status = 'queued', retries = 0, last_error = NULL, scheduled_at = datetime('now')
      WHERE id = ?
    `).run(jobId);
  }
}
