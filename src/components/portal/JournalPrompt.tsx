import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BookOpen, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JournalPromptProps {
  sectionId: string;
  prompt: string;
  dayNumber: number;
}

export default function JournalPrompt({ sectionId, prompt, dayNumber }: JournalPromptProps) {
  const [note, setNote] = useState('');
  const { toast } = useToast();
  const storageKey = `journal_day${dayNumber}_${sectionId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setNote(saved);
    }
  }, [storageKey]);

  const handleSave = () => {
    localStorage.setItem(storageKey, note);
    toast({
      title: 'Journal entry saved',
      description: 'Your reflection has been saved successfully.',
    });
  };

  return (
    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
      <div className="flex items-start gap-3 mb-3">
        <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm sm:text-base text-amber-900 dark:text-amber-100 mb-2">
            Reflection Prompt
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            {prompt}
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your reflections here..."
            className="min-h-[100px] bg-white dark:bg-gray-900 text-sm sm:text-base"
          />
          <Button
            onClick={handleSave}
            size="sm"
            className="mt-3 min-h-[44px] sm:min-h-0"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Reflection
          </Button>
        </div>
      </div>
    </Card>
  );
}
