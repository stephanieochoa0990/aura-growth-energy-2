import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface DayPattern {
  day: number;
  completions: number;
  avgVideoTime: number;
  forumActivity: number;
}

interface WeeklyTrend {
  week: string;
  activeStudents: number;
  completions: number;
  engagement: number;
}

interface LearningPatternsChartProps {
  dayPatterns: DayPattern[];
  weeklyTrends: WeeklyTrend[];
  totalStudents: number;
}

const LearningPatternsChart: React.FC<LearningPatternsChartProps> = ({
  dayPatterns,
  weeklyTrends,
  totalStudents
}) => {
  const maxVideoTime = Math.max(...dayPatterns.map(d => d.avgVideoTime), 1);
  const maxActivity = Math.max(...dayPatterns.map(d => d.forumActivity), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Patterns Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Daily Patterns</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-4">
            {dayPatterns.map((pattern) => (
              <div key={pattern.day} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Day {pattern.day}</span>
                  <span>{pattern.completions} completions</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-gray-600">Video Time:</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${(pattern.avgVideoTime / maxVideoTime) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right">{pattern.avgVideoTime}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-gray-600">Forum Posts:</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(pattern.forumActivity / maxActivity) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right">{pattern.forumActivity}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            {weeklyTrends.map((trend, idx) => (
              <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2">
                <div className="font-medium">{trend.week}</div>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <div className="text-gray-600">Active</div>
                    <div className="font-medium">{trend.activeStudents}/{totalStudents}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completed</div>
                    <div className="font-medium">{trend.completions}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Engagement</div>
                    <Progress value={trend.engagement} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LearningPatternsChart;
