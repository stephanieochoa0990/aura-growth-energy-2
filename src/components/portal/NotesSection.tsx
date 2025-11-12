import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotesSectionProps {
  sectionId: string;
  placeholder?: string;
}

export function NotesSection({ sectionId, placeholder = "Write your reflections here..." }: NotesSectionProps) {
  const [notes, setNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load saved notes on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes_${sectionId}`);
    if (savedNotes) {
      setNotes(savedNotes);
      // Auto-resize on load
      setTimeout(() => adjustHeight(), 0);
    }
  }, [sectionId]);

  // Auto-resize textarea
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    }
  };

  const handleChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
    adjustHeight();
  };

  const handleSave = () => {
    localStorage.setItem(`notes_${sectionId}`, notes);
    setHasChanges(false);
    toast({
      title: "Notes Saved",
      description: "Your reflections have been saved locally.",
    });
  };

  const handleClear = () => {
    setNotes('');
    localStorage.removeItem(`notes_${sectionId}`);
    setHasChanges(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    toast({
      title: "Notes Cleared",
      description: "Your notes have been removed.",
    });
  };

  return (
    <div className="mt-6 space-y-3 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
      <label className="text-sm font-medium text-purple-200">Your Notes</label>
      <Textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] resize-none bg-white/10 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
        style={{ overflow: 'hidden' }}
      />
      <div className="flex gap-2 justify-end">
        <Button
          onClick={handleClear}
          variant="outline"
          size="sm"
          className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
          disabled={!notes}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
        <Button
          onClick={handleSave}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={!hasChanges}
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
      {hasChanges && (
        <p className="text-xs text-yellow-400">You have unsaved changes</p>
      )}
    </div>
  );
}