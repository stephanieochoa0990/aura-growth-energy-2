import { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface ReviewFormProps {
  classId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ReviewForm({ classId, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files).slice(0, 3 - photos.length)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to submit a review');
      }

      const { data, error } = await supabase.functions.invoke('submit-review', {
        body: {
          userId: user.id,
          classId,
          reviewData: { rating, title, content }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      // Upload photos if any
      if (photos.length > 0 && data.review) {
        for (const photo of photos) {
          const fileName = `${data.review.id}/${Date.now()}_${photo.name}`;
          await supabase.storage.from('review-photos').upload(fileName, photo);
          
          const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(fileName);
          
          await supabase.from('review_photos').insert({
            review_id: data.review.id,
            photo_url: publicUrl
          });
        }
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Rating</Label>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer ${
                  star <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="title">Review Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            required
          />
        </div>

        <div>
          <Label htmlFor="content">Your Review</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your detailed experience..."
            rows={4}
            required
          />
        </div>

        <div>
          <Label>Photos (Optional, max 3)</Label>
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
              disabled={photos.length >= 3}
            />
            <label htmlFor="photo-upload">
              <Button type="button" variant="outline" size="sm" asChild disabled={photos.length >= 3}>
                <span><Upload className="w-4 h-4 mr-2" />Add Photos</span>
              </Button>
            </label>
            <div className="flex gap-2 mt-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(photo)} alt="" className="w-20 h-20 object-cover rounded" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => removePhoto(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}