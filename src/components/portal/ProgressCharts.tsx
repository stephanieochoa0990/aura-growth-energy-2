import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface ProgressChartsProps {
  userId: string;
  stats: any;
}

export default function ProgressCharts({ userId, stats }: ProgressChartsProps) {
  const [dailyProgress, setDailyProgress] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchChartData();
  }, [userId]);

  async function fetchChartData() {
    // Fetch materials and progress
    const { data: materials } = await supabase
      .from('class_materials')
      .select('*');

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);

    if (materials && progress) {
      // Daily progress data
      const daily = [1, 2, 3, 4, 5, 6, 7].map(day => {
        const dayMats = materials.filter(m => m.day_number === day);
        const completed = progress.filter(p => 
          dayMats.find(m => m.id === p.material_id)
        ).length;
        return {
          day: `Day ${day}`,
          completed,
          total: dayMats.length,
          percentage: dayMats.length > 0 ? Math.round((completed / dayMats.length) * 100) : 0
        };
      });
      setDailyProgress(daily);

      // Category breakdown
      const types = ['video', 'reading', 'practice', 'quiz'];
      const breakdown = types.map(type => {
        const typeMats = materials.filter(m => m.material_type === type);
        const completed = progress.filter(p => 
          typeMats.find(m => m.id === p.material_id)
        ).length;
        return {
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: completed,
          total: typeMats.length
        };
      });
      setCategoryBreakdown(breakdown);
    }
  }

  const COLORS = ['#D4AF37', '#8B5CF6', '#3B82F6', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Daily Progress Bar Chart */}
      <Card className="bg-gray-900 border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Completion Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <ChartTooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #D4AF37' }}
              />
              <Bar dataKey="completed" fill="#D4AF37" radius={[8, 8, 0, 0]} />
              <Bar dataKey="total" fill="#374151" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend Line Chart */}
        <Card className="bg-gray-900 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Completion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #D4AF37' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  dot={{ fill: '#D4AF37', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="bg-gray-900 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold flex items-center gap-2">
              <PieIcon className="w-5 h-5" />
              Content Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #D4AF37' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <Card className="bg-gray-900 border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold">Progress Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-3xl font-bold text-gold">{stats.percentComplete}%</p>
              <p className="text-sm text-gray-400">Overall</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-3xl font-bold text-blue-400">{stats.videosWatched}</p>
              <p className="text-sm text-gray-400">Videos</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-3xl font-bold text-purple-400">{stats.daysCompleted}</p>
              <p className="text-sm text-gray-400">Days Done</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-3xl font-bold text-green-400">{stats.totalCompleted}</p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
