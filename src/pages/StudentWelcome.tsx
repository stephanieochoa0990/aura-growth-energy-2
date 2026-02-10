import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import MysticalBackground from '@/components/MysticalBackground';
import { Play, BookOpen, List } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function StudentWelcome() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastVideoProgress, setLastVideoProgress] = useState<{
    videoId: string;
    videoTitle: string;
    dayNumber: number;
    sectionNumber: number;
    lastPosition: number;
    completionPercentage: number;
  } | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get user profile and check admin status - use maybeSingle() to handle missing profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, is_admin')
        .eq('id', user.id)  // Use 'id' column which matches auth.users.id
        .maybeSingle();

      // Redirect admins to admin dashboard
      if (profile?.is_admin) {
        navigate('/admin');
        return;
      }

      if (profile?.first_name) {
        setFirstName(profile.first_name);
      }



      // Get last watched video
      const { data: progressData } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progressData && progressData.completion_percentage < 100) {
        setLastVideoProgress({
          videoId: progressData.video_id,
          videoTitle: progressData.video_title || 'Your last video',
          dayNumber: progressData.day_number || 1,
          sectionNumber: progressData.section_number || 1,
          lastPosition: progressData.last_position || 0,
          completionPercentage: progressData.completion_percentage || 0
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDayOne = () => {
    navigate('/day-1');
  };

  const handleContinueJourney = () => {
    if (lastVideoProgress) {
      // Navigate to the specific day with the video ID as a query parameter
      const dayPath = `/day-${lastVideoProgress.dayNumber}`;
      navigate(dayPath, { 
        state: { 
          continueVideoId: lastVideoProgress.videoId,
          timestamp: lastVideoProgress.lastPosition 
        } 
      });
    } else {
      // If no progress, start from Day 1
      navigate('/day-1');
    }
  };

  const handleBrowseAll = () => {
    navigate('/student-portal');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MysticalBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-900/95 backdrop-blur border-[#D4AF37]/20 p-6 sm:p-10">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl font-bold text-black">WL</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-[#D4AF37]">
              Welcome back{firstName ? `, ${firstName}` : ''}!
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              You're now inside the Aura Empowerment Journey. Start with Day One, or continue where you left off. Your field remembers.
            </p>

            {lastVideoProgress && (
              <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-400 mb-2">Last watched:</p>
                <p className="text-[#D4AF37] font-medium mb-2">
                  Day {lastVideoProgress.dayNumber} - {lastVideoProgress.videoTitle}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress: {Math.round(lastVideoProgress.completionPercentage)}%</span>
                    <span>at {formatTime(lastVideoProgress.lastPosition)}</span>
                  </div>
                  <Progress value={lastVideoProgress.completionPercentage} className="h-2" />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 mt-8">
              <Button
                onClick={handleStartDayOne}
                className="w-full bg-[#D4AF37] text-black hover:bg-yellow-600 min-h-[56px] text-lg font-semibold transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Day One
              </Button>

              <Button
                onClick={handleContinueJourney}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 min-h-[56px] text-lg font-semibold transition-all hover:scale-105"
                disabled={!lastVideoProgress}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                {lastVideoProgress ? 'Continue My Journey' : 'No Progress Yet'}
              </Button>

              <Button
                onClick={handleBrowseAll}
                variant="outline"
                className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black min-h-[56px] text-lg font-semibold transition-all hover:scale-105"
              >
                <List className="w-5 h-5 mr-2" />
                Browse All Lessons
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
