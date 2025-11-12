import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';

export default function OnlineMembers() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchMembers();
    trackPresence();
  }, []);

  async function fetchMembers() {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (count) setTotalMembers(count);
  }

  async function trackPresence() {
    // Subscribe to presence channel
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }

  return (
    <Card className="bg-black/50 border-gold/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gold font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Community
        </h3>
        <Badge variant="outline" className="border-gold/50 text-gold">
          {onlineUsers.length} online
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Online Members */}
        {onlineUsers.slice(0, 5).map((user: any) => (
          <div key={user.user_id} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gold/20 text-gold text-xs">
                  {user.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-green-500 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user.full_name || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>
        ))}

        {onlineUsers.length > 5 && (
          <p className="text-xs text-gray-400 text-center pt-2">
            +{onlineUsers.length - 5} more online
          </p>
        )}

        {/* Total Members */}
        <div className="pt-3 mt-3 border-t border-gray-800">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Members</span>
            <span className="text-gold font-semibold">{totalMembers}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}