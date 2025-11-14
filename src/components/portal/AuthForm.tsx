import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sha1 from "js-sha1/src/sha1.js";  // <-- Correct import
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

async function checkPasswordLeaked(password: string) {
  const hash = sha1(password).toString().toUpperCase();  // <-- FIX HERE
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const data = await response.text();
  return data.includes(suffix);
}

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const leaked = await checkPasswordLeaked(password);
        if (leaked) {
          toast({
            title: "Insecure Password",
            description: "This password has appeared in breaches. Choose another.",
            variant: "destructive",
          });
          return;
        }

        if (password.length < 10) {
          toast({
            title: "Weak Password",
            description: "Password must be at least 10 characters.",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName
          });

          toast({
            title: "Welcome to the Journey!",
            description: "Your account has been created.",
          });

          navigate('/student-welcome');
          return;
        }

      } else {
        // SIGN IN FLOW
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile?.is_admin) {
            // Check MFA
            const { data: factors } = await supabase.auth.mfa.listFactors();

            if (!factors?.totp || factors.totp.length === 0) {
              navigate('/mfa-setup');
              return;
            }

            toast({
              title: "Admin Access Verified",
              description: "Redirecting...",
            });

            navigate('/admin');
            return;
          }

          toast({
            title: "Welcome back!",
            description: "Redirecting to your portal...",
          });

          navigate('/student-welcome');
          return;
        }
      }

    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md bg-gray-900 border-[#D4AF37]/20">
        <CardHeader className="text-center space-y-3 px-4 sm:px-6 pt-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-black">WL</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-[#D4AF37]">Student Portal</CardTitle>
          <CardDescription className="text-gray-400 text-sm sm:text-base">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleAuth} className="space-y-4">

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-black text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#D4AF37] w-full text-center mt-2"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}