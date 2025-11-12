import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface InstructorResponseFormProps {
  reviewId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InstructorResponseForm({ reviewId, onSubmit, onCancel }: InstructorResponseFormProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('instructor_responses').insert({
        review_id: reviewId,
        instructor_id: user.id,
        response
      });

      if (error) throw error;

      onSubmit();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mt-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="response">Your Response</Label>
          <Textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Thank the student and address their feedback..."
            rows={3}
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Response'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}