import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquarePlus, Circle } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  last_message_at: string;
  last_message_preview: string;
  participants: {
    user_id: string;
    profile: {
      full_name: string;
      avatar_url?: string;
    };
    presence?: {
      status: string;
      last_seen: string;
    };
  }[];
  unread_count?: number;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export default function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            last_message_at,
            last_message_preview
          )
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('conversations(last_message_at)', { ascending: false });

      if (error) throw error;

      // Fetch other participants and their presence
      const conversationsWithParticipants = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles!inner (
                full_name,
                avatar_url
              ),
              user_presence (
                status,
                last_seen
              )
            `)
            .eq('conversation_id', conv.conversation_id)
            .neq('user_id', user.id);

          return {
            ...conv.conversations,
            participants: participants || []
          };
        })
      );

      setConversations(conversationsWithParticipants);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
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

  const filteredConversations = conversations.filter(conv => {
    const participant = conv.participants[0];
    return participant?.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card className="h-full p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="icon" variant="outline">
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const participant = conversation.participants[0];
              const isSelected = conversation.id === selectedConversationId;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>
                          {participant?.profile.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Circle 
                        className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${
                          getStatusColor(participant?.presence?.status)
                        }`}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {participant?.profile.full_name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conversation.last_message_at), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message_preview}
                      </p>
                    </div>
                    
                    {conversation.unread_count && (
                      <Badge variant="default" className="ml-2">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}