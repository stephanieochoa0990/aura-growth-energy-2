import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar } from 'lucide-react';

interface TimeTrackerProps {
  userId: string;
  totalHours: number;
}

export default function TimeTracker({ userId, totalHours }: TimeTrackerProps) {
  const [dailyTime, setDailyTime] = useState<any[]>([]);

  useEffect(() => {
    fetchDailyTime();
  }, [userId]);

  async function fetchDailyTime() {
    const { data } = await supabase
      .from('learning_sessions')
      .select('day_number, duration_seconds')
      .eq('user_id', userId)
      .order('day_number');

    if (data) {
      const grouped = data.reduce((acc: any, session) => {
        const day = session.day_number;
        if (!acc[day]) acc[day] = 0;
        acc[day] += session.duration_seconds || 0;
        return acc;
      }, {});

      const formatted = Object.entries(grouped).map(([day, seconds]: any) => ({
        day: parseInt(day),
        hours: seconds / 3600
      }));

      setDailyTime(formatted);
    }
  }

  const maxHours = Math.max(...dailyTime.map(d => d.hours), 1);

  return (
    <Card className="bg-gray-900 border-gold/20">
      <CardHeader>
        <CardTitle className="text-gold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Investment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
          <div>
            <p className="text-sm text-gray-400">Total Learning Time</p>
            <p className="text-3xl font-bold text-white">{totalHours.toFixed(1)} hours</p>
          </div>
          <Calendar className="w-12 h-12 text-blue-400" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400">Time by Day</h4>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const dayData = dailyTime.find(d => d.day === day);
            const hours = dayData?.hours || 0;
            const percentage = (hours / maxHours) * 100;

            return (
              <div key={day} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Day {day}</span>
                  <span className="text-gold font-medium">{hours.toFixed(1)}h</span>
                </div>
                <Progress value={percentage} className="h-2 bg-gray-800" />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">
              {(totalHours / 7).toFixed(1)}h
            </p>
            <p className="text-xs text-gray-400">Avg per day</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">
              {dailyTime.length}
            </p>
            <p className="text-xs text-gray-400">Active days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">
              {Math.max(...dailyTime.map(d => d.hours), 0).toFixed(1)}h
            </p>
            <p className="text-xs text-gray-400">Longest session</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
