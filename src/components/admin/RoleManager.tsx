import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Check } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: Record<string, boolean>;
}

const RoleManager = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('name');
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load roles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-600',
      content_manager: 'bg-blue-600',
      moderator: 'bg-green-600',
      support_staff: 'bg-yellow-600'
    };
    return colors[roleName] || 'bg-gray-600';
  };

  if (loading) return <div className="text-center py-8">Loading roles...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Role Management
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={getRoleBadgeColor(role.name)}>{role.display_name}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold text-sm mb-2">Permissions:</h4>
              <div className="grid gap-1">
                {Object.entries(role.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    {value && <Check className="w-4 h-4 text-green-600" />}
                    <span className={value ? '' : 'text-muted-foreground line-through'}>
                      {key.replace(/_/g, ' ').replace('can ', '')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoleManager;
