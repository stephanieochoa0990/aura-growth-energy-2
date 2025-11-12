import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeWithAuth } from '@/utils/invokeWithAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, Flag, Pin, Check, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [flagReason, setFlagReason] = useState('');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (full_name, avatar_url),
        class_materials (title)
      `)
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('status', 'pending');
    } else if (filter === 'flagged') {
      query = query.eq('flagged', true);
    } else if (filter === 'pinned') {
      query = query.eq('pinned', true);
    }

    const { data } = await query;
    setReviews(data || []);
  };

  const moderateReview = async (reviewId: string, action: string, pinnedOrder?: number) => {
    try {
      const { data, error } = await invokeWithAuth('moderate-review', {
        reviewId,
        action,
        flagReason,
        pinnedOrder,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: `Review ${action}ed successfully` });
        loadReviews();
        setSelectedReview(null);
        setFlagReason('');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to moderate review', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
          Pending
        </Button>
        <Button variant={filter === 'flagged' ? 'default' : 'outline'} onClick={() => setFilter('flagged')}>
          Flagged
        </Button>
        <Button variant={filter === 'pinned' ? 'default' : 'outline'} onClick={() => setFilter('pinned')}>
          Pinned
        </Button>
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All
        </Button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">{review.profiles?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{review.class_materials?.title}</p>
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={review.status === 'approved' ? 'default' : review.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {review.status}
                </Badge>
                {review.flagged && <Badge variant="destructive"><Flag className="w-3 h-3" /></Badge>}
                {review.pinned && <Badge variant="outline"><Pin className="w-3 h-3" /></Badge>}
              </div>
            </div>

            <p className="text-sm mb-4">{review.comment}</p>

            {review.flagged && review.flag_reason && (
              <div className="bg-red-50 p-3 rounded mb-4">
                <p className="text-sm text-red-800"><AlertTriangle className="w-4 h-4 inline mr-2" />Flag Reason: {review.flag_reason}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {review.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => moderateReview(review.id, 'approve')}>
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => moderateReview(review.id, 'reject')}>
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </>
              )}
              {!review.flagged ? (
                <Button size="sm" variant="outline" onClick={() => setSelectedReview(review.id)}>
                  <Flag className="w-4 h-4 mr-2" /> Flag
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => moderateReview(review.id, 'unflag')}>
                  Unflag
                </Button>
              )}
              {!review.pinned ? (
                <Button size="sm" variant="outline" onClick={() => moderateReview(review.id, 'pin', 0)}>
                  <Pin className="w-4 h-4 mr-2" /> Pin
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => moderateReview(review.id, 'unpin')}>
                  Unpin
                </Button>
              )}
            </div>

            {selectedReview === review.id && (
              <div className="mt-4 space-y-2">
                <Textarea placeholder="Flag reason..." value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
                <Button size="sm" onClick={() => moderateReview(review.id, 'flag')}>Submit Flag</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}