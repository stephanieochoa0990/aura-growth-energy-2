import { useRef } from 'react';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { X, ZoomIn } from 'lucide-react';
import { Button } from './ui/button';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ZoomableImage = ({ src, alt, className = '' }: ZoomableImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale, position, reset } = usePinchZoom(containerRef);

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className={`overflow-hidden touch-none ${className}`}
        style={{ touchAction: 'none' }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center',
          }}
        />
      </div>
      {scale > 1 && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={reset}
        >
          <X className="w-4 h-4 mr-1" />
          Reset
        </Button>
      )}
      {scale === 1 && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <ZoomIn className="w-3 h-3" />
          Pinch to zoom
        </div>
      )}
    </div>
  );
};
