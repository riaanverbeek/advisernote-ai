import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const payment_status = formData.get('payment_status');
    const userId = formData.get('m_payment_id');

    if (payment_status === 'COMPLETE' && userId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from('profiles')
        .update({ subscribed: true })
        .eq('id', userId);
    }

    return new Response('OK');
  } catch (error) {
    console.error('PayFast ITN error:', error);
    return new Response('OK'); // Always return OK
  }
}

