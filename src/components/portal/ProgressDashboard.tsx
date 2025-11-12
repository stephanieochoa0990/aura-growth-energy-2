import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, TrendingUp, Award } from 'lucide-react';
import { achievements } from '@/data/achievementsData';
import ProgressCharts from './ProgressCharts';
import LearningJourney from './LearningJourney';
import AchievementGrid from './AchievementGrid';
import TimeTracker from './TimeTracker';

interface ProgressDashboardProps {
  userId: string;
  currentDay: number;
}

export default function ProgressDashboard({ userId, currentDay }: ProgressDashboardProps) {
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalMaterials: 0,
    percentComplete: 0,
    daysCompleted: 0,
    currentDay: currentDay,
    totalTimeHours: 0,
    videosWatched: 0,
    forumPosts: 0,
    streak: 0,
    perfectDays: 0,
    earlyAccess: 0
  });
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, [userId]);

  async function fetchAllStats() {
    setLoading(true);
    
    // Fetch progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    // Fetch materials
    const { data: materials } = await supabase
      .from('class_materials')
      .select('*');

    // Fetch achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_key')
      .eq('user_id', userId);

    // Fetch sessions for time tracking
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('duration_seconds')
      .eq('user_id', userId);

    // Fetch forum posts
    const { data: posts } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('user_id', userId);

    if (progress && materials) {
      const totalTime = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
      
      const newStats = {
        totalCompleted: progress.filter(p => p.completed).length,
        totalMaterials: materials.length,
        percentComplete: Math.round((progress.filter(p => p.completed).length / materials.length) * 100) || 0,
        daysCompleted: calculateCompletedDays(progress, materials, currentDay),
        currentDay,
        totalTimeHours: totalTime / 3600,
        videosWatched: progress.filter(p => p.material_type === 'video' && p.completed).length,
        forumPosts: posts?.length || 0,
        streak: 7, // Calculate actual streak
        perfectDays: 0, // Calculate perfect days
        earlyAccess: 0
      };
      
      setStats(newStats);
      setEarnedAchievements(userAchievements?.map(a => a.achievement_key) || []);
      
      // Check and award new achievements
      await checkAchievements(newStats, userAchievements?.map(a => a.achievement_key) || []);
    }
    
    setLoading(false);
  }

  function calculateCompletedDays(progress: any[], materials: any[], current: number) {
    let completed = 0;
    for (let day = 1; day < current; day++) {
      const dayMats = materials.filter(m => m.day_number === day);
      const dayProgress = progress.filter(p => 
        dayMats.find(m => m.id === p.material_id) && p.completed
      );
      if (dayMats.length > 0 && dayProgress.length === dayMats.length) completed++;
    }
    return completed;
  }

  async function checkAchievements(currentStats: any, earned: string[]) {
    for (const achievement of achievements) {
      if (!earned.includes(achievement.key) && achievement.requirement(currentStats)) {
        await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_key: achievement.key
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gold mb-2">Progress Dashboard</h1>
        <p className="text-gray-400">Track your complete learning journey</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewStats stats={stats} />
          <TimeTracker userId={userId} totalHours={stats.totalTimeHours} />
        </TabsContent>

        <TabsContent value="journey">
          <LearningJourney userId={userId} currentDay={currentDay} stats={stats} />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementGrid 
            earnedAchievements={earnedAchievements} 
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <ProgressCharts userId={userId} stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-gold/20 to-gray-900 border-gold/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Overall Progress</p>
              <p className="text-3xl font-bold text-gold">{stats.percentComplete}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-gold" />
          </div>
          <Progress value={stats.percentComplete} className="mt-3 h-2" />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/20 to-gray-900 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Time Invested</p>
              <p className="text-3xl font-bold text-blue-400">{stats.totalTimeHours.toFixed(1)}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Across all sessions</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/20 to-gray-900 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Current Day</p>
              <p className="text-3xl font-bold text-purple-400">{stats.currentDay}/7</p>
            </div>
            <Award className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{stats.daysCompleted} days completed</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/20 to-gray-900 border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Achievements</p>
              <p className="text-3xl font-bold text-green-400">{stats.totalCompleted}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Materials completed</p>
        </CardContent>
      </Card>
    </div>
  );
}
