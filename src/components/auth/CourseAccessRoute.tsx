import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ACTIVE_COURSE_ID, ACTIVE_ENROLLMENT_STATUSES } from '@/lib/course';
import AuthForm from '@/components/portal/AuthForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CourseAccessRouteProps {
  children: ReactNode;
}

const ADMIN_ROLES = ['admin', 'super_admin', 'content_manager', 'moderator', 'support_staff'];

export default function CourseAccessRoute({ children }: CourseAccessRouteProps) {
  const [state, setState] = useState<'loading' | 'unauthenticated' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) setState('unauthenticated');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .maybeSingle();

        const isAdmin =
          profile?.is_admin === true ||
          ADMIN_ROLES.includes(profile?.role);

        if (isAdmin) {
          if (!cancelled) setState('allowed');
          return;
        }

        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, status, access_expires_at')
          .eq('user_id', user.id)
          .eq('course_id', ACTIVE_COURSE_ID)
          .in('status', ACTIVE_ENROLLMENT_STATUSES)
          .maybeSingle();

        if (enrollmentError || !enrollment) {
          if (!cancelled) setState('denied');
          return;
        }

        const expiresAt = enrollment.access_expires_at
          ? new Date(enrollment.access_expires_at).getTime()
          : null;
        const hasNotExpired = expiresAt === null || expiresAt > Date.now();

        if (!cancelled) setState(hasNotExpired ? 'allowed' : 'denied');
      } catch (error) {
        console.error('Course access check failed:', error);
        if (!cancelled) setState('denied');
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking access...</span>
        </div>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <AuthForm />;
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-[#D4AF37]/20 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <Lock className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-[#D4AF37]">Course Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-gray-300">
              Your account is signed in, but it does not have an active enrollment for this course yet.
            </p>
            <Button asChild className="bg-[#D4AF37] text-black hover:bg-yellow-600">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
