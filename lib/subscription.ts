import { createClient } from '@supabase/supabase-js';

export async function checkSubscriptionStatus(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscribed')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { isActive: false, profile: null };
    }

    return { isActive: data.subscribed === true, profile: data };
  } catch (error) {
    console.error('Subscription check error:', error);
    return { isActive: false, profile: null };
  }
}

export async function getUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
