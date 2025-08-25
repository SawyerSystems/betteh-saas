import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Calendar, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoItem } from '@/utils/videoGrouping';

interface DayVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  dateLabel: string;
  videos: VideoItem[];
  isDirectVideoUrl: (url?: string | null) => boolean;
  onVideoClick: (url: string, title?: string) => void;
}

/**
 * Modal that shows videos for a specific day, with navigation between videos.
 * Title format: "{SkillName} — {DateLabel}"
 */
export function DayVideoModal({
  isOpen,
  onClose,
  skillName,
  dateLabel,
  videos,
  isDirectVideoUrl,
  onVideoClick
}: DayVideoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < videos.length - 1;
  
  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  // Reset to first video when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);
  
  if (!videos.length) {
    return null;
  }
  
  const currentVideo = videos[currentIndex];
  const direct = isDirectVideoUrl(currentVideo?.url);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-[#0F0276] dark:text-white">
            {skillName} — {dateLabel}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden space-y-4">
          {/* Main video display */}
          <div className="space-y-3">
            {direct ? (
              <button
                type="button"
                onClick={() => currentVideo.url && onVideoClick(currentVideo.url, currentVideo.title || undefined)}
                className="w-full text-left group"
              >
                <AspectRatio ratio={16/9} className="overflow-hidden rounded-lg shadow-lg">
                  <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      src={currentVideo.url || undefined}
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
                      <div className="rounded-full bg-[#0F0276]/90 p-4 shadow-lg group-hover:scale-110 group-hover:bg-[#0F0276] transition-transform">
                        <Play className="h-6 w-6 text-white" fill="white" />
                      </div>
                    </div>
                  </div>
                </AspectRatio>
              </button>
            ) : (
              <div className="p-6 border border-slate-200/60 dark:border-white/20 rounded-lg bg-white/50 dark:bg-white/5 text-center">
                <a 
                  className="text-[#0F0276] hover:text-[#0F0276]/80 dark:text-white dark:hover:text-white/80 font-medium text-lg flex items-center justify-center gap-2" 
                  href={currentVideo.url || undefined} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Play className="h-5 w-5" />
                  {currentVideo.title || 'Open Video'}
                </a>
              </div>
            )}
            
            {/* Video info */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-[#0F0276] dark:text-white">
                {currentVideo.title || 'Untitled Video'}
              </h3>
              {currentVideo.recordedAt && (
                <div className="flex items-center text-sm text-[#0F0276]/70 dark:text-white/70">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(currentVideo.recordedAt as any).toLocaleDateString()} at{' '}
                  {new Date(currentVideo.recordedAt as any).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation controls */}
          {videos.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="text-sm text-[#0F0276]/70 dark:text-white/70">
                {currentIndex + 1} of {videos.length}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Video thumbnails for navigation */}
          {videos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {videos.map((video, index) => {
                const videoIsDirect = isDirectVideoUrl(video.url);
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`min-w-[80px] max-w-[80px] ${
                      index === currentIndex
                        ? 'ring-2 ring-[#0F0276] dark:ring-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <AspectRatio ratio={16/9} className="overflow-hidden rounded">
                      {videoIsDirect ? (
                        <video
                          className="w-full h-full object-cover"
                          src={video.url || undefined}
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Play className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                    </AspectRatio>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
