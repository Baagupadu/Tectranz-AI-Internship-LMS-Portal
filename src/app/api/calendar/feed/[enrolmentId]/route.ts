import { NextResponse } from 'next/server';
import { CalendarService } from '@/lib/services/calendar.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ enrolmentId: string }> }
) {
  try {
    const { enrolmentId } = await params;
    const icsContent = CalendarService.generateIcsFeed(Number(enrolmentId));

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="tectranz-schedule-${enrolmentId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate calendar feed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
