import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, MessageSquare, Users, TrendingUp, Pin, 
  Filter, Bell, Settings, Hash, Sparkles 
} from 'lucide-react';
import DiscussionThread from './DiscussionThread';
import CreatePost from './CreatePost';
import OnlineMembers from './OnlineMembers';
import { useToast } from '@/hooks/use-toast';

interface CommunityHubProps {
  userId: string;
  userProfile: any;
}

export default function CommunityHub({ userId, userProfile }: CommunityHubProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'All Discussions', icon: MessageSquare, color: 'text-gold' },
    { id: 'daily', name: 'Daily Practice', icon: Sparkles, color: 'text-purple-400' },
    { id: 'insights', name: 'Insights & Breakthroughs', icon: TrendingUp, color: 'text-green-400' },
    { id: 'questions', name: 'Questions', icon: Hash, color: 'text-blue-400' },
    { id: 'support', name: 'Support Circle', icon: Users, color: 'text-pink-400' }
  ];

  useEffect(() => {
    fetchPosts();
    subscribeToUpdates();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [searchQuery, selectedCategory, posts]);

  async function fetchPosts() {
    const { data } = await supabase
      .from('forum_posts')
      .select(`
        *,
        profiles:user_id (id, full_name, email, avatar_url),
        forum_comments (count),
        forum_reactions (reaction_type)
      `)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data);
      setFilteredPosts(data);
    }
    setLoading(false);
  }

  function subscribeToUpdates() {
    const subscription = supabase
      .channel('community-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'forum_posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  function filterPosts() {
    let filtered = [...posts];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPosts(filtered);
  }

  if (selectedPost) {
    return (
      <DiscussionThread
        post={selectedPost}
        userId={userId}
        userProfile={userProfile}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent mb-2">
            Community Circle
          </h1>
          <p className="text-gray-400">Connect, share, and grow with fellow practitioners</p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-gold/20 text-white"
            />
          </div>
          <Button
            onClick={() => setShowCreatePost(true)}
            className="bg-gradient-to-r from-gold to-yellow-600 text-black hover:from-yellow-600 hover:to-gold"
          >
            Start Discussion
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-black/50 border-gold/20 p-4">
              <h3 className="text-gold font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      selectedCategory === cat.id 
                        ? 'bg-gold/20 text-gold' 
                        : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <cat.icon className={`w-5 h-5 ${cat.color}`} />
                    <span className="text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            <OnlineMembers />
          </div>

          {/* Posts Feed */}
          <div className="lg:col-span-3 space-y-4">
            {showCreatePost && (
              <CreatePost
                userId={userId}
                userProfile={userProfile}
                onClose={() => setShowCreatePost(false)}
                onSuccess={() => {
                  setShowCreatePost(false);
                  fetchPosts();
                }}
              />
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-gold">Loading discussions...</div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="bg-black/50 border-gold/20 p-12 text-center">
                <p className="text-gray-400">No discussions found. Start the conversation!</p>
              </Card>
            ) : (
              filteredPosts.map(post => (
                <Card 
                  key={post.id}
                  className="bg-black/50 border-gold/20 hover:border-gold/40 transition-all cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gold/20 text-gold">
                          {post.profiles?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              {post.pinned && <Pin className="w-4 h-4 text-gold" />}
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                              <span>{post.profiles?.full_name}</span>
                              <span>•</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              {post.day_number && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="border-gold/50 text-gold">
                                    Day {post.day_number}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          {post.category && (
                            <Badge className="bg-gold/20 text-gold border-0">
                              {categories.find(c => c.id === post.category)?.name}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-300 line-clamp-2 mb-3">{post.content}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.forum_comments?.[0]?.count || 0} replies
                          </span>
                          <span>
                            {post.forum_reactions?.length || 0} reactions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}