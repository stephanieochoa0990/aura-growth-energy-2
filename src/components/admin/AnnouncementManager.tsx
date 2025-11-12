import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Send, Bell, AlertCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  target_audience: 'all' | 'students' | 'instructors';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
  author?: {
    full_name: string;
  };
}

interface AnnouncementManagerProps {
  userRole: 'instructor' | 'admin';
}

const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({ userRole }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all' as const,
    priority: 'normal' as const,
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_author_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map(a => ({
        ...a,
        author: a.profiles
      })) || [];
      
      setAnnouncements(formattedData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        
        toast({
          title: "Announcement Updated",
          description: "Announcement has been updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            ...formData,
            author_id: user?.id
          });

        if (error) throw error;
        
        toast({
          title: "Announcement Created",
          description: "New announcement has been created successfully"
        });
      }

      // Send email notification if announcement is active
      if (formData.is_active) {
        await sendAnnouncementEmail();
      }

      setShowAddDialog(false);
      setEditingAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive"
      });
    }
  };

  const sendAnnouncementEmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get target users
      let query = supabase.from('profiles').select('email, full_name');
      
      if (formData.target_audience === 'students') {
        query = query.eq('role', 'student');
      } else if (formData.target_audience === 'instructors') {
        query = query.in('role', ['instructor', 'admin']);
      }

      const { data: users } = await query;

      if (users && users.length > 0) {
        // Send emails to all target users
        const emailPromises = users.map(user => 
          supabase.functions.invoke('send-notification-email', {
            body: {
              to: user.email,
              subject: `Important Announcement: ${formData.title}`,
              emailType: 'announcement',
              studentName: user.full_name,
              content: formData.content
            },
            headers: session?.access_token ? {
              Authorization: `Bearer ${session.access_token}`
            } : {}
          })
        );

        await Promise.all(emailPromises);
        
        toast({
          title: "Emails Sent",
          description: `Announcement sent to ${users.length} recipients`
        });
      }
    } catch (error) {
      console.error('Error sending announcement emails:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Announcement Deleted",
        description: "Announcement has been removed successfully"
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_audience: announcement.target_audience,
      priority: announcement.priority,
      is_active: announcement.is_active
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      target_audience: 'all',
      priority: 'normal',
      is_active: true
    });
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Announcements</CardTitle>
            <Button onClick={() => {
              resetForm();
              setEditingAnnouncement(null);
              setShowAddDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        {getPriorityBadge(announcement.priority)}
                        <Badge className="bg-purple-100 text-purple-800">
                          {announcement.target_audience}
                        </Badge>
                        {!announcement.is_active && (
                          <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{announcement.content}</p>
                      <div className="text-sm text-gray-500">
                        By {announcement.author?.full_name} • {new Date(announcement.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No announcements yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter announcement content"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <Select 
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({...formData, target_audience: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="instructors">Instructors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                {editingAnnouncement ? 'Update' : 'Create'} & Send
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingAnnouncement(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouncementManager;