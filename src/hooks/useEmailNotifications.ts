import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useEmailNotifications() {
  const { toast } = useToast();

  const sendEmail = async (
    emailType: 'welcome' | 'day_completed' | 'certificate_earned' | 'missed_day' | 'weekly_progress',
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, skipping email notification');
        return;
      }

      // Check user preferences
      const { data: preferences } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Check if this email type is enabled
      const shouldSend = () => {
        switch (emailType) {
          case 'welcome':
            return true; // Always send welcome emails
          case 'day_completed':
            return preferences?.daily_completion ?? true;
          case 'certificate_earned':
            return preferences?.certificate_earned ?? true;
          case 'missed_day':
            return preferences?.missed_day_reminder ?? true;
          case 'weekly_progress':
            return preferences?.weekly_progress ?? true;
          default:
            return false;
        }
      };

      if (!shouldSend()) {
        console.log(`Email type ${emailType} is disabled in preferences`);
        return;
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          emailType,
          userId: user.id,
          recipientEmail: user.email,
          metadata: {
            ...metadata,
            userName: profile?.full_name || 'Student'
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      // Log success for certain types
      if (emailType === 'day_completed' || emailType === 'certificate_earned') {
        toast({
          title: "Email Sent",
          description: "Check your inbox for confirmation.",
        });
      }

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't show error toast for background emails
      if (emailType === 'welcome' || emailType === 'day_completed') {
        toast({
          title: "Email Error",
          description: "Failed to send notification email.",
          variant: "destructive"
        });
      }
    }
  };


  const checkMissedDays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check last activity
      const { data: activity } = await supabase
        .from('user_activity')
        .select('last_active')
        .eq('user_id', user.id)
        .single();

      if (activity) {
        const lastActive = new Date(activity.last_active);
        const now = new Date();
        const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        // Send reminder if inactive for more than 2 days
        if (daysSinceActive > 2) {
          await sendEmail('missed_day', { daysSinceActive });
        }
      }
    } catch (error) {
      console.error('Error checking missed days:', error);
    }
  };

  const sendWeeklyProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('day_number, completed')
        .eq('user_id', user.id);

      if (progress) {
        const completedDays = progress.filter(p => p.completed).length;
        const progressPercentage = Math.round((completedDays / 7) * 100);

        await sendEmail('weekly_progress', {
          progress: progressPercentage,
          daysCompleted: completedDays
        });
      }
    } catch (error) {
      console.error('Error sending weekly progress:', error);
    }
  };

  return {
    sendEmail,
    checkMissedDays,
    sendWeeklyProgress
  };
}