import React from 'react';

interface VideoPlayerProps {
  url: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  const cleanUrl = String(url || '').trim().replace(/\s+/g, '');
  if (!cleanUrl) return null;

  let embedUrl = '';
  let isDirectFile = false;

  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let vidId = '';
    if (cleanUrl.includes('v=')) vidId = cleanUrl.split('v=')[1].split('&')[0];
    else if (cleanUrl.includes('youtu.be/')) vidId = cleanUrl.split('youtu.be/')[1].split('?')[0];
    else if (cleanUrl.includes('embed/')) vidId = cleanUrl.split('embed/')[1].split('?')[0];
    if (vidId) embedUrl = `https://www.youtube.com/embed/${vidId}`;
  } else if (cleanUrl.includes('vimeo.com')) {
    const vidId = cleanUrl.match(/vimeo\.com\/(\d+)/)?.[1];
    if (vidId) embedUrl = `https://player.vimeo.com/video/${vidId}`;
  } else if (cleanUrl.includes('drive.google.com')) {
    const fileId = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/)?.[1];
    if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  } else {
    isDirectFile = true;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-3 border-b border-primary-100 pb-1">
        Видео-презентация
      </h3>
      <div className="relative w-full overflow-hidden rounded-xl shadow-md bg-black aspect-video">
        {isDirectFile ? (
          <video controls src={cleanUrl} className="w-full h-full object-contain" />
        ) : embedUrl ? (
          <iframe 
            src={embedUrl} 
            className="absolute top-0 left-0 w-full h-full border-0"
            allowFullScreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : null}
      </div>
    </div>
  );
};

export default VideoPlayer;