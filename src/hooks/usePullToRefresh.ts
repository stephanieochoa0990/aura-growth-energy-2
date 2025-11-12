import { useRef, useEffect, useState, RefObject } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
}

export const usePullToRefresh = (
  elementRef: RefObject<HTMLElement>,
  config: PullToRefreshConfig
) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStart = useRef<number | null>(null);
  const threshold = config.threshold || 80;
  const maxPull = config.maxPullDistance || 120;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        touchStart.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart.current === null || element.scrollTop > 0) return;

      const delta = e.touches[0].clientY - touchStart.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta, maxPull));
        setIsPulling(true);
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold) {
        await config.onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
      touchStart.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [config, pullDistance, threshold, maxPull]);

  return { isPulling, pullDistance };
};
