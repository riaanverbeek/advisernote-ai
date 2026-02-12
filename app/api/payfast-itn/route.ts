import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const data: Record<string, string> = {};

    // Convert FormData to object
    for (const [key, value] of body.entries()) {
      data[key] = value as string;
    }

    const signature = data.signature;

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Get environment variables
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    if (!merchantId) {
      console.error('PayFast merchant ID not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Verify merchant ID
    if (data.merchant_id !== merchantId) {
      console.error('Invalid merchant ID in ITN');
      return NextResponse.json({ error: 'Invalid merchant' }, { status: 401 });
    }

    // Build signature string (excluding signature field)
    const signatureData = { ...data };
    delete signatureData.signature;

    const pfParamString = Object.keys(signatureData)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(signatureData[key])}`)
      .join('&');

    const generatedSignature = crypto
      .createHash('md5')
      .update(`${pfParamString}${passphrase ? `&passphrase=${encodeURIComponent(passphrase)}` : ''}`)
      .digest('hex');

    // Verify signature
    if (signature !== generatedSignature) {
      console.error('Invalid PayFast ITN signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Verify with PayFast server (production only)
    if (process.env.NODE_ENV === 'production') {
      const verifyResponse = await fetch('https://www.payfast.co.za/eng/query/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });

      if (!verifyResponse.ok) {
        console.error('PayFast server verification failed');
        return NextResponse.json({ status: 202 }); // Accept but don't process
      }
    }

    // Process the payment
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = data.m_payment_id; // User ID stored as m_payment_id
    const paymentStatus = data.payment_status;
    const payfastPaymentId = data.pf_payment_id;

    if (!userId) {
      console.error('Missing user ID in ITN');
      return NextResponse.json({ status: 200 });
    }

    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      const { error } = await supabase
        .from('profiles')
        .update({
          subscribed: true,
          payment_id: payfastPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update subscription:', error);
        return NextResponse.json({ status: 200 }); // Accept anyway
      }

      console.log(`Payment confirmed for user ${userId}`);
      return NextResponse.json({ status: 200 });
    }

    if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      console.log(`Payment ${paymentStatus} for user ${userId}`);
      // Payment failed or cancelled - don't update subscription
      return NextResponse.json({ status: 200 });
    }

    // Unknown status - acknowledge receipt
    console.log(`Unknown payment status: ${paymentStatus}`);
    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error('PayFast ITN error:', error);
    return NextResponse.json({ status: 200 }); // Always return 200 for ITN
  }
}
