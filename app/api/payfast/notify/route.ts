import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const signature = body.signature;

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Build signature string (excluding signature field)
    const signatureData = { ...body };
    delete signatureData.signature;

    const signatureString = Object.keys(signatureData)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(signatureData[key])}`)
      .join('&');

    const generatedSignature = crypto
      .createHash('md5')
      .update(`${signatureString}${passphrase ? `&passphrase=${encodeURIComponent(passphrase)}` : ''}`)
      .digest('hex');

    if (signature !== generatedSignature) {
      console.error('Invalid PayFast signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = body.custom_int1;
    const paymentStatus = body.payment_status;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Handle different payment statuses
    if (paymentStatus === 'COMPLETE') {
      // Payment successful - update subscription
      const { error } = await supabase
        .from('profiles')
        .update({
          subscribed: true,
          payment_id: body.pf_payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update subscription:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      // Payment failed or cancelled - don't change subscription
      console.log(`Payment ${paymentStatus} for user ${userId}`);
      return NextResponse.json({ success: true });
    }

    // Unknown status - still return success to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayFast webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
