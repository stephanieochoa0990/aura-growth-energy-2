import React from "react";

interface VideoBlockProps {
  url: string;
  title?: string;
}

const isYouTubeOrVimeo = (url: string) =>
  /youtube\.com|youtu\.be|vimeo\.com/i.test(url);

const VideoBlock: React.FC<VideoBlockProps> = ({ url, title }) => {
  if (!url) return null;

  if (isYouTubeOrVimeo(url)) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full"
          allowFullScreen
          title={title || "Lesson video"}
        />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video src={url} controls className="w-full h-full" />
    </div>
  );
};

export default VideoBlock;
