import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon, Clock, Users, 
  Video, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';

interface PracticeSession {
  id: string;
  title: string;
  description: string;
  scheduled_for: string;
  duration_minutes: number;
  status: string;
  meeting_link?: string;
  initiator: {
    full_name: string;
  };
  partner: {
    full_name: string;
  };
}

interface SessionSchedulerProps {
  conversationId?: string | null;
}

export default function SessionScheduler({ conversationId }: SessionSchedulerProps) {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('practice_sessions')
        .select(`
          *,
          initiator:initiator_id (full_name),
          partner:partner_id (full_name)
        `)
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleSession = async () => {
    if (!sessionTitle || !selectedDate || !sessionTime) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Combine date and time
      const [hours, minutes] = sessionTime.split(':');
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));

      // Get partner from conversation
      let partnerId = null;
      if (conversationId) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id)
          .single();
        
        partnerId = participants?.user_id;
      }

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          initiator_id: user.id,
          partner_id: partnerId,
          conversation_id: conversationId,
          title: sessionTitle,
          description: sessionDescription,
          scheduled_for: scheduledDate.toISOString(),
          duration_minutes: 60,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification
      if (partnerId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: partnerId,
            type: 'session_request',
            title: 'New Practice Session Request',
            content: `${user.email} wants to schedule "${sessionTitle}"`,
            metadata: { conversation_id: conversationId }
          });
      }

      setShowScheduleDialog(false);
      setSessionTitle('');
      setSessionDescription('');
      setSessionTime('');
      fetchSessions();
    } catch (error) {
      console.error('Error scheduling session:', error);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', icon: AlertCircle },
      accepted: { variant: 'default', icon: CheckCircle },
      declined: { variant: 'destructive', icon: XCircle },
      completed: { variant: 'secondary', icon: CheckCircle }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const upcomingSessions = sessions.filter(
    s => s.status === 'accepted' && new Date(s.scheduled_for) > new Date()
  );

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const pastSessions = sessions.filter(
    s => s.status === 'completed' || new Date(s.scheduled_for) < new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Practice Sessions</h3>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(session.scheduled_for), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(session.scheduled_for), 'h:mm a')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      with {session.partner.full_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(session.status)}
                  {session.meeting_link && (
                    <Button size="sm" variant="outline">
                      <Video className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      {pendingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested by {session.initiator.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.scheduled_for), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateSessionStatus(session.id, 'accepted')}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateSessionStatus(session.id, 'declined')}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Practice Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Session title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
            />
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date()}
            />
            <Input
              type="time"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
            />
            <Button onClick={scheduleSession} className="w-full">
              Schedule Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}