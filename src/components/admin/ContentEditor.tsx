import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ResourceUploader from './ResourceUploader';
import ContentPreview from './ContentPreview';

import AIContentAssistant from './AIContentAssistant';
import {
  Save,
  Upload,
  Eye,
  History,
  Plus,
  Trash2,
  Video,
  FileText,
  Link,
  Code,
  Sparkles
} from 'lucide-react';


interface ContentEditorProps {
  dayNumber: number;
  onClose: () => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ dayNumber, onClose }) => {
  const [content, setContent] = useState({
    id: null as string | null,
    title: '',
    description: '',
    videoUrl: '',
    videoDuration: 0,
    contentType: 'lesson',
    contentBody: { text: '', sections: [] },
    attachments: [],
    isPublished: false
  });
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
    fetchExercises();
  }, [dayNumber]);

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from('course_content')
        .select('*')
        .eq('day_number', dayNumber)
        .order('order_index');
      
      if (data && data.length > 0) {
        setContent(data[0]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data } = await supabase
        .from('practice_exercises')
        .select('*')
        .eq('day_number', dayNumber)
        .order('order_index');
      
      if (data) {
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const saveContent = async () => {
    setLoading(true);
    try {
      const { contentBody, contentType, videoUrl, videoDuration, isPublished, ...restContent } = content;
      const { error } = await supabase
        .from('course_content')
        .upsert({
          ...restContent,
          content_body: contentBody,
          content_type: contentType,
          video_url: videoUrl,
          video_duration: videoDuration,
          is_published: isPublished,
          day_number: dayNumber,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Content Saved",
        description: `Day ${dayNumber} content has been saved successfully.`
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  const addExercise = () => {
    const newExercise = {
      id: `temp-${Date.now()}`,
      title: '',
      instructions: '',
      exerciseType: 'quiz',
      exerciseData: {},
      solution: {},
      points: 10,
      orderIndex: exercises.length
    };
    setExercises([...exercises, newExercise]);
  };

  const saveExercise = async (exercise: any) => {
    try {
      const { error } = await supabase
        .from('practice_exercises')
        .upsert({
          ...exercise,
          day_number: dayNumber,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Exercise Saved",
        description: "Practice exercise has been saved."
      });
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Day {dayNumber} Content</h2>
        <div className="flex gap-2">

          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveContent} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-1" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIContentAssistant
                dayNumber={dayNumber}
                currentContent={content.contentBody?.text || ''}
                onContentGenerated={(generatedContent) => {
                  setContent({
                    ...content,
                    contentBody: { ...content.contentBody, text: generatedContent }
                  });
                }}
              />
            </div>
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">Quick Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-purple-600 mb-1">💡 Lesson Generation</p>
                    <p className="text-muted-foreground text-xs">
                      Creates complete lessons with meditations, teachings, and exercises
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600 mb-1">🏋️ Exercise Creation</p>
                    <p className="text-muted-foreground text-xs">
                      Generates 3 practice exercises with clear instructions
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-pink-600 mb-1">🧘 Meditation Scripts</p>
                    <p className="text-muted-foreground text-xs">
                      5-7 minute guided meditations with pauses
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-600 mb-1">❓ Quiz Questions</p>
                    <p className="text-muted-foreground text-xs">
                      Auto-generate questions from your content
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-600 mb-1">✨ Format Content</p>
                    <p className="text-muted-foreground text-xs">
                      Polish and improve existing text
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>



        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.title}
                  onChange={(e) => setContent({...content, title: e.target.value})}
                  placeholder="Enter lesson title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={content.description}
                  onChange={(e) => setContent({...content, description: e.target.value})}
                  placeholder="Brief description of the lesson"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Content Type</Label>
                  <Select
                    value={content.contentType}
                    onValueChange={(value) => setContent({...content, contentType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">Lesson</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={content.isPublished}
                    onCheckedChange={(checked) => setContent({...content, isPublished: checked})}
                  />
                  <Label>Published</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Video URL</Label>
                <Input
                  value={content.videoUrl}
                  onChange={(e) => setContent({...content, videoUrl: e.target.value})}
                  placeholder="Enter video URL or upload link"
                />
              </div>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[300px] font-mono"
                value={content.contentBody?.text || ''}
                onChange={(e) => setContent({
                  ...content,
                  contentBody: { ...content.contentBody, text: e.target.value }
                })}
                placeholder="Enter lesson content (supports Markdown)"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Practice Exercises</h3>
            <Button onClick={addExercise}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
          
          {exercises.map((exercise, index) => (
            <Card key={exercise.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Exercise {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExercises(exercises.filter(e => e.id !== exercise.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Exercise title"
                  value={exercise.title}
                  onChange={(e) => {
                    const updated = [...exercises];
                    updated[index] = { ...exercise, title: e.target.value };
                    setExercises(updated);
                  }}
                />
                <Textarea
                  placeholder="Instructions"
                  value={exercise.instructions}
                  onChange={(e) => {
                    const updated = [...exercises];
                    updated[index] = { ...exercise, instructions: e.target.value };
                    setExercises(updated);
                  }}
                />
                <div className="flex gap-2">
                  <Select
                    value={exercise.exerciseType}
                    onValueChange={(value) => {
                      const updated = [...exercises];
                      updated[index] = { ...exercise, exerciseType: value };
                      setExercises(updated);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="discussion">Discussion</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => saveExercise(exercise)}>
                    Save Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceUploader 
            dayNumber={dayNumber} 
            onUploadComplete={() => {
              setShowUploader(false);
              fetchContent();
              toast({
                title: "Upload Complete",
                description: "Resources have been uploaded successfully."
              });
            }}
          />
        </TabsContent>

        <TabsContent value="preview">
          <ContentPreview
            dayNumber={dayNumber}
            content={content}
            exercises={exercises}
          />
        </TabsContent>

      </Tabs>


    </div>
  );
};

export default ContentEditor;