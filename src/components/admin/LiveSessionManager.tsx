import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Video, Users, Edit, Trash2, Plus, Link, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

interface SessionManagerProps {
  userRole: string;
}

const LiveSessionManager: React.FC<SessionManagerProps> = ({ userRole }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor_name: '',
    session_date: '',
    start_time: '',
    end_time: '',
    meeting_url: '',
    max_participants: 100
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [selectedDay]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('day_number', selectedDay)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('live_sessions')
        .insert({
          ...formData,
          day_number: selectedDay,
          instructor_id: user.id,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Session Created",
        description: "Live session has been scheduled successfully."
      });

      setIsCreateOpen(false);
      fetchSessions();
      resetForm();

      // Schedule reminder emails
      await scheduleReminders(formData.session_date, formData.start_time);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create session.",
        variant: "destructive"
      });
    }
  };

  const scheduleReminders = async (date: string, time: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const sessionDateTime = new Date(`${date}T${time}`);
      
      // Schedule 24-hour reminder
      const reminder24h = new Date(sessionDateTime);
      reminder24h.setHours(reminder24h.getHours() - 24);

      // Schedule 1-hour reminder
      const reminder1h = new Date(sessionDateTime);
      reminder1h.setHours(reminder1h.getHours() - 1);

      await supabase.functions.invoke('send-session-reminder', {
        body: { 
          sessionId: 'new-session',
          reminderType: '24_hours'
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('live_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Session Deleted",
        description: "The session has been removed."
      });

      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session.",
        variant: "destructive"
      });
    }
  };

  const copyMeetingLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard."
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructor_name: '',
      session_date: '',
      start_time: '',
      end_time: '',
      meeting_url: '',
      max_participants: 100
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Sessions Management
          </CardTitle>
          {userRole === 'admin' && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Schedule New Live Session</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Session Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g., Day 1 Live Q&A"
                      />
                    </div>
                    <div>
                      <Label>Instructor Name</Label>
                      <Input
                        value={formData.instructor_name}
                        onChange={(e) => setFormData({...formData, instructor_name: e.target.value})}
                        placeholder="Instructor name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Session description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.session_date}
                        onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Meeting URL</Label>
                      <Input
                        value={formData.meeting_url}
                        onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                    <div>
                      <Label>Max Participants</Label>
                      <Input
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <Button onClick={createSession} className="w-full">
                    Schedule Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <TabsTrigger 
                key={day} 
                value={day.toString()}
                onClick={() => setSelectedDay(day)}
              >
                Day {day}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedDay.toString()} className="mt-6">
            {loading ? (
              <div className="text-center py-8">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sessions scheduled for Day {selectedDay}
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-4">{session.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{new Date(session.session_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{session.start_time} - {session.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>Max {session.max_participants} participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-gray-400" />
                              <span>Instructor: {session.instructor_name}</span>
                            </div>
                          </div>

                          {session.meeting_url && (
                            <div className="mt-4 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyMeetingLink(session.meeting_url)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(session.meeting_url, '_blank')}
                              >
                                <Link className="h-4 w-4 mr-2" />
                                Open Meeting
                              </Button>
                            </div>
                          )}
                        </div>

                        {userRole === 'admin' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LiveSessionManager;