import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AIContentAssistantProps {
  onContentGenerated?: (content: string) => void;
  currentContent?: string;
  dayNumber?: number;
}

export default function AIContentAssistant({ 
  onContentGenerated, 
  currentContent = '',
  dayNumber = 1 
}: AIContentAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateContent = async (type: string) => {
    if (!prompt && type !== 'format') {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt or theme',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-content-ai', {
        body: {
          type,
          prompt,
          context: type === 'format' || type === 'quiz' ? currentContent : prompt,
          dayNumber,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedContent(data.content);
        toast({
          title: 'Content Generated',
          description: 'AI has created your content successfully',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const useContent = () => {
    if (onContentGenerated) {
      onContentGenerated(generatedContent);
      toast({ title: 'Content applied' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Content Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lesson" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="lesson">Lesson</TabsTrigger>
            <TabsTrigger value="exercise">Exercise</TabsTrigger>
            <TabsTrigger value="meditation">Meditation</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
          </TabsList>

          <TabsContent value="lesson" className="space-y-4">
            <div>
              <Label>Day Number</Label>
              <Input type="number" value={dayNumber} disabled className="mt-1" />
            </div>
            <div>
              <Label>Lesson Theme</Label>
              <Textarea
                placeholder="e.g., Understanding the layers of the aura and their significance"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <Button 
              onClick={() => generateContent('lesson')} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Generate Lesson</span>
            </Button>
          </TabsContent>

          <TabsContent value="exercise" className="space-y-4">
            <div>
              <Label>Exercise Focus</Label>
              <Textarea
                placeholder="e.g., Grounding techniques for energy protection"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <Button 
              onClick={() => generateContent('exercise')} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Generate Exercises</span>
            </Button>
          </TabsContent>

          <TabsContent value="meditation" className="space-y-4">
            <div>
              <Label>Meditation Purpose</Label>
              <Textarea
                placeholder="e.g., Connecting with your aura and sensing its boundaries"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <Button 
              onClick={() => generateContent('meditation')} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Generate Meditation Script</span>
            </Button>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate quiz questions based on your current content
            </p>
            <Button 
              onClick={() => generateContent('quiz')} 
              disabled={loading || !currentContent}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Generate Quiz Questions</span>
            </Button>
          </TabsContent>

          <TabsContent value="format" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Improve formatting and readability of your current content
            </p>
            <Button 
              onClick={() => generateContent('format')} 
              disabled={loading || !currentContent}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Format Content</span>
            </Button>
          </TabsContent>
        </Tabs>

        {generatedContent && (
          <div className="mt-6 space-y-3">
            <Label>Generated Content</Label>
            <div className="relative">
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={useContent} className="flex-1">
                Use This Content
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedContent('')}
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}