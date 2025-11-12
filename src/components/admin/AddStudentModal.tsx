import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeWithAuth } from '@/utils/invokeWithAuth';
import { logTokenDiagnostics } from '@/lib/token-debug';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: () => void;
}

export default function AddStudentModal({ open, onOpenChange, onStudentAdded }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log comprehensive token diagnostics
      console.log('=== Token Diagnostics Before API Call ===');
      await logTokenDiagnostics();

      // Verify session and admin status
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      console.log('Session expires at:', new Date(session.expires_at! * 1000).toISOString());
      console.log('Current time:', new Date().toISOString());

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', session.user.id)
        .single();

      console.log('Admin check:', { 
        userId: session.user.id, 
        email: session.user.email,
        isAdmin: profile?.is_admin,
        role: profile?.role 
      });

      if (!profile?.is_admin) {
        throw new Error('Unauthorized: Admin access required');
      }

      console.log('Calling add-student function with:', {
        fullName: formData.fullName,
        email: formData.email,
        hasPassword: !!formData.password,
        tokenPreview: session.access_token.substring(0, 50) + '...'
      });

      // Use invokeWithAuth utility
      const { data, error } = await invokeWithAuth('add-student', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to add student');
      }

      toast({
        title: "Student Added",
        description: `${formData.fullName} has been enrolled successfully.`
      });

      setFormData({ fullName: '', email: '', password: '' });
      onStudentAdded();
      onOpenChange(false);
    } catch (error: any) {

      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to add student',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };




  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Student'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
