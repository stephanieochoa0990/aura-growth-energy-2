import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sha1 from 'js-sha1';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';


async function checkPasswordLeaked(password: string) {
  const hash = sha1(password).toUpperCase();
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
            description: "This password has been found in data breaches. Please choose another.",
            variant: "destructive",
          });
          return;
        }

        if (password.length < 10) {
          toast({
            title: "Weak Password",
            description: "Password must be at least 10 characters long.",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
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
            description: "Your account has been created successfully.",
          });
          navigate('/student-welcome');
        }
      } else {
        // Sign in flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          // Query profiles table to check admin status - use maybeSingle() to handle missing profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.user.id)  // Use 'id' column which matches auth.users.id
            .maybeSingle();

          // Check if user is admin
          if (profile?.is_admin) {
  // Check if MFA already enabled
  const { data: factors } = await supabase.auth.mfa.listFactors();

  if (!factors.totp.length) {
    // Admin MUST set up MFA
    navigate('/mfa-setup');
    return;
  }

  toast({
    title: "Admin Access Granted",
    description: "Redirecting to admin dashboard..."
  });
  navigate('/admin');
}
);
            navigate('/admin');
          } else {
            toast({
              title: "Welcome back!",
              description: "Redirecting to student portal...",
            });
            navigate('/student-welcome');
          }
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-black">WL</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-[#D4AF37]">Student Portal</CardTitle>
          <CardDescription className="text-gray-400 text-sm sm:text-base">
            {isSignUp ? 'Create your account to begin your journey' : 'Sign in to access your materials'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300 text-base">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  className="bg-black border-gray-700 text-white min-h-[44px] text-base"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black border-gray-700 text-white min-h-[44px] text-base"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-base">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black border-gray-700 text-white min-h-[44px] text-base"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black hover:bg-yellow-600 min-h-[48px] text-base font-medium mt-6"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm sm:text-base text-[#D4AF37] hover:underline min-h-[44px] inline-flex items-center"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
