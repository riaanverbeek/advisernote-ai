import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserFromRequest } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { amount, itemName } = await request.json();

    if (!amount || !itemName) {
      return NextResponse.json(
        { error: 'Amount and item name required' },
        { status: 400 }
      );
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    if (!merchantId || !merchantKey) {
      return NextResponse.json(
        { error: 'PayFast not configured' },
        { status: 500 }
      );
    }

    // Build PayFast data
    const payfastData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pricing`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/payfast/notify`,
      name_first: user.user_metadata?.first_name || 'Customer',
      name_last: user.user_metadata?.last_name || '',
      email_address: user.email,
      item_name: itemName,
      item_description: `Subscription - ${itemName}`,
      amount: (parseFloat(amount.toString()) * 100).toFixed(0), // Convert to cents
      item_id: 1,
      custom_int1: user.id, // Store user ID for webhook
      payment_method: 'cc',
    };

    // Generate signature
    const signatureString = Object.keys(payfastData)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(payfastData[key as keyof typeof payfastData])}`)
      .join('&');

    const signature = crypto
      .createHash('md5')
      .update(`${signatureString}${passphrase ? `&passphrase=${encodeURIComponent(passphrase)}` : ''}`)
      .digest('hex');

    return NextResponse.json({
      data: payfastData,
      signature,
      url: 'https://www.payfast.co.za/eng/process',
    });
  } catch (error) {
    console.error('PayFast error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayFast payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // PayFast return handling
    const searchParams = request.nextUrl.searchParams;
    const signature = searchParams.get('signature');
    const payfastId = searchParams.get('pf_payment_id');

    if (!signature || !payfastId) {
      return NextResponse.json(
        { error: 'Invalid payment response' },
        { status: 400 }
      );
    }

    // Verify signature
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const signatureData = Object.fromEntries(searchParams.entries());
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
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Payment verified - redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard?payment=success', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001')
    );
  } catch (error) {
    console.error('PayFast verification error:', error);
    return NextResponse.redirect(
      new URL('/pricing?error=verification_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001')
    );
  }
}
