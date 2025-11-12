import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Award,
  Calendar
} from 'lucide-react';

interface AnalyticsProps {
  userRole: 'instructor' | 'admin';
}

interface DayCompletion {
  day: number;
  count: number;
  percentage: number;
}

interface EngagementData {
  date: string;
  activeUsers: number;
  completions: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [dayCompletions, setDayCompletions] = useState<DayCompletion[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [averageCompletion, setAverageCompletion] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total students
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student');
      
      setTotalStudents(count || 0);

      // Fetch day completion data
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('days_completed');

      if (progressData) {
        const dayStats = Array.from({ length: 7 }, (_, i) => {
          const day = i + 1;
          const completedCount = progressData.filter(p => 
            p.days_completed?.includes(day)
          ).length;
          return {
            day,
            count: completedCount,
            percentage: count ? Math.round((completedCount / count) * 100) : 0
          };
        });
        setDayCompletions(dayStats);

        // Calculate average completion
        const totalDaysCompleted = progressData.reduce((sum, p) => 
          sum + (p.days_completed?.length || 0), 0
        );
        setAverageCompletion(
          progressData.length ? Math.round(totalDaysCompleted / progressData.length) : 0
        );
      }

      // Fetch top performers
      const { data: performers } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          days_completed,
          profiles!inner(full_name, email)
        `)
        .order('days_completed', { ascending: false })
        .limit(5);

      if (performers) {
        setTopPerformers(performers.map(p => ({
          name: p.profiles.full_name,
          email: p.profiles.email,
          daysCompleted: p.days_completed?.length || 0
        })));
      }

      // Fetch engagement data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const engagementPromises = last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { count: activeCount } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact' })
          .gte('last_accessed', date)
          .lt('last_accessed', nextDate.toISOString().split('T')[0]);

        return {
          date,
          activeUsers: activeCount || 0,
          completions: 0 // Would need event tracking for this
        };
      });

      const engagement = await Promise.all(engagementPromises);
      setEngagementData(engagement);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}/7 days</div>
            <Progress value={(averageCompletion / 7) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dayCompletions[6]?.percentage || 0}%
            </div>
            <p className="text-xs text-gray-500">Completed all 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Challenging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Day {dayCompletions.reduce((min, day) => 
                day.percentage < min.percentage ? day : min
              ).day}
            </div>
            <p className="text-xs text-gray-500">Lowest completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementData[engagementData.length - 1]?.activeUsers || 0}
            </div>
            <p className="text-xs text-gray-500">Students engaged</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completion">Completion Rates</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="completion">
          <Card>
            <CardHeader>
              <CardTitle>Day-by-Day Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dayCompletions.map((day) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <div className="w-20 font-medium">Day {day.day}</div>
                    <div className="flex-1">
                      <Progress value={day.percentage} />
                    </div>
                    <div className="w-20 text-right text-sm text-gray-600">
                      {day.count}/{totalStudents} ({day.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Engagement Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagementData.map((data) => (
                  <div key={data.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm">
                      {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-yellow-500 rounded" 
                        style={{ 
                          width: `${(data.activeUsers / totalStudents) * 100}%`,
                          minWidth: '20px'
                        }}
                      />
                    </div>
                    <div className="w-20 text-right text-sm">
                      {data.activeUsers} users
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performers">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-sm text-gray-500">{performer.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{performer.daysCompleted}/7 days</div>
                      {performer.daysCompleted === 7 && (
                        <Award className="h-4 w-4 text-yellow-500 ml-auto mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;