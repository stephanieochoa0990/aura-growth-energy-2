import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Sparkles, Hash, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatePostProps {
  userId: string;
  userProfile: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePost({ userId, userProfile, onClose, onSuccess }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'daily', label: 'Daily Practice', icon: Sparkles },
    { value: 'insights', label: 'Insights & Breakthroughs', icon: TrendingUp },
    { value: 'questions', label: 'Questions', icon: Hash },
    { value: 'support', label: 'Support Circle', icon: Users },
    { value: 'general', label: 'General Discussion', icon: Hash }
  ];

  const prompts = [
    "What breakthrough did you experience today?",
    "What resistance are you working through?",
    "Share a moment of clarity from your practice",
    "What question is alive in you right now?",
    "How has this journey shifted your perspective?"
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        category,
        day_number: userProfile?.current_day,
        anonymous
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Post Created",
        description: "Your discussion has been shared with the community!",
      });
      onSuccess();
    }

    setLoading(false);
  }

  return (
    <Card className="bg-black/50 border-gold/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-gold">Start a Discussion</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Title</Label>
            <Input
              id="title"
              placeholder="What would you like to discuss?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black border-gray-700 text-white"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-300">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-black border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-gray-300">Your Message</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, experiences, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-black border-gray-700 text-white min-h-[200px]"
              required
            />
            
            {/* Writing Prompts */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Need inspiration? Try one of these prompts:</p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setContent(prompt + "\n\n")}
                    className="text-xs px-2 py-1 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <Label htmlFor="anonymous" className="text-gray-300 cursor-pointer">
                Post anonymously
              </Label>
            </div>
            <Switch
              id="anonymous"
              checked={anonymous}
              onCheckedChange={setAnonymous}
            />
          </div>

          {/* Current Day Badge */}
          {userProfile?.current_day && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Posting from:</span>
              <span className="px-2 py-1 bg-gold/20 text-gold rounded">
                Day {userProfile.current_day} Journey
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-black hover:from-yellow-600 hover:to-gold"
            >
              {loading ? 'Creating...' : 'Create Discussion'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}