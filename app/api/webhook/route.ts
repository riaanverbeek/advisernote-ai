import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This webhook handles payment provider events (e.g., Stripe, Paddle)
// Update based on your payment provider

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Verify webhook signature (implement based on your payment provider)
    const isValid = verifyWebhookSignature(request, payload);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle different event types
    if (payload.type === 'customer.subscription.created' || payload.type === 'charge.succeeded') {
      // User subscribed
      const userId = payload.data.metadata?.user_id || payload.data.customer_id;

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscribed: true,
            subscription_id: payload.data.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }
    }

    if (payload.type === 'customer.subscription.deleted' || payload.type === 'charge.refunded') {
      // User subscription cancelled/refunded
      const userId = payload.data.metadata?.user_id || payload.data.customer_id;

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscribed: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error cancelling subscription:', error);
          return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }
    }

    // Unknown event type
    return NextResponse.json(
      { message: 'Event received but not processed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(request: NextRequest, payload: any): boolean {
  // TODO: Implement signature verification based on your payment provider
  // For Stripe: Use stripe.webhooks.constructEvent()
  // For Paddle: Use SHA256 HMAC verification
  // For development, you can accept all requests

  const secretKey = process.env.WEBHOOK_SECRET;
  const signature = request.headers.get('x-signature') || request.headers.get('stripe-signature');

  if (!secretKey || !signature) {
    console.warn('Missing webhook secret or signature');
    // In production, return false. For development:
    return process.env.NODE_ENV === 'development';
  }

  // Implement signature verification here based on your provider
  // This is a placeholder that should be replaced with actual verification logic
  return true;
}
