import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark,
  MoreVertical, Flag, Edit, Trash, ThumbsUp, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiscussionThreadProps {
  post: any;
  userId: string;
  userProfile: any;
  onBack: () => void;
}

export default function DiscussionThread({ post, userId, userProfile, onBack }: DiscussionThreadProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const reactionTypes = [
    { type: 'heart', icon: Heart, label: 'Love' },
    { type: 'thumbsup', icon: ThumbsUp, label: 'Helpful' },
    { type: 'sparkles', icon: Sparkles, label: 'Insightful' }
  ];

  useEffect(() => {
    fetchComments();
    fetchReactions();
  }, [post.id]);

  async function fetchComments() {
    const { data } = await supabase
      .from('forum_comments')
      .select(`
        *,
        profiles:user_id (id, full_name, email, avatar_url)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
    setLoading(false);
  }

  async function fetchReactions() {
    const { data } = await supabase
      .from('forum_reactions')
      .select('*')
      .eq('post_id', post.id);

    if (data) {
      setReactions(data);
      const userReact = data.find(r => r.user_id === userId);
      if (userReact) setUserReaction(userReact.reaction_type);
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: post.id,
        user_id: userId,
        content: newComment,
        parent_id: replyTo
      });

    if (!error) {
      toast({
        title: "Comment Added",
        description: "Your comment has been posted!",
      });
      setNewComment('');
      setReplyTo(null);
      fetchComments();
    }
  }

  async function toggleReaction(type: string) {
    if (userReaction === type) {
      await supabase
        .from('forum_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', userId);
      setUserReaction(null);
    } else {
      await supabase
        .from('forum_reactions')
        .upsert({
          post_id: post.id,
          user_id: userId,
          reaction_type: type
        });
      setUserReaction(type);
    }
    fetchReactions();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-gold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>

        {/* Main Post */}
        <Card className="bg-black/50 border-gold/20 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gold/20 text-gold">
                    {post.profiles?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{post.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="font-medium">{post.profiles?.full_name}</span>
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
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Post
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  {post.user_id === userId ? (
                    <>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem>
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
              {reactionTypes.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReaction(type)}
                  className={`${
                    userReaction === type 
                      ? 'text-gold bg-gold/20' 
                      : 'text-gray-400 hover:text-gold'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {reactions.filter(r => r.reaction_type === type).length || 0}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comment Form */}
        <Card className="bg-black/50 border-gold/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-gold/20 text-gold">
                  {userProfile?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-black border-gray-700 text-white min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={addComment}
                    className="bg-gradient-to-r from-gold to-yellow-600 text-black hover:from-yellow-600 hover:to-gold"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gold">Loading comments...</div>
            </div>
          ) : comments.length === 0 ? (
            <Card className="bg-black/50 border-gold/20">
              <CardContent className="text-center py-8">
                <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
              </CardContent>
            </Card>
          ) : (
            comments.map(comment => (
              <Card key={comment.id} className="bg-black/50 border-gold/20">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gold/20 text-gold">
                        {comment.profiles?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">
                          {comment.profiles?.full_name}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-300">{comment.content}</p>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-gray-400 hover:text-gold"
                        onClick={() => setReplyTo(comment.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}