import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminRouteProps {
  children: ReactNode;
}

const ADMIN_ROLES = ['admin', 'super_admin', 'content_manager', 'moderator', 'support_staff'];

export default function AdminRoute({ children }: AdminRouteProps) {
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState('denied');
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

      if (!cancelled) setState(isAdmin ? 'allowed' : 'denied');
    }

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking admin access...</span>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
