import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Lock, ArrowRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/portal/VideoPlayer';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
 
interface LessonBlock {
  id: string;
  type: 'text' | 'video';
  content?: string | null;
  url?: string | null;
}

interface ContentSection {
  id: string;
  title: string;
  number?: number;
  blocks: LessonBlock[];
}

interface DayContentProps {
  dayNumber: number;
  title: string;
  description: string;
  sections: ContentSection[];
  continueVideoId?: string | null;
  continueTimestamp?: number | null;
}
export default function DayContent({ 
  dayNumber, 
  title, 
  description, 
  sections, 
  continueVideoId,
  continueTimestamp 
}: DayContentProps) {
  const [openSections, setOpenSections] = useState<string[]>([sections[0]?.id]);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [lockSections, setLockSections] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editSections, setEditSections] = useState<ContentSection[]>(sections);
  const [saving, setSaving] = useState(false);
  const progressKey = `day${dayNumber}_progress`;
  const lockKey = `day${dayNumber}_lock_enabled`;
  const { isAdmin } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(progressKey);
    if (saved) {
      setCompletedSections(JSON.parse(saved));
    }
    const lockSetting = localStorage.getItem(lockKey);
    if (lockSetting !== null) {
      setLockSections(lockSetting === 'true');
    }
    
    // If continuing from a specific video, open that section
    if (continueVideoId) {
      const sectionToOpen = sections.find(s => s.id === continueVideoId);
      if (sectionToOpen) {
        setOpenSections([sectionToOpen.id]);
        // Scroll to the section after a short delay
        setTimeout(() => {
          const element = document.getElementById(`section-${sectionToOpen.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    }
  }, [progressKey, lockKey, continueVideoId, sections]);

  // Keep editable copies in sync when day/content changes
  useEffect(() => {
    setEditTitle(title);
    setEditDescription(description);
    setEditSections(sections);
    setIsEditing(false);
  }, [title, description, sections]);


  const toggleSection = (sectionId: string, index: number) => {
    // Check if section is locked
    if (lockSections && index > 0) {
      const prevSectionId = sections[index - 1].id;
      if (!completedSections.includes(prevSectionId)) {
        return; // Don't open if previous section not completed
      }
    }
    
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const goToNextSection = (currentIndex: number) => {
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      toggleComplete(sections[currentIndex].id);
      setOpenSections([nextSection.id]);
      // Scroll to next section
      setTimeout(() => {
        const element = document.getElementById(`section-${nextSection.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };


  const toggleComplete = (sectionId: string) => {
    const newCompleted = completedSections.includes(sectionId)
      ? completedSections.filter(id => id !== sectionId)
      : [...completedSections, sectionId];
    
    setCompletedSections(newCompleted);
    localStorage.setItem(progressKey, JSON.stringify(newCompleted));
  };

  const markAllComplete = () => {
    const allIds = sections.map(s => s.id);
    setCompletedSections(allIds);
    localStorage.setItem(progressKey, JSON.stringify(allIds));
  };

  const progress = (completedSections.length / sections.length) * 100;

  const handleBlockContentChange = (sectionId: string, blockId: string, value: string) => {
    setEditSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              blocks: section.blocks.map(block =>
                block.id === blockId ? { ...block, content: value } : block
              ),
            }
          : section
      )
    );
  };

  const handleSaveEdits = async () => {
    try {
      setSaving(true);

      // Build payload similar to AdminDailyLessons
      const payloadSections = editSections.map((section, idx) => ({
        id: section.id,
        title: section.title,
        number: idx + 1,
        blocks: (section.blocks || []).map((b) => ({
          id: b.id,
          type: b.type,
          content: b.content ?? '',
          url: b.url ?? null,
        })),
      }));

      const allBlocks = payloadSections.flatMap((s) => s.blocks);
      const videoUrl =
        allBlocks.find((b) => b.type === 'video' && b.url)?.url || null;

      const payload = {
        title: editTitle,
        description: editDescription,
        content: { sections: payloadSections },
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      };

      // Find existing course_content row for this day
      const { data: existing, error: selectError } = await supabase
        .from('course_content')
        .select('id')
        .eq('day_number', dayNumber)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('course_content')
          .update(payload)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('course_content')
          .insert({ day_number: dayNumber, ...payload });

        if (insertError) throw insertError;
      }

      setIsEditing(false);
      toast({
        title: 'Lesson updated',
        description: `Day ${dayNumber} content has been saved.`,
      });
    } catch (error) {
      console.error('Error saving edits:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save lesson content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Day {dayNumber}</p>
              {isEditing ? (
                <>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mb-2"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                </>
              ) : (
                <>
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl leading-tight">
                    {title}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2">
                    {description}
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(progress)}%
                </div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEditing((prev) => !prev)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="min-h-[32px]"
                      onClick={handleSaveEdits}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Progress value={progress} className="h-2" />
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {completedSections.length} of {sections.length} sections completed
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllComplete}
              disabled={completedSections.length === sections.length}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Mark All Complete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Sections */}
      <div className="space-y-3 sm:space-y-4">
        {sections.map((section, index) => {
          const isOpen = openSections.includes(section.id);
          const isCompleted = completedSections.includes(section.id);
          const isLocked = lockSections && index > 0 && !completedSections.includes(sections[index - 1].id);

          return (
            <Card 
              key={section.id} 
              id={`section-${section.id}`}
              className={cn(
                "transition-all",
                isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                isLocked && "opacity-60"
              )}
            >
              <Collapsible open={isOpen && !isLocked}>
                <CollapsibleTrigger
                  onClick={() => toggleSection(section.id, index)}
                  className="w-full"
                  disabled={isLocked}
                >
                  <CardHeader className={cn(
                    "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors p-4 sm:p-6",
                    isLocked && "cursor-not-allowed"
                  )}>
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          {isLocked ? (
                            <Lock className="w-5 h-5 text-gray-400 shrink-0" />
                          ) : (
                            <>
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() => toggleComplete(section.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="min-w-[20px] min-h-[20px]"
                              />
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          {isEditing ? (
                            <Input
                              value={
                                editSections.find((s) => s.id === section.id)?.title ??
                                section.title
                              }
                              onChange={(e) =>
                                setEditSections((prev) =>
                                  prev.map((s) =>
                                    s.id === section.id ? { ...s, title: e.target.value } : s
                                  )
                                )
                              }
                              className="text-base sm:text-lg font-semibold"
                            />
                          ) : (
                            <h3 className="font-semibold text-base sm:text-lg leading-tight break-words">
                              {index + 1}. {section.title}
                            </h3>
                          )}
                          {section.duration && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Duration: {section.duration}
                            </p>
                          )}
                          {isLocked && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Complete previous section to unlock
                            </p>
                          )}
                        </div>
                      </div>
                      {!isLocked && (isOpen ? (
                        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 shrink-0" />
                      ))}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    {/* Blocks */}
                    <div className="space-y-4">
                      {section.blocks.map((block) => (
                        <div key={block.id} className="space-y-2">
                          {block.type === 'text' && (
                            <>
                              {isEditing ? (
                                <Textarea
                                  value={
                                    editSections
                                      .find((s) => s.id === section.id)
                                      ?.blocks.find((b) => b.id === block.id)?.content ?? ''
                                  }
                                  onChange={(e) =>
                                    handleBlockContentChange(
                                      section.id,
                                      block.id,
                                      e.target.value,
                                    )
                                  }
                                  rows={4}
                                />
                              ) : (
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                                  <div className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {block.content}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          {block.type === 'video' && block.url && (
                            <VideoPlayer
                              videoId={block.id}
                              videoUrl={block.url}
                              title={`${section.title} video`}
                              dayNumber={dayNumber}
                              sectionNumber={section.number ?? index + 1}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Continue Button */}
                    {index < sections.length - 1 && (
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => goToNextSection(index)}
                          className="min-h-[44px]"
                        >
                          Continue to Next Section
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {dayNumber > 1 && (
              <Button
                variant="outline"
                onClick={() => window.location.href = `/day-${dayNumber - 1}`}
                className="w-full sm:w-auto min-h-[44px]"
              >
                ← Previous Day
              </Button>
            )}
            <div className="hidden sm:block flex-1" />
            {dayNumber < 7 && (
              <Button
                onClick={() => window.location.href = `/day-${dayNumber + 1}`}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Next Day →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
