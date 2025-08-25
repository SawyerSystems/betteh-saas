import React from 'react';
import { Calendar, Play } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoStackProps {
  coverVideo: {
    id: number;
    url?: string | null;
    title?: string | null;
  };
  count: number;
  dateLabel: string;
  onClick: () => void;
  isDirectVideoUrl: (url?: string | null) => boolean;
}

/**
 * Video stack component with overlapping cards effect and badges.
 * Designed to be mobile-first with ≥44px tap targets.
 */
export function VideoStack({ coverVideo, count, dateLabel, onClick, isDirectVideoUrl }: VideoStackProps) {
  const direct = isDirectVideoUrl(coverVideo.url);
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group w-full text-left min-h-[44px]"
      aria-label={`${dateLabel}, ${count} video${count !== 1 ? 's' : ''}`}
    >
      {/* Stack effect with offset layers */}
      <div className="relative">
        {/* Background layers for stack effect - only show if more than 1 video */}
        {count > 1 && (
          <>
            <div className="absolute inset-0 bg-slate-200/60 dark:bg-slate-700/60 rounded-md transform translate-x-1 translate-y-1 -z-10" />
            <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-600/80 rounded-md transform translate-x-0.5 translate-y-0.5 -z-5" />
          </>
        )}
        
        {/* Main cover video */}
        <AspectRatio ratio={16/9} className="overflow-hidden rounded-md shadow-sm">
          <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
            {direct ? (
              <>
                <video
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                  src={coverVideo.url || undefined}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget as HTMLVideoElement;
                    try {
                      vid.currentTime = 0;
                      vid.pause();
                    } catch {}
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-[#0F0276]/90 p-3 shadow-md group-hover:scale-110 group-hover:bg-[#0F0276] transition-transform">
                    <Play className="h-4 w-4 text-white" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              // Fallback for non-direct URLs
              <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                <Play className="h-8 w-8 text-slate-500 dark:text-slate-400" />
              </div>
            )}
            
            {/* Count badge - top right */}
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-medium">
              {count} video{count !== 1 ? 's' : ''}
            </div>
            
            {/* Date badge - bottom left */}
            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateLabel}
            </div>
          </div>
        </AspectRatio>
      </div>
    </button>
  );
}
