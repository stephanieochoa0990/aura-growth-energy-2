import { supabase } from '@/lib/supabase';

/**
 * Helper function to invoke Supabase Edge Functions with authentication
 * Automatically retrieves and includes the Bearer token in request headers
 */
export async function invokeWithAuth<T = any>(
  functionName: string,
  body?: Record<string, any>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { data: null, error: sessionError };
    }

    if (!session) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Invoke the edge function with Bearer token
    // Invoke the edge function with Bearer token
    const response = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    // Log full response for debugging
    console.log(`Edge function ${functionName} response:`, {
      data: response.data,
      error: response.error,
      status: (response as any).status
    });

    if (response.error) {
      // Extract detailed error message from response
      const errorMsg = response.data?.error || response.error.message || `Edge function '${functionName}' failed`;
      console.error(`Edge function ${functionName} error:`, errorMsg);
      return { data: null, error: new Error(errorMsg) };
    }

    // Check if response data indicates an error
    if (response.data?.error) {
      return { data: null, error: new Error(response.data.error) };
    }

    return { data: response.data, error: null };

  } catch (err) {
    const error = err as Error;
    return { data: null, error: new Error(`Failed to call ${functionName}: ${error.message}`) };
  }
}
