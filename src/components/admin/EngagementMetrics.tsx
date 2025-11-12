import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, MessageSquare, Clock, TrendingUp } from 'lucide-react';

interface EngagementMetricsProps {
  totalVideoTime: number;
  avgVideoCompletion: number;
  forumPosts: number;
  avgForumEngagement: number;
  activeStudents: number;
  totalStudents: number;
}

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({
  totalVideoTime,
  avgVideoCompletion,
  forumPosts,
  avgForumEngagement,
  activeStudents,
  totalStudents
}) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-500" />
            Total Watch Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(totalVideoTime)}</div>
          <p className="text-xs text-gray-500 mt-1">Across all students</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Avg Video Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgVideoCompletion}%</div>
          <Progress value={avgVideoCompletion} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            Forum Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{forumPosts}</div>
          <p className="text-xs text-gray-500 mt-1">{avgForumEngagement.toFixed(1)} per student</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Active Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeStudents}/{totalStudents}</div>
          <Progress value={(activeStudents / totalStudents) * 100} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
};

export default EngagementMetrics;
