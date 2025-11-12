import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserCog, Save } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Role {
  name: string;
  display_name: string;
}

const UserRoleAssignment = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, role').order('email'),
        supabase.from('roles').select('name, display_name').order('name')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);

      const initialRoles: Record<string, string> = {};
      usersRes.data?.forEach(user => {
        initialRoles[user.id] = user.role || 'student';
      });
      setSelectedRoles(initialRoles);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveRole = async (userId: string) => {
    setSaving(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        setSaving(null);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('assign-role', {
        body: { targetUserId: userId, roleName: selectedRoles[userId], adminUserId: user.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Role updated successfully' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update role', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };


  if (loading) return <div className="text-center py-8">Loading users...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Assign User Roles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{user.full_name || user.email}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline">{user.role}</Badge>
              <Select value={selectedRoles[user.id]} onValueChange={(v) => setSelectedRoles(p => ({ ...p, [user.id]: v }))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>{role.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => saveRole(user.id)} disabled={selectedRoles[user.id] === user.role || saving === user.id}>
                <Save className="w-4 h-4 mr-1" />
                {saving === user.id ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleAssignment;
