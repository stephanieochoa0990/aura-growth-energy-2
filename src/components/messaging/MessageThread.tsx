import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, Paperclip, Calendar, MoreVertical, 
  Heart, ThumbsUp, Smile, Circle, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SwipeableMessage } from './SwipeableMessage';


interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: string;
  metadata?: any;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
  reactions?: {
    reaction: string;
    user_id: string;
  }[];
}

interface MessageThreadProps {
  conversationId: string;
}

export default function MessageThread({ conversationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();
    
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            full_name,
            avatar_url
          ),
          message_reactions (
            reaction,
            user_id
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('conversation_participants')
        .select(`
          profiles!inner (
            full_name,
            avatar_url
          ),
          user_presence (
            status,
            last_seen,
            status_message
          )
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .single();

      setOtherUser(data);
    } catch (error) {
      console.error('Error fetching other user:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage,
          message_type: 'text'
        });

      if (error) throw error;

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: newMessage.substring(0, 100)
        })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const addReaction = async (messageId: string, reaction: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          reaction
        });

      fetchMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId);
      
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      case 'busy': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarFallback>
                  {otherUser?.profiles?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Circle 
                className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${
                  getStatusColor(otherUser?.user_presence?.status)
                }`}
              />
            </div>
            <div>
              <p className="font-medium">{otherUser?.profiles?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {otherUser?.user_presence?.status_message || 
                 (otherUser?.user_presence?.status === 'online' ? 'Active now' : 
                  `Last seen ${format(new Date(otherUser?.user_presence?.last_seen || ''), 'MMM d, h:mm a')}`)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="icon" variant="ghost">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            
            return (
              <SwipeableMessage
                key={message.id}
                isOwn={isOwn}
                onDelete={() => deleteMessage(message.id)}
              >
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'h:mm a')}
                      </span>
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1">
                          {message.reactions.map((r, i) => (
                            <span key={i} className="text-xs">{r.reaction}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableMessage>

            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button size="icon" variant="ghost">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}