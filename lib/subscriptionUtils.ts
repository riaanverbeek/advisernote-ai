import { createClient } from '@supabase/supabase-js';

export async function updateUserSubscription(
  userId: string,
  subscribed: boolean
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ subscribed, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
}

export async function getUserSubscriptionStatus(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscribed')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { subscribed: data?.subscribed || false };
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return { subscribed: false };
  }
}
