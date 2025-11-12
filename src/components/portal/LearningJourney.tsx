import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Lock, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Button } from '@/components/ui/button';

interface LearningJourneyProps {
  userId: string;
  currentDay: number;
  stats: any;
  onDayChange?: (day: number) => void;
}


export default function LearningJourney({ userId, currentDay, stats, onDayChange }: LearningJourneyProps) {

  const [materials, setMaterials] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const containerRef = useRef<HTMLDivElement>(null);

  useSwipeGesture(containerRef, {
    onSwipeLeft: () => {
      if (selectedDay < 7) {
        const newDay = selectedDay + 1;
        setSelectedDay(newDay);
        onDayChange?.(newDay);
      }
    },
    onSwipeRight: () => {
      if (selectedDay > 1) {
        const newDay = selectedDay - 1;
        setSelectedDay(newDay);
        onDayChange?.(newDay);
      }
    },
  });


  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    const { data: mats } = await supabase
      .from('class_materials')
      .select('*')
      .order('day_number', { ascending: true });

    const { data: prog } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (mats) setMaterials(mats);
    if (prog) setProgress(prog);
  }

  const days = [
    { num: 1, title: 'Foundation', theme: 'Awakening Your Field' },
    { num: 2, title: 'Anatomy', theme: 'Understanding the Structure' },
    { num: 3, title: 'Activation', theme: 'Igniting Your Power' },
    { num: 4, title: 'Integration', theme: 'Embodying the Practice' },
    { num: 5, title: 'Expansion', theme: 'Deepening Connection' },
    { num: 6, title: 'Mastery', theme: 'Advanced Techniques' },
    { num: 7, title: 'Completion', theme: 'Your New Beginning' }
  ];

  return (
    <div ref={containerRef} className="space-y-8 touch-pan-y">
      <Card className="bg-gradient-to-r from-gold/20 to-purple-500/20 border-gold/30">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Your 7-Day Journey</h2>
            <p className="text-gray-300">
              {stats.daysCompleted} of 7 days completed • {stats.percentComplete}% overall progress
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedDay > 1) {
                    const newDay = selectedDay - 1;
                    setSelectedDay(newDay);
                    onDayChange?.(newDay);
                  }
                }}
                disabled={selectedDay === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400">Swipe to navigate</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedDay < 7) {
                    const newDay = selectedDay + 1;
                    setSelectedDay(newDay);
                    onDayChange?.(newDay);
                  }
                }}
                disabled={selectedDay === 7}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        {/* Journey line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-purple-500 to-gray-700" />

        <div className="space-y-6">

          {days.map((day) => {
            const dayMaterials = materials.filter(m => m.day_number === day.num);
            const completedMats = dayMaterials.filter(m =>
              progress.find(p => p.material_id === m.id && p.completed)
            );
            const isComplete = completedMats.length === dayMaterials.length && dayMaterials.length > 0;
            const isCurrent = day.num === currentDay;
            const isLocked = day.num > currentDay;
            const completionPercent = dayMaterials.length > 0 
              ? Math.round((completedMats.length / dayMaterials.length) * 100) 
              : 0;

            return (
              <div key={day.num} className="relative pl-20">
                {/* Day marker */}
                <div className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                  isComplete 
                    ? 'bg-green-500 border-green-400' 
                    : isCurrent 
                    ? 'bg-gold border-gold/50 animate-pulse' 
                    : isLocked
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-900 border-gold/30'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6 text-gray-600" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{day.num}</span>
                  )}
                </div>

                {/* Day card */}
                <Card className={`${
                  isCurrent 
                    ? 'bg-gradient-to-br from-gold/20 to-gray-900 border-gold border-2' 
                    : isComplete
                    ? 'bg-gradient-to-br from-green-500/20 to-gray-900 border-green-500/30'
                    : 'bg-gray-900 border-gray-700'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          Day {day.num}: {day.title}
                        </h3>
                        <p className="text-sm text-gray-400">{day.theme}</p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-gold text-black">Current</Badge>
                      )}
                      {isComplete && (
                        <Badge className="bg-green-600 text-white">Complete</Badge>
                      )}
                      {isLocked && (
                        <Badge variant="outline" className="border-gray-600 text-gray-600">
                          Locked
                        </Badge>
                      )}
                    </div>

                    {!isLocked && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <Star className="w-4 h-4" />
                          <span>{completedMats.length}/{dayMaterials.length} materials completed</span>
                        </div>

                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isComplete ? 'bg-green-500' : 'bg-gold'
                            }`}
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

