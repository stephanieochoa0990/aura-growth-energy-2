import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Eye, 
  CheckCircle, 
  LogIn, 
  Download,
  BookOpen,
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { format, formatDistanceToNow, startOfDay, differenceInDays } from 'date-fns';

interface ActivityLog {
  id: string;
  activity_type: string;
  day_number?: number;
  details: any;
  duration_seconds?: number;
  created_at: string;
}

interface StudentActivityTimelineProps {
  userId: string;
  userName: string;
}

export function StudentActivityTimeline({ userId, userName }: StudentActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTime: 0,
    totalLogins: 0,
    lessonsViewed: 0,
    lessonsCompleted: 0,
    avgSessionTime: 0,
    lastActive: null as string | null
  });

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setActivities(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: ActivityLog[]) => {
    const totalTime = logs.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);
    const logins = logs.filter(log => log.activity_type === 'login').length;
    const viewed = new Set(logs.filter(log => log.activity_type === 'view_lesson').map(log => log.day_number)).size;
    const completed = new Set(logs.filter(log => log.activity_type === 'complete_lesson').map(log => log.day_number)).size;
    const sessions = logs.filter(log => log.activity_type === 'login');
    const avgSession = sessions.length > 0 ? totalTime / sessions.length : 0;
    const lastActive = logs.length > 0 ? logs[0].created_at : null;

    setStats({
      totalTime,
      totalLogins: logins,
      lessonsViewed: viewed,
      lessonsCompleted: completed,
      avgSessionTime: avgSession,
      lastActive
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="h-4 w-4" />;
      case 'view_lesson': return <Eye className="h-4 w-4" />;
      case 'complete_lesson': return <CheckCircle className="h-4 w-4" />;
      case 'download_resource': return <Download className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-blue-500';
      case 'view_lesson': return 'bg-purple-500';
      case 'complete_lesson': return 'bg-green-500';
      case 'download_resource': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const groupActivitiesByDay = () => {
    const grouped: { [key: string]: ActivityLog[] } = {};
    activities.forEach(activity => {
      const day = format(new Date(activity.created_at), 'yyyy-MM-dd');
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(activity);
    });
    return grouped;
  };

  const groupedActivities = groupActivitiesByDay();

  if (loading) {
    return <div className="flex justify-center p-8">Loading activity data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Time</span>
          </div>
          <p className="text-2xl font-bold">{formatDuration(stats.totalTime)}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <LogIn className="h-4 w-4" />
            <span className="text-sm">Total Logins</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalLogins}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">Lessons Viewed</span>
          </div>
          <p className="text-2xl font-bold">{stats.lessonsViewed}/7</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold">{stats.lessonsCompleted}/7</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg Session</span>
          </div>
          <p className="text-2xl font-bold">{formatDuration(Math.floor(stats.avgSessionTime))}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Last Active</span>
          </div>
          <p className="text-sm font-semibold">
            {stats.lastActive ? formatDistanceToNow(new Date(stats.lastActive), { addSuffix: true }) : 'Never'}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="summary">Daily Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                      {dayActivities.map((activity) => (
                        <div key={activity.id} className="flex gap-4">
                          <div className={`relative z-10 w-8 h-8 rounded-full ${getActivityColor(activity.activity_type)} flex items-center justify-center text-white`}>
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div className="flex-1 bg-white border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium capitalize">
                                {activity.activity_type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(activity.created_at), 'h:mm a')}
                              </span>
                            </div>
                            {activity.day_number && (
                              <Badge variant="secondary" className="mb-2">
                                Day {activity.day_number}
                              </Badge>
                            )}
                            {activity.duration_seconds && (
                              <p className="text-sm text-gray-600">
                                Duration: {formatDuration(activity.duration_seconds)}
                              </p>
                            )}
                            {activity.details && Object.keys(activity.details).length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {JSON.stringify(activity.details)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="summary">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => {
                const dayStats = {
                  logins: dayActivities.filter(a => a.activity_type === 'login').length,
                  views: dayActivities.filter(a => a.activity_type === 'view_lesson').length,
                  completions: dayActivities.filter(a => a.activity_type === 'complete_lesson').length,
                  totalTime: dayActivities.reduce((acc, a) => acc + (a.duration_seconds || 0), 0)
                };
                
                return (
                  <div key={date} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      {format(new Date(date), 'EEEE, MMMM d')}
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Logins:</span>
                        <p className="font-semibold">{dayStats.logins}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Views:</span>
                        <p className="font-semibold">{dayStats.views}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <p className="font-semibold">{dayStats.completions}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Time:</span>
                        <p className="font-semibold">{formatDuration(dayStats.totalTime)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}