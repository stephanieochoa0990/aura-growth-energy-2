import React from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewModeToggleProps {
  mode: 'desktop' | 'tablet' | 'mobile';
  onModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

const PreviewModeToggle: React.FC<PreviewModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <Button
        variant={mode === 'desktop' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('desktop')}
        className={cn('gap-2', mode === 'desktop' && 'bg-white dark:bg-gray-700')}
      >
        <Monitor className="h-4 w-4" />
        Desktop
      </Button>
      <Button
        variant={mode === 'tablet' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('tablet')}
        className={cn('gap-2', mode === 'tablet' && 'bg-white dark:bg-gray-700')}
      >
        <Tablet className="h-4 w-4" />
        Tablet
      </Button>
      <Button
        variant={mode === 'mobile' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('mobile')}
        className={cn('gap-2', mode === 'mobile' && 'bg-white dark:bg-gray-700')}
      >
        <Smartphone className="h-4 w-4" />
        Mobile
      </Button>
    </div>
  );
};

export default PreviewModeToggle;
