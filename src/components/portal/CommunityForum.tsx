import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Heart, Plus, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommunityForumProps {
  userId: string;
  userProfile: any;
}

export default function CommunityForum({ userId, userProfile }: CommunityForumProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from('forum_posts')
      .select(`
        *,
        profiles:user_id (full_name, email),
        forum_comments (count)
      `)
      .order('created_at', { ascending: false });

    if (data) setPosts(data);
    setLoading(false);
  }

  async function createPost() {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: userId,
        title: newPostTitle,
        content: newPostContent,
        day_number: userProfile?.current_day
      });

    if (!error) {
      toast({
        title: "Post Created",
        description: "Your post has been shared with the community!",
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPost(false);
      fetchPosts();
    }
  }

  async function likePost(postId: string, currentLikes: number) {
    await supabase
      .from('forum_posts')
      .update({ likes_count: currentLikes + 1 })
      .eq('id', postId);
    
    fetchPosts();
  }

  if (loading) return <div className="text-gold">Loading community posts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gold">Community Forum</h2>
          <p className="text-gray-400 mt-1">Connect and share with fellow students</p>
        </div>
        <Button
          onClick={() => setShowNewPost(!showNewPost)}
          className="bg-gold text-black hover:bg-yellow-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {showNewPost && (
        <Card className="bg-gray-900 border-gold/20 mb-6">
          <CardHeader>
            <CardTitle className="text-gold">Share Your Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Post title..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="bg-black border-gray-700 text-white"
            />
            <Textarea
              placeholder="Share your thoughts, insights, or questions..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="bg-black border-gray-700 text-white min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={createPost}
                className="bg-gold text-black hover:bg-yellow-600"
              >
                Post
              </Button>
              <Button
                onClick={() => {
                  setShowNewPost(false);
                  setNewPostTitle('');
                  setNewPostContent('');
                }}
                variant="outline"
                className="border-gray-700 text-gray-400"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="bg-gray-900 border-gold/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-gold">{post.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{post.profiles?.full_name || 'Anonymous'}</span>
                    {post.day_number && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="border-gold/50 text-gold">
                          Day {post.day_number}
                        </Badge>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">{post.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => likePost(post.id, post.likes_count)}
                  className="text-gray-400 hover:text-gold"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  {post.likes_count || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gold"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.forum_comments?.[0]?.count || 0} Comments
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <Card className="bg-gray-900 border-gold/20">
          <CardContent className="text-center py-12">
            <p className="text-gray-400">No posts yet. Be the first to share!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}