import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

import {
  Users,
  Activity,
  TrendingUp,
  Award,
  LogOut
} from 'lucide-react';

import StudentManagement from './StudentManagement';
import Analytics from './Analytics';
import ContentManager from './ContentManager';
import BulkContentManager from './BulkContentManager';
import AnnouncementManager from './AnnouncementManager';
import LiveSessionManager from './LiveSessionManager';
import ReviewModeration from './ReviewModeration';
import ReviewAnalytics from './ReviewAnalytics';
import RoleManager from './RoleManager';
import UserRoleAssignment from './UserRoleAssignment';
import ComprehensiveAnalytics from './ComprehensiveAnalytics';

import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'instructor' | 'admin';
  is_admin?: boolean;
}

// Only allow admin or instructor (never student)
const safeRole = (
  role: string | null | undefined
): "admin" | "instructor" => {
  return role === "admin" || role === "instructor" ? role : "instructor";
};

const AdminDashboard: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    completionRate: 0,
    certificatesIssued: 0
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // --------------------------
  // CHECK ADMIN ACCESS
  // --------------------------
  useEffect(() => {
    checkAdminAccess();
    fetchDashboardStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');

      const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();


      const adminRoles = ['admin', 'super_admin', 'content_manager', 'moderator', 'support_staff'];

      const isAllowed =
        profile &&
        (
          profile.is_admin === true ||
          adminRoles.includes(profile.role)
        );

      if (!isAllowed) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        return navigate('/admin/login');
      }

      setUserProfile(profile);

    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // FETCH METRICS
  // --------------------------
  const fetchDashboardStats = async () => {
    try {
      const { count: totalStudents } = await supabase
        .from('public.profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student');

      const today = new Date().toISOString().split('T')[0];

      const { count: activeToday } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .gte('last_accessed', today);

      const { count: certificatesIssued } = await supabase
        .from('certificates')
        .select('*', { count: 'exact' });

      const { data: completions } = await supabase
        .from('user_progress')
        .select('days_completed');

      const completionRate =
        completions && completions.length > 0
          ? Math.round(
              (completions.filter(c => c.days_completed?.length >= 7).length /
                completions.length) *
              100
            )
          : 0;

      setStats({
        totalStudents: totalStudents || 0,
        activeToday: activeToday || 0,
        completionRate,
        certificatesIssued: certificatesIssued || 0
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // --------------------------
  // SIGN OUT
  // --------------------------
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Signed Out", description: "You have been signed out." });
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  // --------------------------
  // LOADING INDICATOR
  // --------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600" />
      </div>
    );
  }

  // --------------------------
  // MAIN RETURN
  // --------------------------
  return (
    <div className="min-h-screen bg-ivory lotus-pattern p-6">
      <div className="max-w-7xl mx-auto">

        {/* --------------------------
            HEADER
        -------------------------- */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display gold-gradient-text">Admin Dashboard</h1>
            <p className="text-charcoal/70 mt-2">
              Welcome back, {userProfile?.full_name}
              <span className="ml-2 px-3 py-1 bg-gold/20 text-gold text-xs rounded-full font-medium">
                {userProfile?.role}
              </span>
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* --------------------------
            STUDENT PREVIEW PANEL
        -------------------------- */}
        <div className="w-full mt-6 p-4 bg-white/70 rounded-xl shadow-sm border border-gold/20">
          <h2 className="text-xl font-display mb-3 gold-gradient-text">
            Student View (Preview & Edit)
          </h2>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate('/class/daily')}>Daily Lessons</Button>
            <Button variant="outline" onClick={() => navigate('/class/dashboard')}>Student Dashboard</Button>
            <Button variant="outline" onClick={() => navigate('/class/resources')}>Resources Library</Button>
            <Button variant="outline" onClick={() => navigate('/class/progress')}>Progress</Button>
            <Button variant="outline" onClick={() => navigate('/class/forum')}>Forum</Button>
            <Button variant="outline" onClick={() => navigate('/class/messages')}>Messages</Button>
            <Button variant="outline" onClick={() => navigate('/class/offline')}>Offline Mode</Button>
            <Button variant="outline" onClick={() => navigate('/class/live')}>Live Sessions</Button>
            <Button variant="outline" onClick={() => navigate('/class/certificate')}>Certificate Page</Button>
            <Button variant="outline" onClick={() => navigate('/class/email')}>Email Tool</Button>
          </div>
        </div>

        {/* --------------------------
            METRIC CARDS
        -------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-8">

          <Card className="lotus-card">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Total Students</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <Users className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl gold-text">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="lotus-card">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Active Today</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <Activity className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl gold-text">{stats.activeToday}</div>
            </CardContent>
          </Card>

          <Card className="lotus-card">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Completion Rate</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <TrendingUp className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl gold-text">{stats.completionRate}%</div>
            </CardContent>
          </Card>

          <Card className="lotus-card">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Certificates</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <Award className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl gold-text">{stats.certificatesIssued}</div>
            </CardContent>
          </Card>

        </div>

        {/* --------------------------
            ADMIN TABS (PERMISSION SECURED)
        -------------------------- */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid grid-cols-11">

            {hasPermission('can_view_analytics') && (
              <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
            )}

            {hasPermission('can_manage_users') && (
              <TabsTrigger value="students">Students</TabsTrigger>
            )}

            {hasPermission('can_view_analytics') && (
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            )}

            {hasPermission('can_edit_content') && (
              <TabsTrigger value="content">Content</TabsTrigger>
            )}

            {hasPermission('can_publish_content') && (
              <TabsTrigger value="bulk">Bulk Edit</TabsTrigger>
            )}

            {hasPermission('can_manage_sessions') && (
              <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
            )}

            {hasPermission('can_send_notifications') && (
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            )}

            {hasPermission('can_moderate_reviews') && (
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            )}

            {hasPermission('can_view_analytics') && (
              <TabsTrigger value="review-analytics">Review Stats</TabsTrigger>
            )}

            {hasPermission('can_manage_roles') && (
              <TabsTrigger value="roles">Roles</TabsTrigger>
            )}

            {hasPermission('can_manage_users') && (
              <TabsTrigger value="users">User Roles</TabsTrigger>
            )}

          </TabsList>

          {hasPermission('can_view_analytics') && (
            <TabsContent value="comprehensive">
              <ComprehensiveAnalytics />
            </TabsContent>
          )}

          {hasPermission('can_manage_users') && (
            <TabsContent value="students">
              <StudentManagement userRole={safeRole(userProfile?.role)} />
            </TabsContent>
          )}

          {hasPermission('can_view_analytics') && (
            <TabsContent value="analytics">
              <Analytics userRole={safeRole(userProfile?.role)} />
            </TabsContent>
          )}

          {hasPermission('can_edit_content') && (
            <TabsContent value="content">
              <ContentManager userRole={safeRole(userProfile?.role)} />
            </TabsContent>
          )}

          {hasPermission('can_publish_content') && (
            <TabsContent value="bulk">
              <BulkContentManager />
            </TabsContent>
          )}

          {hasPermission('can_manage_sessions') && (
            <TabsContent value="sessions">
              <LiveSessionManager userRole={safeRole(userProfile?.role)} />
            </TabsContent>
          )}

          {hasPermission('can_send_notifications') && (
            <TabsContent value="announcements">
              <AnnouncementManager userRole={safeRole(userProfile?.role)} />
            </TabsContent>
          )}

          {hasPermission('can_moderate_reviews') && (
            <TabsContent value="reviews">
              <ReviewModeration />
            </TabsContent>
          )}

          {hasPermission('can_view_analytics') && (
            <TabsContent value="review-analytics">
              <ReviewAnalytics />
            </TabsContent>
          )}

          {hasPermission('can_manage_roles') && (
            <TabsContent value="roles">
              <RoleManager />
            </TabsContent>
          )}

          {hasPermission('can_manage_users') && (
            <TabsContent value="users">
              <UserRoleAssignment />
            </TabsContent>
          )}

        </Tabs>

        {/* --------------------------
            FOOTER
        -------------------------- */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Main Site
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
