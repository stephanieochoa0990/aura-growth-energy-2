import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

/**
 * Get the current authenticated session with automatic refresh
 * This ensures the token is valid before making API calls
 */
export async function getAuthenticatedSession(): Promise<{
  session: Session | null;
  user: User | null;
  error?: string;
}> {
  try {
    // Get current session and refresh if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { session: null, user: null, error: sessionError.message };
    }

    if (!session) {
      // No session is not an error - user just isn't logged in
      return { session: null, user: null };
    }


    // Verify the session is still valid by getting the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User verification error:', userError);
      
      // Try to refresh the session if user verification fails
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        return { session: null, user: null, error: 'Session expired. Please log in again.' };
      }
      
      return { session: refreshData.session, user: refreshData.user, error: undefined };
    }

    return { session, user, error: undefined };
  } catch (error) {
    console.error('Authentication error:', error);
    return { session: null, user: null, error: 'Authentication failed' };
  }
}

/**
 * Execute a Supabase query with authentication check
 * Ensures the user is authenticated before running the query
 */
export async function authenticatedQuery<T>(
  queryFn: (userId: string) => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  const { session, user, error } = await getAuthenticatedSession();
  
  if (error || !user) {
    return { data: null, error: error || 'Not authenticated' };
  }

  try {
    const data = await queryFn(user.id);
    return { data, error: null };
  } catch (err) {
    console.error('Query error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Query failed' };
  }
}

/**
 * Set up an auth state change listener with automatic session refresh
 */
export function setupAuthListener(
  onAuthChange: (session: Session | null, user: User | null) => void
) {
  // Initial session check
  getAuthenticatedSession().then(({ session, user }) => {
    onAuthChange(session, user);
  });

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT') {
        onAuthChange(null, null);
        return;
      }
      
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        onAuthChange(session, user);
      } else {
        onAuthChange(null, null);
      }
    }
  );

  return subscription;
}

/**
 * Ensure RLS policies work by checking authentication before queries
 */
export async function ensureAuthenticated(): Promise<boolean> {
  const { session, error } = await getAuthenticatedSession();
  
  if (error) {
    console.error('Authentication check failed:', error);
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    return false;
  }
  
  return !!session;
}