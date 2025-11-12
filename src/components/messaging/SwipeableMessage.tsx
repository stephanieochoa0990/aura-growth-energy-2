import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onDelete: () => void;
  isOwn: boolean;
}

export const SwipeableMessage = ({ children, onDelete, isOwn }: SwipeableMessageProps) => {
  const [offset, setOffset] = useState(0);
  const touchStart = useRef<number | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    
    const delta = e.touches[0].clientX - touchStart.current;
    
    // Only allow left swipe on own messages
    if (isOwn && delta < 0) {
      setOffset(Math.max(delta, -100));
    }
  };

  const handleTouchEnd = () => {
    if (offset < -60) {
      onDelete();
    }
    setOffset(0);
    touchStart.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      {isOwn && offset < -20 && (
        <div className="absolute right-0 top-0 h-full flex items-center pr-4 bg-red-500">
          <Trash2 className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        ref={messageRef}
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? 'transform 0.3s' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
};
