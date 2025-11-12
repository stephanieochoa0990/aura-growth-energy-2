import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle } from 'lucide-react';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [setupToken, setSetupToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/admin-login');
      return;
    }
    setUser(user);

    // Check if already admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      navigate('/admin');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('Not authenticated');

      // Verify token exists and is unused
      const { data: tokenData, error: tokenError } = await supabase
        .from('setup_tokens')
        .select('*')
        .eq('token', setupToken)
        .eq('used', false)
        .maybeSingle();

      if (tokenError) throw tokenError;
      if (!tokenData) throw new Error('Invalid or already used setup token');

      // Mark token as used
      const { error: updateTokenError } = await supabase
        .from('setup_tokens')
        .update({ used: true, used_at: new Date().toISOString(), used_by: user.id })
        .eq('id', tokenData.id);

      if (updateTokenError) throw updateTokenError;

      // Set user as admin
      const { error: adminError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);

      if (adminError) throw adminError;

      setSuccess(true);
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to setup admin');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Enter your one-time setup token to gain admin privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Admin privileges granted! Redirecting...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Setup Token</label>
                <Input
                  type="text"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="Enter setup token"
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Setup Admin Access
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Contact your system administrator for the setup token
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
