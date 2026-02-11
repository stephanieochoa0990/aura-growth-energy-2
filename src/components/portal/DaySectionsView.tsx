import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { VideoPlayer } from '@/components/portal/VideoPlayer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Music,
  File,
} from 'lucide-react';

export type DaySectionType =
  | 'content'
  | 'transmission'
  | 'lesson'
  | 'practice'
  | 'integration'
  | 'resources';

export interface DaySectionRow {
  id: string;
  day_number: number;
  order_index: number;
  title: string;
  section_type: string;
  content: string | null;
  video_url: string | null;
  audio_url: string | null;
  pdf_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const SECTION_TYPES: { value: DaySectionType; label: string }[] = [
  { value: 'content', label: 'Content' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'lesson', label: 'Lesson' },
  { value: 'practice', label: 'Practice' },
  { value: 'integration', label: 'Integration' },
  { value: 'resources', label: 'Resources' },
];

const emptyForm = () => ({
  title: '',
  section_type: 'content' as DaySectionType,
  content: '',
  video_url: '',
  audio_url: '',
  pdf_url: '',
  is_published: true,
  order_index: null as number | null,
});

export default function DaySectionsView({ dayNumber }: { dayNumber: number }) {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const [sections, setSections] = useState<DaySectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editSection, setEditSection] = useState<DaySectionRow | null>(null);
  const [deleteSection, setDeleteSection] = useState<DaySectionRow | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchSections = useCallback(async () => {
    const { data, error } = await supabase
      .from('day_sections')
      .select('*')
      .eq('day_number', dayNumber)
      .order('order_index', { ascending: true });

    if (error) throw error;
    setSections((data as DaySectionRow[]) || []);
  }, [dayNumber]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await fetchSections();
      } catch (e) {
        console.error('Error loading day sections:', e);
        toast({
          title: 'Error',
          description: 'Could not load sections.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSections, toast]);

  const openAdd = () => {
    setForm(emptyForm());
    setAddOpen(true);
  };

  const openEdit = (row: DaySectionRow) => {
    setForm({
      title: row.title,
      section_type: (row.section_type as DaySectionType) || 'content',
      content: row.content ?? '',
      video_url: row.video_url ?? '',
      audio_url: row.audio_url ?? '',
      pdf_url: row.pdf_url ?? '',
      is_published: row.is_published,
      order_index: row.order_index,
    });
    setEditSection(row);
  };

  const closeEdit = () => {
    setEditSection(null);
    setAddOpen(false);
  };

  const getNextOrderIndex = useCallback(async (): Promise<number> => {
    if (sections.length === 0) return 1;
    const max = Math.max(...sections.map((s) => s.order_index), 0);
    return max + 1;
  }, [sections]);

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const order_index =
        form.order_index != null ? form.order_index : await getNextOrderIndex();
      const { error } = await supabase.from('day_sections').insert({
        day_number: dayNumber,
        order_index,
        title: form.title.trim(),
        section_type: form.section_type,
        content: form.content.trim() || null,
        video_url: form.video_url.trim() || null,
        audio_url: form.audio_url.trim() || null,
        pdf_url: form.pdf_url.trim() || null,
        is_published: form.is_published,
      });
      if (error) throw error;
      toast({ title: 'Section added' });
      closeEdit();
      await fetchSections();
    } catch (e: any) {
      toast({
        title: 'Could not add section',
        description: e?.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editSection || !form.title.trim()) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('day_sections')
        .update({
          title: form.title.trim(),
          section_type: form.section_type,
          content: form.content.trim() || null,
          video_url: form.video_url.trim() || null,
          audio_url: form.audio_url.trim() || null,
          pdf_url: form.pdf_url.trim() || null,
          is_published: form.is_published,
        })
        .eq('id', editSection.id);
      if (error) throw error;
      toast({ title: 'Section updated' });
      closeEdit();
      await fetchSections();
    } catch (e: any) {
      toast({
        title: 'Could not update section',
        description: e?.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSection) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('day_sections')
        .delete()
        .eq('id', deleteSection.id);
      if (error) throw error;
      toast({ title: 'Section deleted' });
      setDeleteSection(null);
      await fetchSections();
    } catch (e: any) {
      toast({
        title: 'Could not delete section',
        description: e?.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (row: DaySectionRow) => {
    try {
      const { error } = await supabase
        .from('day_sections')
        .update({ is_published: !row.is_published })
        .eq('id', row.id);
      if (error) throw error;
      toast({ title: row.is_published ? 'Unpublished' : 'Published' });
      await fetchSections();
    } catch (e: any) {
      toast({
        title: 'Could not update',
        description: e?.message,
        variant: 'destructive',
      });
    }
  };

  const swapOrder = async (a: DaySectionRow, b: DaySectionRow) => {
    try {
      const { error: e1 } = await supabase
        .from('day_sections')
        .update({ order_index: b.order_index })
        .eq('id', a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('day_sections')
        .update({ order_index: a.order_index })
        .eq('id', b.id);
      if (e2) throw e2;
      await fetchSections();
    } catch (e: any) {
      toast({
        title: 'Could not reorder',
        description: e?.message,
        variant: 'destructive',
      });
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    swapOrder(sections[index], sections[index - 1]);
  };

  const moveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    swapOrder(sections[index], sections[index + 1]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading sections…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      )}

      {sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No sections for this day yet.
            {isAdmin && ' Add your first section to get started.'}
          </p>
          {isAdmin && (
            <Button onClick={openAdd} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add your first section
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={section.id} id={`section-${section.id}`} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                    <span>{section.title}</span>
                    <Badge variant="secondary" className="font-normal">
                      {section.section_type}
                    </Badge>
                    {isAdmin && !section.is_published && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Draft
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveDown(index)}
                      disabled={index === sections.length - 1}
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Publish</span>
                      <Switch
                        checked={section.is_published}
                        onCheckedChange={() => handlePublishToggle(section)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(section)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteSection(section)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.content && (
                <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-line">
                  {section.content}
                </div>
              )}
              {section.video_url && (
                <div className="rounded-lg overflow-hidden bg-black/5">
                  <VideoPlayer
                    videoId={section.id}
                    videoUrl={section.video_url}
                    title={section.title}
                    dayNumber={dayNumber}
                    sectionNumber={index + 1}
                  />
                </div>
              )}
              {section.audio_url && (
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={section.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Listen to audio
                  </a>
                </div>
              )}
              {section.pdf_url && (
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={section.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Open PDF
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Section modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <SectionForm form={form} setForm={setForm} showOrderIndex />
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section modal */}
      <Dialog open={!!editSection} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <SectionForm form={form} setForm={setForm} showOrderIndex={false} />
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteSection} onOpenChange={(open) => !open && setDeleteSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteSection?.title}&quot;. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionForm({
  form,
  setForm,
  showOrderIndex,
}: {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  showOrderIndex: boolean;
}) {
  return (
    <div className="grid gap-4 py-2">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Section title"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select
          value={form.section_type}
          onValueChange={(v) => setForm((f) => ({ ...f, section_type: v as DaySectionType }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="content">Content (optional)</Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Text content"
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="video_url">Video URL (optional)</Label>
        <Input
          id="video_url"
          type="url"
          value={form.video_url}
          onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label htmlFor="audio_url">Audio URL (optional)</Label>
        <Input
          id="audio_url"
          type="url"
          value={form.audio_url}
          onChange={(e) => setForm((f) => ({ ...f, audio_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label htmlFor="pdf_url">PDF URL (optional)</Label>
        <Input
          id="pdf_url"
          type="url"
          value={form.pdf_url}
          onChange={(e) => setForm((f) => ({ ...f, pdf_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="is_published"
          checked={form.is_published}
          onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
        />
        <Label htmlFor="is_published">Published (visible to students)</Label>
      </div>
      {showOrderIndex && (
        <div>
          <Label htmlFor="order_index">Order (optional, default: end)</Label>
          <Input
            id="order_index"
            type="number"
            min={1}
            value={form.order_index ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, order_index: v === '' ? null : parseInt(v, 10) || null }));
            }}
            placeholder="Leave empty for end"
          />
        </div>
      )}
    </div>
  );
}
