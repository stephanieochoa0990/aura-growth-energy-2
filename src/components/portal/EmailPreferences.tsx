import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Mail, Bell, Trophy, Calendar, Megaphone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EmailPreferences() {
  const [preferences, setPreferences] = useState({
    daily_completion: true,
    missed_day_reminder: true,
    certificate_earned: true,
    weekly_progress: true,
    promotional: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data);
      } else if (error?.code === 'PGRST116') {
        // No preferences found, create default
        await supabase.from('email_preferences').insert({
          user_id: user.id,
          ...preferences
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your email preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Manage your email notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <Label htmlFor="daily">Daily Completion</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you complete a day
                </p>
              </div>
            </div>
            <Switch
              id="daily"
              checked={preferences.daily_completion}
              onCheckedChange={() => handleToggle('daily_completion')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <Label htmlFor="missed">Missed Day Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Gentle reminders to continue your journey
                </p>
              </div>
            </div>
            <Switch
              id="missed"
              checked={preferences.missed_day_reminder}
              onCheckedChange={() => handleToggle('missed_day_reminder')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <Label htmlFor="certificate">Certificate Earned</Label>
                <p className="text-sm text-muted-foreground">
                  Notification when your certificate is ready
                </p>
              </div>
            </div>
            <Switch
              id="certificate"
              checked={preferences.certificate_earned}
              onCheckedChange={() => handleToggle('certificate_earned')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <Label htmlFor="weekly">Weekly Progress</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly summary of your progress
                </p>
              </div>
            </div>
            <Switch
              id="weekly"
              checked={preferences.weekly_progress}
              onCheckedChange={() => handleToggle('weekly_progress')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-purple-500" />
              <div>
                <Label htmlFor="promotional">Promotional Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about new courses and offers
                </p>
              </div>
            </div>
            <Switch
              id="promotional"
              checked={preferences.promotional}
              onCheckedChange={() => handleToggle('promotional')}
            />
          </div>
        </div>

        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}