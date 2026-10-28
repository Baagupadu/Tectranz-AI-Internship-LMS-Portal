import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole } from '@/lib/auth/permissions';
import { CertificateService } from '@/lib/services/certificate.service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertRole(user, ['admin']);

    const { action, enrolmentId, certificateId, reason, forceOverride } = await req.json();

    if (action === 'revoke') {
      if (!certificateId || !reason) {
        return NextResponse.json({ error: 'certificateId and revocation reason are required' }, { status: 400 });
      }
      const ok = CertificateService.revokeCertificate(certificateId, user!.id, reason);
      return NextResponse.json({ success: ok, message: 'Certificate has been formally revoked.' });
    }

    if (action === 'issue') {
      if (!enrolmentId) {
        return NextResponse.json({ error: 'enrolmentId is required' }, { status: 400 });
      }
      const result = await CertificateService.issueCertificate(Number(enrolmentId), user!.id, !!forceOverride);
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action. Expected "issue" or "revoke"' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Certificate action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
