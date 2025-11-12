import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedSession, ensureAuthenticated } from '@/lib/auth-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePWA } from '@/hooks/usePWA';
import { 
  LogOut, Calendar, BarChart3, Video, BookOpen, Trophy, 
  Users, MessageSquare, Download, Award, Mail, Bell, 
  Smartphone, WifiOff 
} from 'lucide-react';
import AuthForm from './portal/AuthForm';
import DailyContent from './portal/DailyContent';
import CommunityHub from './community/CommunityHub';
import ResourceLibrary from './portal/ResourceLibrary';
import ProgressTracker from './portal/ProgressTracker';
import ProgressDashboard from './portal/ProgressDashboard';
import { CertificateGenerator } from './portal/CertificateGenerator';
import { EmailPreferences } from './portal/EmailPreferences';
import LiveSessionsView from './portal/LiveSessionsView';
import MessagingHub from './messaging/MessagingHub';
export default function StudentPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { toast } = useToast();
  const { 
    isOffline, 
    canInstall, 
    isInstalled,
    notificationPermission,
    installApp, 
    requestNotificationPermission,
    sendNotification 
  } = usePWA();

  useEffect(() => {
    checkUser();
    fetchNotifications();
    
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        setUnreadNotifications(prev => prev + 1);
        sendNotification(payload.new.title, {
          body: payload.new.body,
          tag: payload.new.id
        });
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  async function checkUser() {
    try {
      // Use the auth helper to ensure we have a valid session
      const { session, user, error } = await getAuthenticatedSession();
      
      if (error) {
        console.error('Auth error:', error);
        setLoading(false);
        return;
      }
      
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
  }
  
  async function fetchNotifications() {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false);
      
    if (data) {
      setUnreadNotifications(data.length);
    }
  }
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-[#D4AF37] text-base sm:text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }


  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <header className="bg-black border-b-2 border-gold">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display gold-gradient-text tracking-tight">Your Journey</h1>
              <p className="text-white/70 mt-2 text-base sm:text-lg">Welcome, {profile?.full_name || user.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {canInstall && !isInstalled && (
                <Button
                  onClick={installApp}
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold hover:text-black min-h-[44px] w-full sm:w-auto text-base"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
              
              {notificationPermission !== 'granted' && (
                <Button
                  onClick={requestNotificationPermission}
                  variant="outline"
                  className="border-gold-light text-gold-light hover:bg-gold-light hover:text-black min-h-[44px] w-full sm:w-auto text-base"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
              
              {isOffline && (
                <Badge variant="destructive" className="flex items-center gap-1 justify-center py-2">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </Badge>
              )}
              
              {unreadNotifications > 0 && (
                <Badge className="bg-gold text-black justify-center py-2">
                  {unreadNotifications} New
                </Badge>
              )}
              
              <Button 
                onClick={handleSignOut}
                className="btn-gold-outline min-h-[44px] w-full sm:w-auto text-base"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="gold-divider my-6"></div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-white/60">Your Journey Progress</span>
              <span className="text-sm gold-text font-semibold">Day {profile?.current_day || 1} of 7</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 border border-gold/30">
              <div 
                className="bg-gradient-to-r from-gold via-gold-light to-gold h-3 rounded-full transition-all duration-500 gold-glow"
                style={{ width: `${(profile?.current_day || 1) * 14.3}%` }}
              />
            </div>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="daily" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-ivory border border-gold/20 inline-flex sm:grid sm:grid-cols-5 lg:grid-cols-10 min-w-max sm:min-w-0 sm:w-full">
              <TabsTrigger value="daily" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Calendar className="w-4 h-4 mr-2" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Video className="w-4 h-4 mr-2" />
                Live
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Trophy className="w-4 h-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Users className="w-4 h-4 mr-2" />
                Forum
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="offline" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Offline
              </TabsTrigger>
              <TabsTrigger value="certificate" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Award className="w-4 h-4 mr-2" />
                Certificate
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal px-3 py-2 text-sm whitespace-nowrap hover:text-gold transition-colors">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily" className="space-y-4">
            <DailyContent currentDay={profile?.current_day || 1} userId={user.id} />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <ProgressDashboard userId={user.id} currentDay={profile?.current_day || 1} />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <LiveSessionsView />
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-4">
            <ResourceLibrary userId={user.id} />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <ProgressTracker userId={user.id} currentDay={profile?.current_day || 1} />
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <CommunityHub userId={user.id} userProfile={profile} />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <MessagingHub />
          </TabsContent>

          <TabsContent value="offline" className="space-y-4">
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Offline Content Manager</h3>
              <p className="text-gray-600 text-sm sm:text-base">Download course materials for offline access. Feature coming soon.</p>
            </Card>
          </TabsContent>

          <TabsContent value="certificate" className="space-y-4">
            <CertificateGenerator />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <EmailPreferences />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
