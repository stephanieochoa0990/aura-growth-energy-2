import { supabase } from '@/lib/supabase';
import { ACTIVE_COURSE_ID } from '@/lib/course';

export const PENDING_CHECKOUT_COURSE_ID_KEY = 'pending_checkout_course_id';

export function setPendingCheckout(courseId = ACTIVE_COURSE_ID) {
  sessionStorage.setItem(PENDING_CHECKOUT_COURSE_ID_KEY, courseId);
}

export function getPendingCheckoutCourseId() {
  return sessionStorage.getItem(PENDING_CHECKOUT_COURSE_ID_KEY);
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(PENDING_CHECKOUT_COURSE_ID_KEY);
}

export async function startCheckout(courseId = ACTIVE_COURSE_ID): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Please sign in or create an account before enrolling.');
  }

  const { data: sessionData } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
    body: {
      course_id: courseId,
      user_id: user.id,
    },
  });

  if (error) {
    throw new Error(error.message || 'Could not start checkout.');
  }

  if (!data?.url) {
    throw new Error('Checkout URL was not returned.');
  }

  window.location.href = data.url;
}
