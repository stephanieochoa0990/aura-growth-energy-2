import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Download, Play, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import PreviewModeToggle from './PreviewModeToggle';

interface ContentPreviewProps {
  dayNumber: number;
  content: any;
  exercises: any[];
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ dayNumber, content, exercises }) => {
  const [openSections, setOpenSections] = useState<string[]>(['section-1']);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');


  const sections = content.contentBody?.sections || [
    { id: 'section-1', title: 'Main Content', content: content.contentBody?.text || '' }
  ];

  const progress = sections.length > 0 
    ? (completedSections.length / sections.length) * 100 
    : 0;

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const toggleComplete = (sectionId: string) => {
    setCompletedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const maxWidth = previewMode === 'mobile' ? 'max-w-md' : previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-full';

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-purple-600">PREVIEW MODE</Badge>
            {!content.isPublished && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Unpublished
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            This is exactly how students will see the content. All interactions are functional.
          </p>
        </div>
        <PreviewModeToggle mode={previewMode} onModeChange={setPreviewMode} />
      </div>

      {/* Preview Container with responsive width */}
      <div className={cn("mx-auto transition-all duration-300", maxWidth)}>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg space-y-6">


      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Day {dayNumber}</p>
              <CardTitle className="text-3xl">{content.title || 'Untitled Lesson'}</CardTitle>
              <p className="text-muted-foreground mt-2">{content.description || 'No description'}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{Math.round(progress)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-4">
            {completedSections.length} of {sections.length} sections completed
          </p>
        </CardContent>
      </Card>

      {/* Video Section */}
      {content.videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Video Lesson
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={content.videoUrl}
                className="w-full h-full"
                allowFullScreen
                title={`Day ${dayNumber} Video`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Sections */}
      <div className="space-y-4">
        {sections.map((section: any, index: number) => {
          const isOpen = openSections.includes(section.id);
          const isCompleted = completedSections.includes(section.id);

          return (
            <Card
              key={section.id}
              className={cn(
                "transition-all",
                isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200"
              )}
            >
              <Collapsible open={isOpen}>
                <CollapsibleTrigger
                  onClick={() => toggleSection(section.id)}
                  className="w-full"
                >
                  <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleComplete(section.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">
                            {index + 1}. {section.title}
                          </h3>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-6 h-6 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {section.content}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Exercises */}
      {exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Practice Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.map((exercise, index) => {
              const isCompleted = completedExercises.includes(exercise.id);
              return (
                <Card key={exercise.id} className={cn(isCompleted && "bg-green-50 dark:bg-green-950/20")}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => {
                          setCompletedExercises(prev =>
                            prev.includes(exercise.id)
                              ? prev.filter(id => id !== exercise.id)
                              : [...prev, exercise.id]
                          );
                        }}
                      />
                      <div>
                        <h4 className="font-semibold">Exercise {index + 1}: {exercise.title}</h4>
                        <Badge variant="outline" className="mt-1">{exercise.exerciseType}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
                    <Button className="mt-4" size="sm">Start Exercise</Button>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {content.attachments && content.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resources & Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {content.attachments.map((attachment: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">{attachment.name || `Resource ${index + 1}`}</span>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
};

export default ContentPreview;
