import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Sparkles, Check } from 'lucide-react';
import { WhiteLotus } from './WhiteLotus';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: { email, firstName },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      if (data.success || data.reactivated) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
        setFirstName('');
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else if (data.alreadySubscribed) {
        setStatus('success');
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50 shadow-xl">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <WhiteLotus size="lg" className="text-amber-600" />
      </div>
      
      <div className="relative p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full mb-4">
            <Mail className="w-8 h-8 text-amber-700" />
          </div>
          <h3 className="text-2xl font-light text-gray-800 mb-2">
            Join Our Sacred Circle
          </h3>
          <p className="text-gray-600">
            Receive weekly wisdom, meditation guides, and exclusive offers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="First Name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-white/80 border-amber-200/50 focus:border-amber-400 placeholder:text-gray-400"
            />
          </div>
          
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/80 border-amber-200/50 focus:border-amber-400 placeholder:text-gray-400"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : status === 'success' ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Subscribed!
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Begin Your Journey
              </>
            )}
          </Button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
            status === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Join 10,000+ seekers on their spiritual journey
          </p>
          <p className="text-xs text-gray-400 mt-1">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </Card>
  );
}