import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Download,
  Upload,
  Copy,
  Trash2,
  GripVertical,
  Edit,
  CheckSquare,
  X,
  Eye
} from 'lucide-react';


interface ContentItem {
  id: string;
  day_number: number;
  title: string;
  content: string;
  order_index: number;
  type: string;
  is_published: boolean;
}
const BulkContentManager: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [batchChanges, setBatchChanges] = useState({
    status: 'no-change' as 'no-change' | 'publish' | 'draft',
    dayNumber: 'no-change' as string,
    contentType: 'no-change' as string
  });
  const { toast } = useToast();


  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .order('day_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === content.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(content.map(c => c.id)));
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Day', 'Title', 'Type', 'Content', 'Order', 'Published'];
    const rows = content.map(item => [
      item.id,
      item.day_number,
      item.title,
      item.type,
      item.content.replace(/"/g, '""'),
      item.order_index,
      item.is_published
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-content-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({ title: 'Exported', description: 'Content exported to CSV' });
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').slice(1);
        
        const imported = lines.map(line => {
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 7) return null;
          
          return {
            id: matches[0].replace(/"/g, ''),
            day_number: parseInt(matches[1]),
            title: matches[2].replace(/"/g, ''),
            type: matches[3].replace(/"/g, ''),
            content: matches[4].replace(/""/g, '"').replace(/^"|"$/g, ''),
            order_index: parseInt(matches[5]),
            is_published: matches[6].includes('true')
          };
        }).filter(Boolean);

        toast({ title: 'Imported', description: `${imported.length} items ready` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to import CSV', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const duplicateSelected = async () => {
    try {
      const toDuplicate = content.filter(c => selected.has(c.id));
      const duplicates = toDuplicate.map(item => ({
        ...item,
        id: undefined,
        title: `${item.title} (Copy)`,
        order_index: item.order_index + 1
      }));

      const { error } = await supabase.from('course_content').insert(duplicates);
      if (error) throw error;

      await fetchAllContent();
      setSelected(new Set());
      toast({ title: 'Duplicated', description: `${duplicates.length} items duplicated` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate', variant: 'destructive' });
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} items?`)) return;

    try {
      const { error } = await supabase
        .from('course_content')
        .delete()
        .in('id', Array.from(selected));

      if (error) throw error;

      await fetchAllContent();
      setSelected(new Set());
      toast({ title: 'Deleted', description: `${selected.size} items deleted` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(itemId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const draggedIndex = content.findIndex(item => item.id === draggedItem);
    const targetIndex = content.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder items in state
    const newContent = [...content];
    const [removed] = newContent.splice(draggedIndex, 1);
    newContent.splice(targetIndex, 0, removed);

    // Update order_index for all items
    const updates = newContent.map((item, index) => ({
      id: item.id,
      order_index: index
    }));

    setContent(newContent);
    setDraggedItem(null);
    setDragOverItem(null);

    // Save to database
    try {
      for (const update of updates) {
        await supabase
          .from('course_content')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
      
      toast({ 
        title: 'Reordered', 
        description: 'Content order updated successfully' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to save new order', 
        variant: 'destructive' 
      });
      await fetchAllContent(); // Revert on error
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const applyBatchChanges = async () => {
    try {
      const updates: any = {};
      
      if (batchChanges.status !== 'no-change') {
        updates.is_published = batchChanges.status === 'publish';
      }
      
      if (batchChanges.dayNumber !== 'no-change') {
        updates.day_number = parseInt(batchChanges.dayNumber);
      }
      
      if (batchChanges.contentType !== 'no-change') {
        updates.type = batchChanges.contentType;
      }

      for (const id of selected) {
        await supabase
          .from('course_content')
          .update(updates)
          .eq('id', id);
      }

      await fetchAllContent();
      setSelected(new Set());
      setPreviewOpen(false);
      setBatchChanges({
        status: 'no-change',
        dayNumber: 'no-change',
        contentType: 'no-change'
      });
      
      toast({ 
        title: 'Batch Edit Applied', 
        description: `Updated ${selected.size} items successfully` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to apply batch changes', 
        variant: 'destructive' 
      });
    }
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bulk Content Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </span>
                </Button>
                <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={selectAll} variant="outline" size="sm">
              <CheckSquare className="h-4 w-4 mr-2" />
              {selected.size === content.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selected.size > 0 && (
              <>
                <Button onClick={() => setPreviewOpen(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Batch Edit ({selected.size})
                </Button>
                <Button onClick={duplicateSelected} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate ({selected.size})
                </Button>
                <Button onClick={deleteSelected} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selected.size})
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2">
            {content.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 border rounded transition-all cursor-move ${
                  draggedItem === item.id 
                    ? 'opacity-50 scale-95' 
                    : 'hover:bg-gray-50'
                } ${
                  dragOverItem === item.id && draggedItem !== item.id
                    ? 'border-blue-500 border-2 bg-blue-50'
                    : ''
                }`}
              >
                <GripVertical className="h-5 w-5 text-gray-400" />
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                />
                <Badge>Day {item.day_number}</Badge>
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.type}</div>
                </div>
                <Badge variant={item.is_published ? 'default' : 'secondary'}>
                  {item.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>

      {/* Batch Edit Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Edit Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status Change</label>
              <Select value={batchChanges.status} onValueChange={(v) => setBatchChanges({...batchChanges, status: v as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-change">No Change</SelectItem>
                  <SelectItem value="publish">Publish All</SelectItem>
                  <SelectItem value="draft">Set to Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Day Number</label>
              <Select value={batchChanges.dayNumber} onValueChange={(v) => setBatchChanges({...batchChanges, dayNumber: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-change">No Change</SelectItem>
                  {[1,2,3,4,5,6,7].map(day => (
                    <SelectItem key={day} value={day.toString()}>Day {day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Content Type</label>
              <Select value={batchChanges.contentType} onValueChange={(v) => setBatchChanges({...batchChanges, contentType: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-change">No Change</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Changes Preview:</h4>
              <div className="text-sm space-y-1">
                <p>• {selected.size} items selected</p>
                {batchChanges.status !== 'no-change' && (
                  <p>• Status → {batchChanges.status === 'publish' ? 'Published' : 'Draft'}</p>
                )}
                {batchChanges.dayNumber !== 'no-change' && (
                  <p>• Day → Day {batchChanges.dayNumber}</p>
                )}
                {batchChanges.contentType !== 'no-change' && (
                  <p>• Type → {batchChanges.contentType}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={applyBatchChanges}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkContentManager;
