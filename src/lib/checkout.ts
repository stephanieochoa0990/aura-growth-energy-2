import { supabase } from '@/lib/supabase';
import { ACTIVE_COURSE_ID } from '@/lib/course';

export const PENDING_CHECKOUT_COURSE_ID_KEY = 'pending_checkout_course_id';

export function setPendingCheckout(courseId = ACTIVE_COURSE_ID) {
  sessionStorage.setItem(PENDING_CHECKOUT_COURSE_ID_KEY, courseId);
  console.debug('[checkout] pending checkout stored', {
    courseId,
    storageKey: PENDING_CHECKOUT_COURSE_ID_KEY,
  });
}

export function getPendingCheckoutCourseId() {
  return sessionStorage.getItem(PENDING_CHECKOUT_COURSE_ID_KEY);
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(PENDING_CHECKOUT_COURSE_ID_KEY);
}

export async function startCheckout(courseId = ACTIVE_COURSE_ID): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.debug('[checkout] startCheckout invoked', {
    courseId,
    hasUser: Boolean(user),
    userId: user?.id,
    userError: userError?.message,
  });

  if (userError || !user) {
    throw new Error('Please sign in or create an account before enrolling.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  console.debug('[checkout] session before create-checkout-session invoke', {
    hasSession: Boolean(sessionData.session),
    hasAccessToken: Boolean(accessToken),
    accessTokenLength: accessToken?.length,
    sessionError: sessionError?.message,
  });

  if (!accessToken) {
    throw new Error('Your sign-in session is not ready. Please refresh and try again.');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      course_id: courseId,
    },
  });

  console.debug('[checkout] create-checkout-session invoke completed', {
    hasData: Boolean(data),
    hasUrl: Boolean(data?.url),
    errorMessage: error?.message,
  });

  if (error) {
    throw new Error(error.message || 'Could not start checkout.');
  }

  if (!data?.url) {
    throw new Error('Checkout URL was not returned.');
  }

  window.location.href = data.url;
}
