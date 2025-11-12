import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Link, FileText, StickyNote, BookOpen, 
  Plus, ExternalLink, Download, Share2 
} from 'lucide-react';
import { format } from 'date-fns';

interface SharedResource {
  id: string;
  resource_type: string;
  title: string;
  content?: string;
  url?: string;
  created_at: string;
  shared_by: {
    full_name: string;
  };
}

interface ResourceSharingProps {
  conversationId?: string | null;
}

export default function ResourceSharing({ conversationId }: ResourceSharingProps) {
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [resourceType, setResourceType] = useState('link');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceContent, setResourceContent] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (conversationId) {
      fetchResources();
    }
  }, [conversationId]);

  const fetchResources = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('shared_resources')
        .select(`
          *,
          shared_by:profiles!shared_resources_shared_by_fkey (full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareResource = async () => {
    if (!resourceTitle || !conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('shared_resources')
        .insert({
          conversation_id: conversationId,
          shared_by: user.id,
          resource_type: resourceType,
          title: resourceTitle,
          content: resourceContent || null,
          url: resourceUrl || null
        });

      if (error) throw error;

      // Send a message about the shared resource
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `Shared a ${resourceType}: ${resourceTitle}`,
          message_type: 'resource',
          metadata: { resource_type: resourceType, title: resourceTitle }
        });

      setShowShareDialog(false);
      setResourceTitle('');
      setResourceContent('');
      setResourceUrl('');
      fetchResources();
    } catch (error) {
      console.error('Error sharing resource:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link': return Link;
      case 'file': return FileText;
      case 'note': return StickyNote;
      case 'practice': return BookOpen;
      default: return FileText;
    }
  };

  const getResourceBadgeVariant = (type: string) => {
    switch (type) {
      case 'link': return 'default';
      case 'file': return 'secondary';
      case 'note': return 'outline';
      case 'practice': return 'destructive';
      default: return 'default';
    }
  };

  if (!conversationId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a conversation to view shared resources</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shared Resources</h3>
        <Button onClick={() => setShowShareDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Share Resource
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading resources...</p>
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No resources shared yet</p>
              <p className="text-sm mt-2">Share helpful links, notes, or practice materials</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => {
            const Icon = getResourceIcon(resource.resource_type);
            
            return (
              <Card key={resource.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{resource.title}</p>
                          <Badge variant={getResourceBadgeVariant(resource.resource_type) as any}>
                            {resource.resource_type}
                          </Badge>
                        </div>
                        {resource.content && (
                          <p className="text-sm text-muted-foreground">{resource.content}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Shared by {resource.shared_by.full_name}</span>
                          <span>{format(new Date(resource.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    {resource.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Resource Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="practice">Practice Material</SelectItem>
                <SelectItem value="file">File Reference</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Resource title"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
            />

            {(resourceType === 'link' || resourceType === 'file') && (
              <Input
                placeholder="URL or file path"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
            )}

            <Textarea
              placeholder="Description or notes (optional)"
              value={resourceContent}
              onChange={(e) => setResourceContent(e.target.value)}
              rows={3}
            />

            <Button onClick={shareResource} className="w-full">
              Share Resource
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}