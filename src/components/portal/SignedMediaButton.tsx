import { ReactNode, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { createSignedMediaUrl, COURSE_MEDIA_BUCKET } from '@/lib/media';
import { useToast } from '@/hooks/use-toast';

interface SignedMediaButtonProps extends Omit<ButtonProps, 'onClick'> {
  mediaPath: string | null | undefined;
  bucket?: string;
  children: ReactNode;
}

export default function SignedMediaButton({
  mediaPath,
  bucket = COURSE_MEDIA_BUCKET,
  children,
  disabled,
  ...buttonProps
}: SignedMediaButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const openMedia = async () => {
    try {
      setLoading(true);
      const signedUrl = await createSignedMediaUrl(mediaPath, { bucket });

      if (!signedUrl) {
        toast({
          title: 'Media unavailable',
          description: 'This file must be stored as a private storage path before it can be opened.',
          variant: 'destructive',
        });
        return;
      }

      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading || !mediaPath}
      onClick={openMedia}
    >
      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {children}
    </Button>
  );
}

