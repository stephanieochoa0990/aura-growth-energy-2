import { supabase } from './supabase';

/**
 * Decode JWT token to view claims (for debugging)
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const claims = decodeJWT(token);
  if (!claims || !claims.exp) return true;
  
  const expiryTime = claims.exp * 1000; // Convert to milliseconds
  return Date.now() >= expiryTime;
}

/**
 * Get time until token expires
 */
export function getTokenTimeRemaining(token: string): number {
  const claims = decodeJWT(token);
  if (!claims || !claims.exp) return 0;
  
  const expiryTime = claims.exp * 1000;
  const remaining = expiryTime - Date.now();
  return Math.max(0, remaining);
}

/**
 * Comprehensive token diagnostics
 */
export async function diagnoseToken(): Promise<{
  hasSession: boolean;
  hasToken: boolean;
  isExpired: boolean;
  timeRemaining: number;
  claims: any;
  userId: string | null;
  email: string | null;
  isAdmin: boolean | null;
  role: string | null;
  errors: string[];
}> {
  const errors: string[] = [];
  const result = {
    hasSession: false,
    hasToken: false,
    isExpired: true,
    timeRemaining: 0,
    claims: null,
    userId: null,
    email: null,
    isAdmin: null,
    role: null,
    errors
  };

  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      errors.push(`Session error: ${sessionError.message}`);
      return result;
    }

    if (!session) {
      errors.push('No active session');
      return result;
    }

    result.hasSession = true;

    // Check token
    const token = session.access_token;
    if (!token) {
      errors.push('No access token in session');
      return result;
    }

    result.hasToken = true;

    // Decode token
    const claims = decodeJWT(token);
    result.claims = claims;

    if (!claims) {
      errors.push('Failed to decode token');
      return result;
    }

    // Check expiry
    result.isExpired = isTokenExpired(token);
    result.timeRemaining = getTokenTimeRemaining(token);

    if (result.isExpired) {
      errors.push('Token is expired');
    }

    // Get user info
    result.userId = claims.sub || null;
    result.email = claims.email || null;

    // Check admin status from database
    if (result.userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', result.userId)
        .maybeSingle();

      if (profileError) {
        errors.push(`Profile query error: ${profileError.message}`);
      } else if (!profile) {
        errors.push('Profile not found in database');
      } else {
        result.isAdmin = profile.is_admin;
        result.role = profile.role;
      }
    }

  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message}`);
  }

  return result;
}

/**
 * Log token diagnostics to console
 */
export async function logTokenDiagnostics(): Promise<void> {
  console.group('🔐 Token Diagnostics');
  
  const diag = await diagnoseToken();
  
  console.log('Session:', diag.hasSession ? '✅' : '❌');
  console.log('Token:', diag.hasToken ? '✅' : '❌');
  console.log('Expired:', diag.isExpired ? '❌ YES' : '✅ NO');
  
  if (diag.timeRemaining > 0) {
    const minutes = Math.floor(diag.timeRemaining / 60000);
    console.log(`Time Remaining: ${minutes} minutes`);
  }
  
  console.log('User ID:', diag.userId || 'N/A');
  console.log('Email:', diag.email || 'N/A');
  console.log('Is Admin:', diag.isAdmin === true ? '✅ YES' : '❌ NO');
  console.log('Role:', diag.role || 'N/A');
  
  if (diag.claims) {
    console.log('JWT Claims:', diag.claims);
  }
  
  if (diag.errors.length > 0) {
    console.error('Errors:', diag.errors);
  }
  
  console.groupEnd();
}
