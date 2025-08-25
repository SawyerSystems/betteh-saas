import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Calendar, Play, X } from 'lucide-react';
import type { VideoGroup } from '@/utils/videoGrouping';

interface VideoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  groups: VideoGroup[];
  isDirectVideoUrl: (url?: string | null) => boolean;
  onVideoClick: (url: string, title?: string) => void;
}

/**
 * Modal that shows all videos for a skill, grouped by day.
 * Each day is a section with a header and thumbnails.
 */
export function VideoGalleryModal({
  isOpen,
  onClose,
  skillName,
  groups,
  isDirectVideoUrl,
  onVideoClick
}: VideoGalleryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-[#0F0276] dark:text-white">
            {skillName} — All Videos
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {groups.map((group) => (
            <div key={group.dayKey} className="space-y-3">
              {/* Day header */}
              <div className="sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm py-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-[#0F0276] dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#D8BD2A]" />
                  {group.dateLabel} • {group.videos.length} video{group.videos.length !== 1 ? 's' : ''}
                </h3>
              </div>
              
              {/* Videos grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.videos.map((video) => {
                  const direct = isDirectVideoUrl(video.url);
                  return (
                    <div key={video.id} className="group">
                      {direct ? (
                        <button
                          type="button"
                          onClick={() => video.url && onVideoClick(video.url, video.title || undefined)}
                          className="w-full text-left"
                        >
                          <AspectRatio ratio={16/9} className="overflow-hidden rounded-md shadow-sm">
                            <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                              <video
                                className="absolute inset-0 h-full w-full object-cover opacity-90"
                                src={video.url || undefined}
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
                            </div>
                          </AspectRatio>
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium truncate text-[#0F0276] dark:text-white" title={video.title || video.url || ''}>
                              {video.title || 'Untitled Video'}
                            </div>
                            {video.recordedAt && (
                              <div className="flex items-center text-[10px] text-[#0F0276]/70 dark:text-white/70">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(video.recordedAt as any).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="p-3 border border-slate-200/60 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/5">
                          <a 
                            className="text-[#0F0276] hover:text-[#0F0276]/80 dark:text-white dark:hover:text-white/80 font-medium text-sm flex items-center gap-1" 
                            href={video.url || undefined} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <Play className="h-3 w-3" />
                            {video.title || video.url}
                          </a>
                          {video.recordedAt && (
                            <div className="flex items-center text-[10px] text-[#0F0276]/70 dark:text-white/70 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(video.recordedAt as any).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {groups.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Play className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">No videos recorded yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
