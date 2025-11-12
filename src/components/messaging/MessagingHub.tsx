import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import NewConversationModal from './NewConversationModal';
import SessionScheduler from './SessionScheduler';
import ResourceSharing from './ResourceSharing';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, FolderOpen, Bell, Users } from 'lucide-react';

export default function MessagingHub() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [activeTab, setActiveTab] = useState('messages');

  useEffect(() => {
    fetchUnreadCount();
    fetchUpcomingSessions();
    updatePresence();

    const interval = setInterval(updatePresence, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      updatePresence('offline');
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('type', 'message');

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('practice_sessions')
        .select('*', { count: 'exact', head: true })
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .gte('scheduled_for', new Date().toISOString());

      setUpcomingSessions(count || 0);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const updatePresence = async (status = 'online') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-200px)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Calendar className="h-4 w-4 mr-2" />
              Practice Sessions
              {upcomingSessions > 0 && (
                <Badge className="ml-2">
                  {upcomingSessions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FolderOpen className="h-4 w-4 mr-2" />
              Shared Resources
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewConversation(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </div>

        <TabsContent value="messages" className="h-[calc(100%-60px)]">
          <div className="grid grid-cols-3 gap-4 h-full">
            <div className="col-span-1">
              <ConversationList
                onSelectConversation={setSelectedConversation}
                selectedConversationId={selectedConversation || undefined}
              />
            </div>
            <div className="col-span-2">
              {selectedConversation ? (
                <MessageThread conversationId={selectedConversation} />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="h-[calc(100%-60px)]">
          <SessionScheduler conversationId={selectedConversation} />
        </TabsContent>

        <TabsContent value="resources" className="h-[calc(100%-60px)]">
          <ResourceSharing conversationId={selectedConversation} />
        </TabsContent>
      </Tabs>

      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={(id) => {
            setSelectedConversation(id);
            setShowNewConversation(false);
            setActiveTab('messages');
          }}
        />
      )}
    </div>
  );
}