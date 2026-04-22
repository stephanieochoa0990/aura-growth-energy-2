import { supabase } from '@/lib/supabase';
import { ACTIVE_COURSE_ID } from '@/lib/course';

export async function startCheckout(courseId = ACTIVE_COURSE_ID): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Please sign in or create an account before enrolling.');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
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

