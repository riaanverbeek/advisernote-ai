import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Session {
  access_token: string;
  user: {
    id: string;
    email?: string;
  };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSession({
            access_token: session.access_token,
            user: {
              id: session.user.id,
              email: session.user.email,
            },
          });
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession({
          access_token: session.access_token,
          user: {
            id: session.user.id,
            email: session.user.email,
          },
        });
      } else {
        setSession(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
}
