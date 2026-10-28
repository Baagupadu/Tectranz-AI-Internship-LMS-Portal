import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { AttendanceService } from '@/lib/services/attendance.service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.enrolmentId) {
      return NextResponse.json({ error: 'Unauthorized or active enrolment missing' }, { status: 401 });
    }

    const { attendanceRecordId, requestedStatus, reason, evidenceUrl } = await req.json();

    if (!attendanceRecordId || !requestedStatus || !reason) {
      return NextResponse.json({ error: 'Record ID, requested status, and reason are required' }, { status: 400 });
    }

    const correctionId = AttendanceService.submitCorrectionRequest(
      user.enrolmentId,
      Number(attendanceRecordId),
      requestedStatus,
      reason,
      evidenceUrl
    );

    return NextResponse.json({
      success: true,
      correctionId,
      message: 'Attendance correction request submitted for administrative review.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Correction request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
