import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Video, Users, Bell, CheckCircle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LiveSession {
  id: string;
  day_number: number;
  title: string;
  description: string;
  instructor_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  meeting_url: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  max_participants: number;
  recording_url?: string;
}

interface Attendance {
  session_id: string;
  registered_at: string;
  participated: boolean;
}

const LiveSessionsView: React.FC = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchAttendance();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .in('status', ['scheduled', 'live', 'completed'])
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const registerForSession = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to register for sessions.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('session_attendance')
        .insert({
          session_id: sessionId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Registered",
            description: "You're already registered for this session."
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Registration Successful",
          description: "You've been registered for the session. We'll send you a reminder email."
        });
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error registering:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering for the session.",
        variant: "destructive"
      });
    }
  };

  const joinSession = (url: string) => {
    window.open(url, '_blank');
  };

  const isRegistered = (sessionId: string) => {
    return attendance.some(a => a.session_id === sessionId);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800 animate-pulse';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionsByDay = (day: number) => {
    return sessions.filter(s => s.day_number === day);
  };

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(date);
    return `${sessionDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })} at ${time}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-yellow-600" />
          Live Sessions
        </h2>
        <Badge className="bg-yellow-100 text-yellow-800">
          {sessions.filter(s => s.status === 'live').length} Live Now
        </Badge>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <TabsTrigger 
              key={day} 
              value={day.toString()}
              onClick={() => setSelectedDay(day)}
              className="relative"
            >
              Day {day}
              {getSessionsByDay(day).some(s => s.status === 'live') && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {[1, 2, 3, 4, 5, 6, 7].map(day => (
          <TabsContent key={day} value={day.toString()} className="mt-6">
            {getSessionsByDay(day).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-500">
                  No sessions scheduled for Day {day}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {getSessionsByDay(day).map(session => (
                  <Card key={session.id} className={session.status === 'live' ? 'border-green-500' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{session.title}</CardTitle>
                          <p className="text-gray-600 mt-1">{session.description}</p>
                        </div>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status === 'live' ? '🔴 LIVE' : session.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{session.start_time} - {session.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{session.instructor_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Max {session.max_participants} participants</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {session.status === 'live' ? (
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => joinSession(session.meeting_url)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Live Session
                          </Button>
                        ) : session.status === 'scheduled' ? (
                          <>
                            {isRegistered(session.id) ? (
                              <Button disabled variant="outline">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Registered
                              </Button>
                            ) : (
                              <Button 
                                variant="outline"
                                onClick={() => registerForSession(session.id)}
                              >
                                <Bell className="h-4 w-4 mr-2" />
                                Register & Get Reminder
                              </Button>
                            )}
                          </>
                        ) : session.recording_url ? (
                          <Button 
                            variant="outline"
                            onClick={() => window.open(session.recording_url, '_blank')}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Watch Recording
                          </Button>
                        ) : (
                          <Badge variant="secondary">Recording Coming Soon</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LiveSessionsView;