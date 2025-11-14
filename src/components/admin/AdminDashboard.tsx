import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Bell, 
  Settings,
  Award,
  Calendar,
  Activity,
  Video,
  Star,
  MessageSquare,
  Shield,
  UserCog,
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
}

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
  const { permissions, hasPermission, role, isAdmin } = usePermissions();


  useEffect(() => {
    checkAdminAccess();
    fetchDashboardStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Check if user has any admin role
      const adminRoles = ['super_admin', 'content_manager', 'moderator', 'support_staff'];
      if (!profile || (!profile.is_admin && !adminRoles.includes(profile.role))) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };
  const fetchDashboardStats = async () => {
  try {
    // Total students (profiles where NOT admin)
    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .or('is_admin.eq.false,is_admin.is.null');

    // Active today
    const today = new Date().toISOString().split('T')[0];
    const { count: activeToday } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact' })
      .gte('last_accessed', today);

    // Certificates
    const { count: certificatesIssued } = await supabase
      .from('certificates')
      .select('*', { count: 'exact' });

    // Completion rate
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
      certificatesIssued: certificatesIssued || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory lotus-pattern p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display gold-gradient-text">Admin Dashboard</h1>
            <p className="text-charcoal/70 mt-2">
              Welcome back, {userProfile?.full_name || 'Administrator'}
              <span className="ml-2 px-3 py-1 bg-gold/20 text-gold text-xs rounded-full font-medium">
                {userProfile?.role}
              </span>
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="lotus-card hover:gold-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-charcoal/80">Total Students</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <Users className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display gold-text">{stats.totalStudents}</div>
              <p className="text-xs text-charcoal/60">Enrolled in course</p>
            </CardContent>
          </Card>

          <Card className="lotus-card hover:gold-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-charcoal/80">Active Today</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <Activity className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display gold-text">{stats.activeToday}</div>
              <p className="text-xs text-charcoal/60">Students learning</p>
            </CardContent>
          </Card>

          <Card className="lotus-card hover:gold-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-charcoal/80">Completion Rate</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <TrendingUp className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display gold-text">{stats.completionRate}%</div>
              <p className="text-xs text-charcoal/60">Finished all 7 days</p>
            </CardContent>
          </Card>

          <Card className="lotus-card hover:gold-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-charcoal/80">Certificates</CardTitle>
              <div className="p-2 rounded-full bg-gold/10">
                <Award className="h-4 w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display gold-text">{stats.certificatesIssued}</div>
              <p className="text-xs text-charcoal/60">Issued to date</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-4">

          <TabsList className="grid w-full grid-cols-11">
            {hasPermission('can_view_analytics') && <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>}
            {hasPermission('can_manage_users') && <TabsTrigger value="students">Students</TabsTrigger>}
            {hasPermission('can_view_analytics') && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
            {hasPermission('can_edit_content') && <TabsTrigger value="content">Content</TabsTrigger>}
            {hasPermission('can_publish_content') && <TabsTrigger value="bulk">Bulk Edit</TabsTrigger>}
            {hasPermission('can_manage_sessions') && <TabsTrigger value="sessions">Live Sessions</TabsTrigger>}
            {hasPermission('can_send_notifications') && <TabsTrigger value="announcements">Announcements</TabsTrigger>}
            {hasPermission('can_moderate_reviews') && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
            {hasPermission('can_view_analytics') && <TabsTrigger value="review-analytics">Review Stats</TabsTrigger>}
            {hasPermission('can_manage_roles') && <TabsTrigger value="roles">Roles</TabsTrigger>}
            {hasPermission('can_manage_users') && <TabsTrigger value="users">User Roles</TabsTrigger>}
          </TabsList>

          {hasPermission('can_view_analytics') && (
            <TabsContent value="comprehensive">
              <ComprehensiveAnalytics />
            </TabsContent>
          )}

{hasPermission('can_manage_users') && (
  <TabsContent value="students">
    <StudentManagement userRole="admin" />
  </TabsContent>
)}

{hasPermission('can_view_analytics') && (
  <TabsContent value="analytics">
    <Analytics userRole="admin" />
  </TabsContent>
)}

{hasPermission('can_edit_content') && (
  <TabsContent value="content">
    <ContentManager userRole="admin" />
  </TabsContent>
)}

{hasPermission('can_publish_content') && (
  <TabsContent value="bulk">
    <BulkContentManager />
  </TabsContent>
)}

{hasPermission('can_manage_sessions') && (
  <TabsContent value="sessions">
    <LiveSessionManager userRole="admin" />
  </TabsContent>
)}

{hasPermission('can_send_notifications') && (
  <TabsContent value="announcements">
    <AnnouncementManager userRole="admin" />
  </TabsContent>
)}

          {hasPermission('can_moderate_reviews') && (
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Review Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewModeration />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasPermission('can_view_analytics') && (
            <TabsContent value="review-analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Review Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewAnalytics />
                </CardContent>
              </Card>
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



        {/* Back to Site Button */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
          >
            Back to Main Site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;