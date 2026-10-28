import { NextResponse } from 'next/server';
import { PaymentService, WebhookPayload } from '@/lib/services/payment.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload: WebhookPayload = {
      orderId: body.orderId || body.order_id,
      paymentId: body.paymentId || body.payment_id,
      signature: body.signature || req.headers.get('x-razorpay-signature') || '',
      amount: Number(body.amount),
      currency: body.currency || 'INR',
      email: body.email,
      fullName: body.fullName || body.name || 'Enrolled Student',
      phone: body.phone,
      planSlug: body.planSlug || body.plan_slug,
      trackSlug: body.trackSlug || body.track_slug || 'genai-llm',
      rawPayload: JSON.stringify(body),
    };

    const result = await PaymentService.processPaymentConfirmation(payload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
