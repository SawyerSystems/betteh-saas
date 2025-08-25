import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAddAthleteSkillVideo, useAthleteSkillVideos, useUpsertAthleteSkill, useUploadMedia, useDeleteAthleteSkillVideo } from "@/hooks/useAthleteProgress";
import type { InsertAthleteSkill, Skill } from "@shared/schema";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, FileVideo, Link, Upload, Video, Trash2, Target } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athleteId: number;
  skill: Skill;
  existing?: { athleteSkillId?: number; status?: string | null; notes?: string | null };
}

export function TestSkillDialog({ open, onOpenChange, athleteId, skill, existing }: Props) {
  const [status, setStatus] = useState((existing?.status?.toLowerCase?.() === 'working' ? 'prepping' : existing?.status) || "prepping");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [recordedAt, setRecordedAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const upsert = useUpsertAthleteSkill();
  const addVideo = useAddAthleteSkillVideo();
  const uploadMedia = useUploadMedia();
  const delVideo = useDeleteAthleteSkillVideo();

  // Only fetch videos if we know an athleteSkillId
  const athleteSkillId = existing?.athleteSkillId;
  const { data: videos = [] } = useAthleteSkillVideos(athleteSkillId);

  const handleSave = async () => {
    const payload: InsertAthleteSkill = {
      athleteId,
      skillId: skill.id,
      status,
      notes,
      lastTestedAt: new Date().toISOString() as any,
      firstTestedAt: existing?.athleteSkillId ? undefined : (new Date().toISOString() as any),
    } as any;
    const saved = await upsert.mutateAsync(payload);

    // Handle optional video attachment: file upload takes precedence, then URL
    // Batch upload selected files first (if any)
    if (videoFiles.length > 0) {
      for (const file of videoFiles) {
        const url = await uploadMedia.mutateAsync({ file, context: 'athlete-skill' });
        await addVideo.mutateAsync({
          athleteSkillId: saved.id,
          url,
          title: videoTitle || null,
          recordedAt: recordedAt ? new Date(recordedAt).toISOString() : new Date().toISOString(),
        });
      }
      setVideoFiles([]);
      setVideoTitle("");
      setVideoUrl("");
    } else {
      let finalUrl = videoUrl.trim();
      if (finalUrl) {
        await addVideo.mutateAsync({
          athleteSkillId: saved.id,
          url: finalUrl,
          title: videoTitle || null,
          recordedAt: recordedAt ? new Date(recordedAt).toISOString() : new Date().toISOString(),
        });
        setVideoUrl("");
        setVideoTitle("");
      }
    }

    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      // Focus notes when dialog opens
      requestAnimationFrame(() => notesRef.current?.focus());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-slate-200/60 dark:border-white/20 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#0F0276] dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#D8BD2A]" />
            Test Skill: {skill.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6 pb-4">
            {/* Skill Info Card */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#0F0276] dark:text-white">Skill Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {skill.category && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {skill.category}
                    </Badge>
                  )}
                  {skill.level && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      Level {skill.level}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Selection */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#0F0276] dark:text-white">Assessment Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "learning", label: "Learning", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
                    { key: "prepping", label: "Prepping", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
                    { key: "consistent", label: "Consistent", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
                    { key: "mastered", label: "Mastered", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
                  ].map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      variant={status === opt.key ? "default" : "outline"}
                      className={status === opt.key ? "bg-[#0F0276] hover:bg-[#0F0276]/90 text-white" : "border-slate-200/60 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10"}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        notesRef.current?.focus();
                      }}
                      onClick={() => {
                        setStatus(opt.key);
                        requestAnimationFrame(() => notesRef.current?.focus());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          (e.currentTarget as HTMLButtonElement).blur();
                          requestAnimationFrame(() => notesRef.current?.focus());
                        }
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#0F0276] dark:text-white">Coach Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  ref={notesRef}
                  autoFocus
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations, next steps, drills to work on..."
                  className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40 min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Video Upload */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#0F0276] dark:text-white flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#D8BD2A]" />
                  Link Progress Video (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="text-[#0F0276] dark:text-white font-medium">Video URL</Label>
                    <Input 
                      id="videoUrl" 
                      value={videoUrl} 
                      onChange={(e) => setVideoUrl(e.target.value)} 
                      placeholder="https://..."
                      className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoTitle" className="text-[#0F0276] dark:text-white font-medium">Video Title</Label>
                    <Input 
                      id="videoTitle" 
                      value={videoTitle} 
                      onChange={(e) => setVideoTitle(e.target.value)} 
                      placeholder="e.g. First consistent reps"
                      className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoFile" className="text-[#0F0276] dark:text-white font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Or Upload Video File(s)
                    </Label>
                    <Input 
                      id="videoFile" 
                      type="file" 
                      accept="video/*" 
                      multiple
                      onChange={(e) => setVideoFiles(e.target.files ? Array.from(e.target.files) : [])}
                      className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                    />
                    {!!videoFiles.length && (
                      <div className="text-xs text-[#0F0276]/70 dark:text-white/70 mt-1">
                        Selected: {videoFiles.length} file{videoFiles.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordedAt" className="text-[#0F0276] dark:text-white font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recorded Date
                    </Label>
                    <Input 
                      id="recordedAt" 
                      type="date" 
                      value={recordedAt} 
                      onChange={(e) => setRecordedAt(e.target.value)}
                      className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Videos */}
            {!!videos.length && (
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[#0F0276] dark:text-white flex items-center gap-2">
                    <FileVideo className="h-4 w-4 text-[#D8BD2A]" />
                    Previous Video Clips ({videos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {videos.map((video) => (
                      <div key={video.id} className="p-3 rounded-lg border border-slate-200/60 dark:border-white/20 bg-white/50 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#0F0276] dark:text-white text-sm">
                              {video.title || "Untitled Clip"}
                            </div>
                            {video.recordedAt && (
                              <div className="text-xs text-[#0F0276]/70 dark:text-white/70 mt-1">
                                {new Date(video.recordedAt as any).toLocaleDateString()}
                              </div>
                            )}
                            <a 
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all mt-1 inline-block" 
                              href={video.url ?? undefined} 
                              target="_blank" 
                              rel="noreferrer"
                            >
                              {video.url}
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => delVideo.mutate({ id: video.id, athleteSkillId: video.athleteSkillId ?? undefined })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-white/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-slate-200/60 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={upsert.isPending || addVideo.isPending || uploadMedia.isPending}
            className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white"
          >
            {upsert.isPending || addVideo.isPending || uploadMedia.isPending ? "Saving..." : "Save Assessment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
