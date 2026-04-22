import React, { useEffect, useState } from "react";
import { createSignedMediaUrl } from "@/lib/media";

interface VideoBlockProps {
  url: string;
  title?: string;
}

const VideoBlock: React.FC<VideoBlockProps> = ({ url, title }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSignedUrl() {
      setLoading(true);
      const nextUrl = await createSignedMediaUrl(url);
      if (!cancelled) {
        setSignedUrl(nextUrl);
        setLoading(false);
      }
    }

    loadSignedUrl();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return null;

  if (loading) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center text-white/70">
        Loading private video...
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center p-4 text-center text-white/70">
        This video is not available as private course media yet.
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video src={signedUrl} controls className="w-full h-full" title={title || "Lesson video"} />
    </div>
  );
};

export default VideoBlock;
