import { useRef, useEffect, useState, RefObject } from 'react';

export const usePinchZoom = (elementRef: RefObject<HTMLElement>) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastDistance = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastDistance.current = getDistance(e.touches);
        lastCenter.current = getCenter(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDistance.current) {
        e.preventDefault();
        const distance = getDistance(e.touches);
        const newScale = Math.max(1, Math.min(4, scale * (distance / lastDistance.current)));
        setScale(newScale);
        lastDistance.current = distance;

        if (lastCenter.current) {
          const center = getCenter(e.touches);
          setPosition({
            x: position.x + (center.x - lastCenter.current.x),
            y: position.y + (center.y - lastCenter.current.y),
          });
          lastCenter.current = center;
        }
      }
    };

    const handleTouchEnd = () => {
      lastDistance.current = null;
      lastCenter.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale, position]);

  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return { scale, position, reset };
};
