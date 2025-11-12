import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title: string;
    content: string;
    is_verified: boolean;
    helpful_count: number;
    created_at: string;
    user_name: string;
    user_avatar?: string;
    photos?: string[];
    instructor_response?: {
      response: string;
      instructor_name: string;
      created_at: string;
    };
  };
  onHelpful: (reviewId: string) => void;
  onRespond?: (reviewId: string) => void;
  isInstructor?: boolean;
}

export function ReviewCard({ review, onHelpful, onRespond, isInstructor }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={review.user_avatar} />
          <AvatarFallback>{review.user_name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{review.user_name}</h4>
            {review.is_verified && (
              <Badge variant="secondary" className="text-xs">Verified Student</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            {renderStars(review.rating)}
            <span className="text-sm text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <h5 className="font-medium mb-2">{review.title}</h5>
          <p className="text-sm text-muted-foreground mb-3">{review.content}</p>
          
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mb-3">
              {review.photos.map((photo, idx) => (
                <img key={idx} src={photo} alt="" className="w-20 h-20 object-cover rounded" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onHelpful(review.id)}>
              <ThumbsUp className="w-4 h-4 mr-1" />
              Helpful ({review.helpful_count})
            </Button>
            {isInstructor && onRespond && (
              <Button variant="ghost" size="sm" onClick={() => onRespond(review.id)}>
                <MessageSquare className="w-4 h-4 mr-1" />
                Respond
              </Button>
            )}
          </div>

          {review.instructor_response && (
            <div className="mt-4 pl-4 border-l-2 border-purple-200">
              <p className="text-sm font-medium mb-1">Response from {review.instructor_response.instructor_name}</p>
              <p className="text-sm text-muted-foreground">{review.instructor_response.response}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}