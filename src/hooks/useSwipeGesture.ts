import { useRef, useEffect, RefObject } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipeGesture = (
  elementRef: RefObject<HTMLElement>,
  config: SwipeConfig
) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const threshold = config.threshold || 50;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold && config.onSwipeRight) {
          config.onSwipeRight();
        } else if (deltaX < -threshold && config.onSwipeLeft) {
          config.onSwipeLeft();
        }
      } else {
        if (deltaY > threshold && config.onSwipeDown) {
          config.onSwipeDown();
        } else if (deltaY < -threshold && config.onSwipeUp) {
          config.onSwipeUp();
        }
      }

      touchStart.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [config, threshold]);
};
