import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Trophy, Star, Target, Zap } from 'lucide-react';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

interface ProgressTrackerProps {
  userId: string;
  currentDay: number;
}

export default function ProgressTracker({ userId, currentDay }: ProgressTrackerProps) {
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalMaterials: 0,
    percentComplete: 0,
    daysCompleted: 0
  });
  const { sendEmail } = useEmailNotifications();

  useEffect(() => {
    fetchProgress();
    fetchMaterials();
  }, []);

  async function fetchProgress() {
    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);

    if (data) setUserProgress(data);
  }

  async function fetchMaterials() {
    const { data } = await supabase
      .from('class_materials')
      .select('*')
      .order('day_number', { ascending: true });

    if (data) {
      setMaterials(data);
      calculateStats(data);
    }
  }

  function calculateStats(allMaterials: any[]) {
    const total = allMaterials.length;
    const completed = userProgress.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const completedDays = new Set();
    for (let day = 1; day < currentDay; day++) {
      const dayMaterials = allMaterials.filter(m => m.day_number === day);
      const dayCompleted = dayMaterials.every(m => 
        userProgress.find(p => p.material_id === m.id)
      );
      if (dayCompleted) completedDays.add(day);
    }

    setStats({
      totalCompleted: completed,
      totalMaterials: total,
      percentComplete: percent,
      daysCompleted: completedDays.size
    });
  }

  const achievements = [
    { 
      icon: <Star className="w-5 h-5 sm:w-6 sm:h-6" />, 
      title: "First Steps", 
      desc: "Complete Day 1",
      earned: currentDay > 1 
    },
    { 
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />, 
      title: "Halfway There", 
      desc: "Reach Day 4",
      earned: currentDay >= 4 
    },
    { 
      icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />, 
      title: "Journey Complete", 
      desc: "Finish all 7 days",
      earned: currentDay > 7 
    },
    { 
      icon: <Target className="w-5 h-5 sm:w-6 sm:h-6" />, 
      title: "Dedicated Student", 
      desc: "Complete 10+ materials",
      earned: stats.totalCompleted >= 10 
    }
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="text-center mb-6 sm:mb-8 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">Your Progress</h2>
        <p className="text-gray-400 text-sm sm:text-base">Track your journey to aura empowerment</p>
      </div>

      <Card className="bg-gray-900 border-[#D4AF37]/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-[#D4AF37] text-lg sm:text-xl">Overall Journey Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Completion</span>
            <span className="text-[#D4AF37] font-bold">{stats.percentComplete}%</span>
          </div>
          <Progress value={stats.percentComplete} className="h-2 sm:h-3 bg-gray-800" />
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-[#D4AF37]">{currentDay}/7</div>
              <div className="text-xs text-gray-400">Current Day</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-[#D4AF37]">{stats.totalCompleted}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-[#D4AF37]">{stats.daysCompleted}</div>
              <div className="text-xs text-gray-400">Days Done</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-[#D4AF37]/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-[#D4AF37] text-lg sm:text-xl">7-Day Journey</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const dayMaterials = materials.filter(m => m.day_number === day);
              const dayCompleted = dayMaterials.filter(m => 
                userProgress.find(p => p.material_id === m.id)
              ).length;
              const isCurrentDay = day === currentDay;
              const isComplete = dayCompleted === dayMaterials.length && dayMaterials.length > 0;
              const isLocked = day > currentDay;

              return (
                <div key={day} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                  isCurrentDay ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'bg-gray-800'
                }`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 shrink-0" />
                    ) : isLocked ? (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-white text-sm sm:text-base">Day {day}</div>
                      <div className="text-xs text-gray-400">
                        {dayCompleted}/{dayMaterials.length} completed
                      </div>
                    </div>
                  </div>
                  {isCurrentDay && (
                    <Badge className="bg-[#D4AF37] text-black text-xs">Current</Badge>
                  )}
                  {isComplete && (
                    <Badge className="bg-green-600 text-white text-xs">Complete</Badge>
                  )}
                  {isLocked && (
                    <Badge variant="outline" className="border-gray-600 text-gray-600 text-xs">
                      Locked
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-[#D4AF37]/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-[#D4AF37] text-lg sm:text-xl">Achievements</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`p-3 sm:p-4 rounded-lg border ${
                  achievement.earned 
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                    : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={achievement.earned ? 'text-[#D4AF37]' : 'text-gray-600'}>
                    {achievement.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm sm:text-base">{achievement.title}</div>
                    <div className="text-xs opacity-75">{achievement.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
