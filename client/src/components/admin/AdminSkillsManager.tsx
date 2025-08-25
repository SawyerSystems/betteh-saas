import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin-ui/AdminCard";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useApparatusList, useCreateSkill, useDeleteSkill, useSkills, useUpdateSkill, useSkillRelations, useSaveSkillRelations, type Skill, type VideoReference } from "@/hooks/useSkills";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Play, Download } from "lucide-react";

const LEVELS = ["beginner", "intermediate", "advanced", "elite"] as const;

type Filters = { apparatusId?: number; level?: string };

export default function AdminSkillsManager() {
  const [, setLocation] = useLocation();
  const { data: auth } = useQuery<{ loggedIn: boolean }>({
    queryKey: ["/api/auth/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 30_000,
  });

  const [filters, setFilters] = useState<Filters>({});
  const { data: apparatus = [], isLoading: isAppLoading } = useApparatusList();
  const { data: skills = [], isLoading, error } = useSkills(filters);
  const [sortWithin, setSortWithin] = useState<'display' | 'name'>('display');
  const [dragging, setDragging] = useState<{ groupId: number; levelId: string; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ groupId: number; levelId: string; index: number } | null>(null);

  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const qc = useQueryClient();

  // Simple form state object - much cleaner than separate variables
  const [draft, setDraft] = useState({
    name: "",
    category: "",
    description: "",
    displayOrder: "",
    level: "beginner" as const,
    apparatusId: undefined as number | undefined,
    isConnectedCombo: false,
    prerequisiteIds: [] as number[],
    componentIds: [] as number[],
    referenceVideos: [] as VideoReference[],
  });

  // Refs to maintain focus through re-renders
  const focusedInputRef = useRef<HTMLInputElement | null>(null);
  const maintainFocus = useRef<boolean>(false);

  const [selectedSkillId, setSelectedSkillId] = useState<number | undefined>(undefined);

  // Video form state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [videoUploadMode, setVideoUploadMode] = useState<'url' | 'upload'>('url');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  // Video modal state
  const [openVideo, setOpenVideo] = useState<{ url: string; title?: string } | null>(null);

  // Video utility function
  const isDirectVideoUrl = useCallback((url?: string | null) => {
    if (!url) return false;
    
    console.log('Checking video URL:', url);
    
    // Check if it's a placeholder filename (contains file size info)
    const isPlaceholder = /\.(mp4|webm|m4v|mov|ogg|ogv|avi|mkv|3gp|flv)\s*\([^)]+MB\)/i.test(url);
    if (isPlaceholder) {
      console.log('Detected placeholder filename:', url);
      return false; // Treat placeholders as external (non-playable)
    }
    
    // Check for Supabase storage URLs (direct video files)
    if (url.includes('supabase.co/storage/') && /\.(mp4|webm|m4v|mov|ogg|ogv|avi|mkv|3gp|flv)(\?|$)/i.test(url)) {
      console.log('Detected Supabase storage video URL:', url);
      return true;
    }
    
    // Check for direct video file extensions
    const videoExtensions = /\.(mp4|webm|m4v|mov|ogg|ogv|avi|mkv|3gp|flv)($|\s|\?)/i;
    
    try {
      const u = new URL(url);
      const path = u.pathname.toLowerCase();
      const isDirect = videoExtensions.test(path);
      console.log('URL parsed, path:', path, 'isDirect:', isDirect);
      return isDirect;
    } catch {
      // If URL parsing fails, check the string directly (could be just a filename)
      const isDirect = videoExtensions.test(url.toLowerCase());
      console.log('URL parsing failed, checking string directly:', url, 'isDirect:', isDirect);
      return isDirect;
    }
  }, []);

  // Simple focus management helpers
  const handleInputFocus = (input: HTMLInputElement) => {
    maintainFocus.current = true;
    focusedInputRef.current = input;
  };

  const handleInputBlur = () => {
    maintainFocus.current = false;
    focusedInputRef.current = null;
  };

  // Restore focus after re-renders if needed
  React.useEffect(() => {
    if (maintainFocus.current && focusedInputRef.current) {
      focusedInputRef.current.focus();
    }
  });

  // Simple form update helper
  const updateDraft = (updates: Partial<typeof draft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [editDraft, setEditDraft] = useState<Partial<Skill>>({});
  const { data: relations } = useSkillRelations(selectedSkillId);
  const saveRelations = useSaveSkillRelations();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const prerequisiteScrollRef = useRef<HTMLDivElement>(null);

  // Force clear dragging state when in edit mode
  useEffect(() => {
    if (selectedSkillId) {
      setDragging(null);
      setDragOver(null);
    }
  }, [selectedSkillId]);

  // Get unique categories from existing skills
  const uniqueCategories = useMemo(() => {
    const categories = skills
      .map(skill => skill.category)
      .filter((category): category is string => Boolean(category))
      .filter((category, index, arr) => arr.indexOf(category) === index)
      .sort();
    return categories;
  }, [skills]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Uploading file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
      
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      if (!data.url) {
        throw new Error('No URL returned from upload');
      }
      
      return data.url;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload video file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle adding new video
  const handleAddVideo = async () => {
    if (!newVideoTitle) return;
    if (videoUploadMode === 'url' && !newVideoUrl) return;
    if (videoUploadMode === 'upload' && !selectedVideoFile) return;

    try {
      let videoUrl = newVideoUrl;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      if (videoUploadMode === 'upload' && selectedVideoFile) {
        videoUrl = await handleFileUpload(selectedVideoFile);
        fileSize = selectedVideoFile.size;
        mimeType = selectedVideoFile.type;
      }
      
      const newVideo: VideoReference = {
        id: `temp-${Date.now()}`,
        type: videoUploadMode,
        url: videoUrl,
        title: newVideoTitle,
        description: newVideoDescription || undefined,
        uploadedAt: new Date().toISOString(),
        fileSize,
        mimeType,
      };

      updateDraft({ 
        referenceVideos: [...draft.referenceVideos, newVideo] 
      });

      // Clear form
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoDescription('');
      setSelectedVideoFile(null);
    } catch (error) {
      console.error('Failed to add video:', error);
      // You might want to show a toast notification here
    }
  };

  const onCreate = async () => {
    if (!draft.name) return;
    const skillData = {
      name: draft.name,
      category: draft.category || undefined,
      description: draft.description || undefined,
      level: draft.level,
      apparatusId: draft.apparatusId,
      displayOrder: draft.displayOrder === "" ? undefined : Number(draft.displayOrder),
      isConnectedCombo: draft.isConnectedCombo,
      prerequisiteIds: draft.prerequisiteIds,
      componentIds: draft.componentIds,
      referenceVideos: draft.referenceVideos
    };
    await createSkill.mutateAsync(skillData);
    handleClearForm();
  };

  // Clear form helper
  const handleClearForm = () => {
    setDraft({
      name: "",
      category: "",
      description: "",
      displayOrder: "",
      level: "beginner" as const,
      apparatusId: undefined,
      isConnectedCombo: false,
      prerequisiteIds: [],
      componentIds: [],
      referenceVideos: [],
    });
    // Clear video form fields too
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoDescription('');
    setSelectedVideoFile(null);
    setVideoUploadMode('url');
  };

  // Simple form component - no complex memoization needed
  const renderCreateForm = () => (
    <div className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md p-4 shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Name</Label>
          <Input
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            onFocus={(e) => handleInputFocus(e.target)}
            onBlur={handleInputBlur}
            className="focus:border-[#0F0276] focus:ring-[#0F0276]"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Apparatus</Label>
          <Select
            value={draft.apparatusId ? String(draft.apparatusId) : ""}
            onValueChange={(value) => {
              const newApparatusId = value ? Number(value) : undefined;
              // If apparatus changes, clear prerequisites and components that don't belong to the new apparatus
              if (newApparatusId !== draft.apparatusId) {
                const filteredSkills = skills.filter(s => s.apparatusId === newApparatusId);
                const validSkillIds = new Set(filteredSkills.map(s => s.id));
                const filteredPrerequisiteIds = draft.prerequisiteIds.filter(id => validSkillIds.has(id));
                const filteredComponentIds = draft.componentIds.filter(id => validSkillIds.has(id));
                
                updateDraft({ 
                  apparatusId: newApparatusId,
                  prerequisiteIds: filteredPrerequisiteIds,
                  componentIds: filteredComponentIds
                });
              } else {
                updateDraft({ apparatusId: newApparatusId });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select apparatus" />
            </SelectTrigger>
            <SelectContent>
              {apparatus.map(a => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Level</Label>
          <Select
            value={draft.level}
            onValueChange={(value) => updateDraft({ level: value as typeof draft.level })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Category</Label>
          <Input
            value={draft.category}
            onChange={(e) => updateDraft({ category: e.target.value })}
            onFocus={(e) => handleInputFocus(e.target)}
            onBlur={handleInputBlur}
            placeholder="Select or type category"
            list="categories-list"
            className="focus:border-[#0F0276] focus:ring-[#0F0276]"
          />
          <datalist id="categories-list">
            {uniqueCategories.map(category => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Description</Label>
          <Input
            value={draft.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            onFocus={(e) => handleInputFocus(e.target)}
            onBlur={handleInputBlur}
            className="focus:border-[#0F0276] focus:ring-[#0F0276]"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Display Order</Label>
          <Input
            type="number"
            value={draft.displayOrder}
            onChange={(e) => updateDraft({ displayOrder: e.target.value })}
            onFocus={(e) => handleInputFocus(e.target)}
            onBlur={handleInputBlur}
            placeholder="e.g. 10, 20, 30..."
            className="focus:border-[#0F0276] focus:ring-[#0F0276]"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-[#0F0276] dark:text-white font-medium">Connected Combo</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="connected-combo"
              checked={draft.isConnectedCombo}
              onCheckedChange={(checked) => updateDraft({ isConnectedCombo: !!checked })}
            />
            <Label htmlFor="connected-combo" className="text-sm text-slate-600 dark:text-white/80">
              This skill is part of a connected combination
            </Label>
          </div>
        </div>
        
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-[#0F0276] dark:text-white font-medium">Prerequisites (optional)</Label>
            <div className="border border-slate-200/60 rounded-lg p-3 max-h-40 overflow-auto space-y-2 bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30">
              {draft.apparatusId ? (() => {
                // Apply the same sorting logic as the main skill list
                const levelOrder = ['beginner', 'intermediate', 'advanced', 'elite'];
                const apparatusSkills = skills.filter(s => s.apparatusId === draft.apparatusId);
                
                // Group by level
                const byLevel: Record<string, Skill[]> = {};
                apparatusSkills.forEach(s => {
                  const level = s.level || 'beginner';
                  byLevel[level] = byLevel[level] || [];
                  byLevel[level].push(s);
                });
                
                // Sort within each level using the same logic as main list
                const makeSorted = (arr: Skill[]) => {
                  if (sortWithin === 'name') return [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                  // default: by displayOrder then name
                  return [...arr].sort((a, b) => {
                    const ao = a.displayOrder ?? 1_000_000;
                    const bo = b.displayOrder ?? 1_000_000;
                    if (ao !== bo) return ao - bo;
                    return (a.name || '').localeCompare(b.name || '');
                  });
                };
                
                // Create sorted flat array following level order
                const sortedSkills: Skill[] = [];
                levelOrder.forEach(level => {
                  if (byLevel[level]) {
                    sortedSkills.push(...makeSorted(byLevel[level]));
                  }
                });
                
                // Add any skills with non-standard levels at the end
                Object.keys(byLevel).forEach(level => {
                  if (!levelOrder.includes(level)) {
                    sortedSkills.push(...makeSorted(byLevel[level]));
                  }
                });
                
                return sortedSkills.map(s => (
                  <label key={s.id} className="flex items-center gap-3 text-sm p-2 rounded-md hover:bg-white/50 dark:hover:bg-[#0F0276]/50 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={draft.prerequisiteIds.includes(s.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...draft.prerequisiteIds, s.id]
                          : draft.prerequisiteIds.filter(id => id !== s.id);
                        updateDraft({ prerequisiteIds: newIds });
                      }}
                      className="rounded border-slate-300 text-[#0F0276] focus:ring-[#0F0276] focus:ring-offset-0"
                    />
                    <span className="text-slate-700 dark:text-white">{s.name || `Skill #${s.id}`}</span>
                  </label>
                ));
              })() : (
                <div className="text-center py-4 text-slate-500 dark:text-white/60 text-sm">
                  Select an apparatus first to see available prerequisites
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-[#0F0276] dark:text-white font-medium">Connected Components (optional)</Label>
            <div className="space-y-3">
              {draft.componentIds.map((id, idx) => (
                <div key={`${id}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm border border-slate-200/40 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30">
                  <span className="text-xs w-6 h-6 flex items-center justify-center rounded-full bg-[#D8BD2A]/20 text-[#0F0276] dark:text-white font-medium">{idx + 1}</span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-white">{skills.find(sk => sk.id === id)?.name || `Skill #${id}`}</span>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const newIds = [...draft.componentIds];
                        if (idx > 0) {
                          [newIds[idx], newIds[idx - 1]] = [newIds[idx - 1], newIds[idx]];
                          updateDraft({ componentIds: newIds });
                        }
                      }} 
                      className="h-7 w-7 p-0 border-slate-300 dark:border-[#2A4A9B]/40 hover:bg-white/50 dark:hover:bg-[#0F0276]/50"
                    >
                      ↑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const newIds = [...draft.componentIds];
                        if (idx < newIds.length - 1) {
                          [newIds[idx], newIds[idx + 1]] = [newIds[idx + 1], newIds[idx]];
                          updateDraft({ componentIds: newIds });
                        }
                      }} 
                      className="h-7 w-7 p-0 border-slate-300 dark:border-[#2A4A9B]/40 hover:bg-white/50 dark:hover:bg-[#0F0276]/50"
                    >
                      ↓
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => {
                        const newIds = draft.componentIds.filter((_, i) => i !== idx);
                        updateDraft({ componentIds: newIds });
                      }} 
                      className="h-7 w-7 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              {draft.apparatusId ? (
                <Select onValueChange={(value) => {
                  const id = Number(value);
                  if (!draft.componentIds.includes(id)) {
                    updateDraft({ componentIds: [...draft.componentIds, id] });
                  }
                }}>
                  <SelectTrigger className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50 hover:bg-white/90 dark:hover:bg-[#0F0276]/70 transition-colors duration-200">
                    <SelectValue placeholder="Add component skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Apply the same sorting logic as the main skill list for consistency
                      const levelOrder = ['beginner', 'intermediate', 'advanced', 'elite'];
                      const availableSkills = skills.filter(sk => sk.apparatusId === draft.apparatusId && !draft.componentIds.includes(sk.id));
                      
                      // Group by level
                      const byLevel: Record<string, Skill[]> = {};
                      availableSkills.forEach(s => {
                        const level = s.level || 'beginner';
                        byLevel[level] = byLevel[level] || [];
                        byLevel[level].push(s);
                      });
                      
                      // Sort within each level using the same logic as main list
                      const makeSorted = (arr: Skill[]) => {
                        if (sortWithin === 'name') return [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                        // default: by displayOrder then name
                        return [...arr].sort((a, b) => {
                          const ao = a.displayOrder ?? 1_000_000;
                          const bo = b.displayOrder ?? 1_000_000;
                          if (ao !== bo) return ao - bo;
                          return (a.name || '').localeCompare(b.name || '');
                        });
                      };
                      
                      // Create sorted flat array following level order
                      const sortedSkills: Skill[] = [];
                      levelOrder.forEach(level => {
                        if (byLevel[level]) {
                          sortedSkills.push(...makeSorted(byLevel[level]));
                        }
                      });
                      
                      // Add any skills with non-standard levels at the end
                      Object.keys(byLevel).forEach(level => {
                        if (!levelOrder.includes(level)) {
                          sortedSkills.push(...makeSorted(byLevel[level]));
                        }
                      });
                      
                      return sortedSkills.map(sk => (
                        <SelectItem key={sk.id} value={String(sk.id)}>{sk.name || `Skill #${sk.id}`}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-3 text-slate-500 dark:text-white/60 text-sm border border-dashed border-slate-300 dark:border-[#2A4A9B]/40 rounded-lg">
                  Select an apparatus first to add component skills
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reference Videos Section */}
        <div className="md:col-span-2 space-y-3">
          <Label className="text-[#0F0276] dark:text-white font-medium">Reference Videos (optional)</Label>
          <div className="border border-slate-200/60 rounded-lg p-3 bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30">
            {/* Existing Videos */}
            {draft.referenceVideos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                {draft.referenceVideos.map((video, index) => {
                  const direct = isDirectVideoUrl(video.url);
                  return (
                    <div key={index} className="relative group bg-white/50 dark:bg-[#0F0276]/50 rounded-lg border border-slate-200/60 dark:border-[#2A4A9B]/40 overflow-hidden">
                      {direct ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Video clicked:', video.url, video.title);
                            if (video.url) {
                              setOpenVideo({ url: video.url, title: video.title || undefined });
                            }
                          }}
                          className="w-full text-left"
                        >
                          <AspectRatio ratio={16/9} className="overflow-hidden">
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
                                  } catch (err) {
                                    console.log('Video metadata load error:', err);
                                  }
                                }}
                                onError={(e) => {
                                  console.log('Video load error:', e.currentTarget.src);
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
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('External video clicked:', video.url, video.title);
                            if (video.url) {
                              setOpenVideo({ url: video.url, title: video.title || undefined });
                            }
                          }}
                          className="w-full aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                              🎥
                            </div>
                            <div className="text-xs text-slate-600 dark:text-white/70">External Video</div>
                          </div>
                        </button>
                      )}
                      
                      {/* Video Info */}
                      <div className="p-3">
                        <div className="font-medium text-sm text-[#0F0276] dark:text-white mb-1 line-clamp-2">{video.title}</div>
                        {video.description && (
                          <div className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 mb-2">{video.description}</div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-600 dark:text-white/70">
                            {video.type === 'url' ? 'URL' : 'Upload'}
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = draft.referenceVideos.filter((_, i) => i !== index);
                              updateDraft({ referenceVideos: updated });
                            }}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Add New Video */}
            <div className="space-y-3">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={videoUploadMode === 'url' ? 'default' : 'outline'}
                  onClick={() => {
                    setVideoUploadMode('url');
                    setSelectedVideoFile(null);
                  }}
                  className="text-xs"
                >
                  URL Link
                </Button>
                <Button
                  size="sm"
                  variant={videoUploadMode === 'upload' ? 'default' : 'outline'}
                  onClick={() => {
                    setVideoUploadMode('upload');
                    setNewVideoUrl('');
                  }}
                  className="text-xs"
                >
                  Upload File
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Video title"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  className="text-sm"
                />
                {videoUploadMode === 'url' ? (
                  <Input
                    placeholder="Video URL (e.g., YouTube, Vimeo)"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="text-sm"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setSelectedVideoFile(file || null);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0F0276]/50 dark:border-[#2A4A9B]/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0F0276]/70 transition-colors">
                      {selectedVideoFile ? (
                        <span className="text-slate-700 dark:text-white">
                          {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)}MB)
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-white/60">Choose video file...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Input
                placeholder="Description (optional)"
                value={newVideoDescription}
                onChange={(e) => setNewVideoDescription(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddVideo}
                  disabled={!newVideoTitle || (videoUploadMode === 'url' ? !newVideoUrl : !selectedVideoFile)}
                  className="text-sm"
                >
                  Add Video
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewVideoTitle('');
                    setNewVideoUrl('');
                    setNewVideoDescription('');
                    setSelectedVideoFile(null);
                  }}
                  className="text-sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <Button 
          onClick={onCreate} 
          disabled={createSkill.isPending || !draft.name}
          className="bg-gradient-to-r from-[#D8BD2A] to-[#B8A626] hover:from-[#D8BD2A]/90 hover:to-[#B8A626]/90 text-[#0F0276] font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform-gpu hover:scale-[1.02]"
        >
          {createSkill.isPending ? 'Creating...' : 'Add Skill'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClearForm}
          className="border-slate-200/60 bg-white/80 hover:bg-white/90 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30 dark:hover:bg-[#0F0276]/50 backdrop-blur-sm transition-all duration-200"
        >
          Clear
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setIsCreateOpen(false)}
          className="text-[#0F0276]"
        >
          Cancel
        </Button>
      </div>
      <Separator className="my-2" />
    </div>
  );

  const filteredSkills = useMemo(() => skills, [skills]);

  // Define makeSorted at component level so it's accessible everywhere
  const makeSorted = useCallback((arr: Skill[]) => {
    if (sortWithin === 'name') return [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    // default: by displayOrder then name
    return [...arr].sort((a, b) => {
      const ao = a.displayOrder ?? 1_000_000;
      const bo = b.displayOrder ?? 1_000_000;
      if (ao !== bo) return ao - bo;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [sortWithin]);

  const groups = useMemo(() => {
    const byApp: Record<number, Record<string, Skill[]>> = {};
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'elite'];
    
    filteredSkills.forEach(s => {
      const aid = s.apparatusId ?? -1;
      const level = s.level || 'beginner';
      byApp[aid] = byApp[aid] || {};
      byApp[aid][level] = byApp[aid][level] || [];
      byApp[aid][level].push(s);
    });
    
    const sortedApparatus = [...apparatus].sort((a, b) => a.name.localeCompare(b.name));
    const unknownGroupSkills = byApp[-1] || {};
    
    const result: { 
      apparatusId: number; 
      apparatusName: string; 
      levelGroups: { level: string; levelDisplayName: string; items: Skill[] }[] 
    }[] = [];
    
    sortedApparatus.forEach(a => {
      const skillsByLevel = byApp[a.id] || {};
      const levelGroups: { level: string; levelDisplayName: string; items: Skill[] }[] = [];
      
      // Add levels in order, only if they have skills
      levelOrder.forEach(level => {
        if (skillsByLevel[level] && skillsByLevel[level].length > 0) {
          levelGroups.push({
            level,
            levelDisplayName: level.charAt(0).toUpperCase() + level.slice(1),
            items: makeSorted(skillsByLevel[level])
          });
        }
      });
      
      // Add any other levels not in the standard order
      Object.keys(skillsByLevel).forEach(level => {
        if (!levelOrder.includes(level) && skillsByLevel[level].length > 0) {
          levelGroups.push({
            level,
            levelDisplayName: level.charAt(0).toUpperCase() + level.slice(1),
            items: makeSorted(skillsByLevel[level])
          });
        }
      });
      
      if (levelGroups.length > 0) {
        result.push({ 
          apparatusId: a.id, 
          apparatusName: a.name, 
          levelGroups 
        });
      }
    });
    
    // Handle unassigned skills
    if (Object.keys(unknownGroupSkills).length > 0) {
      const levelGroups: { level: string; levelDisplayName: string; items: Skill[] }[] = [];
      
      levelOrder.forEach(level => {
        if (unknownGroupSkills[level] && unknownGroupSkills[level].length > 0) {
          levelGroups.push({
            level,
            levelDisplayName: level.charAt(0).toUpperCase() + level.slice(1),
            items: makeSorted(unknownGroupSkills[level])
          });
        }
      });
      
      Object.keys(unknownGroupSkills).forEach(level => {
        if (!levelOrder.includes(level) && unknownGroupSkills[level].length > 0) {
          levelGroups.push({
            level,
            levelDisplayName: level.charAt(0).toUpperCase() + level.slice(1),
            items: makeSorted(unknownGroupSkills[level])
          });
        }
      });
      
      if (levelGroups.length > 0) {
        result.push({ 
          apparatusId: -1, 
          apparatusName: 'Unassigned', 
          levelGroups 
        });
      }
    }
    
    return result;
  }, [filteredSkills, apparatus, sortWithin, makeSorted]);

  if (!auth?.loggedIn) {
    return (
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Skills</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="space-y-3">
          <div className="text-sm text-slate-600 dark:text-white/80">Admin login required to view and edit skills.</div>
          <Button onClick={() => setLocation("/admin-login")}>Go to Admin Login</Button>
        </AdminCardContent>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Filters</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-[#0F0276] dark:text-white">Apparatus</Label>
            <Select
              value={filters.apparatusId ? String(filters.apparatusId) : ""}
              onValueChange={(v) => setFilters(f => ({ ...f, apparatusId: v === 'all' ? undefined : Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All apparatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {isAppLoading ? (
                  <div className="px-2 py-1 text-sm text-slate-500 dark:text-white/70">Loading…</div>
                ) : apparatus.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#0F0276] dark:text-white">Level</Label>
            <Select
              value={filters.level || ""}
              onValueChange={(v) => setFilters(f => ({ ...f, level: v === 'all' ? undefined : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {LEVELS.map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#0F0276] dark:text-white">Sort within apparatus</Label>
            <Select value={sortWithin} onValueChange={(v) => setSortWithin(v as 'display' | 'name')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="display">Display Order</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Test Video Modal Button */}
      <AdminCard>
        <AdminCardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => {
                console.log('Test video modal clicked');
                setOpenVideo({ 
                  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  title: 'Test Video - Big Buck Bunny'
                });
              }}
              className="bg-[#0F0276] hover:bg-[#0F0276]/90"
            >
              🎥 Test Video Modal
            </Button>
            <Button 
              onClick={() => {
                console.log('Test external video modal clicked');
                setOpenVideo({ 
                  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  title: 'Test External Video - YouTube'
                });
              }}
              variant="outline"
            >
              🔗 Test External Video
            </Button>
            <span className="text-sm text-slate-600 dark:text-white/70">
              Test buttons to verify video modal functionality
            </span>
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader>
          <div className="flex items-center justify-between gap-3">
            <AdminCardTitle>Skills</AdminCardTitle>
            <Button
              onClick={() => setIsCreateOpen(v => !v)}
              className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white dark:bg-[#D8BD2A] dark:hover:bg-[#D8BD2A]/90 dark:text-[#0F0276]"
            >
              {isCreateOpen ? 'Close' : 'New Skill'}
            </Button>
          </div>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="space-y-4">
            {isCreateOpen ? renderCreateForm() : null}
            {isLoading ? (
              <div>Loading…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{(error as any)?.message || "Failed to load skills."}</div>
            ) : (
              <div className="space-y-6">
                {groups.map(group => (
                  <div key={group.apparatusId} className="space-y-4">
                    <button
                      type="button" 
                      className="text-left w-full group flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 bg-gradient-to-r from-white/70 to-white/50 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md hover:from-white/80 hover:to-white/60 shadow-sm hover:shadow-md transition-all duration-300 dark:border-[#2A4A9B]/60 dark:from-[#0F0276]/60 dark:to-[#0F0276]/40 dark:hover:from-[#0F0276]/70 dark:hover:to-[#0F0276]/50"
                      onClick={() => setCollapsedGroups(prev => {
                        const next = new Set(prev);
                        if (next.has(group.apparatusId)) next.delete(group.apparatusId); else next.add(group.apparatusId);
                        return next;
                      })}
                    >
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#0F0276]/10 to-[#2A4A9B]/10 group-hover:from-[#0F0276]/20 group-hover:to-[#2A4A9B]/20 transition-all duration-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0F0276] dark:text-white transition-transform duration-300 group-hover:scale-110">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d={collapsedGroups.has(group.apparatusId) ? "M12 8v8M8 12h8" : "M8 12h8"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-bold text-[#0F0276] dark:text-white group-hover:text-[#2A4A9B] dark:group-hover:text-[#D8BD2A] transition-colors duration-300">
                          {group.apparatusName}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-white/70 mt-0.5">
                          {group.levelGroups.reduce((total, lg) => total + lg.items.length, 0)} skill{group.levelGroups.reduce((total, lg) => total + lg.items.length, 0) !== 1 ? 's' : ''} across {group.levelGroups.length} level{group.levelGroups.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {collapsedGroups.has(group.apparatusId) ? 'Click to expand' : 'Click to collapse'}
                      </div>
                    </button>
                    {!collapsedGroups.has(group.apparatusId) && (
                      <div className="space-y-6">
                        {group.levelGroups.map(levelGroup => (
                          <div key={`${group.apparatusId}-${levelGroup.level}`} className="space-y-3">
                            <div className="flex items-center gap-3 px-4">
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/10">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0F0276] dark:text-white">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-[#0F0276] dark:text-white">
                                  {levelGroup.levelDisplayName}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-white/70">
                                  {levelGroup.items.length} skill{levelGroup.items.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                              {levelGroup.items.map((s, idx) => (
                        <Card
                          key={s.id}
                          draggable={selectedSkillId ? false : true}
                          onDragStart={selectedSkillId ? (e) => {
                            e.preventDefault();
                            return false;
                          } : (e) => {
                            if (selectedSkillId) return;
                            setDragging({ groupId: group.apparatusId, levelId: levelGroup.level, index: idx });
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={!selectedSkillId ? (e) => {
                            if (selectedSkillId) return;
                            e.preventDefault();
                            if (dragging && dragging.groupId === group.apparatusId && dragging.levelId === levelGroup.level) {
                              setDragOver({ groupId: group.apparatusId, levelId: levelGroup.level, index: idx });
                            }
                          } : undefined}
                          onDrop={!selectedSkillId ? (e) => {
                            if (selectedSkillId) return;
                            e.preventDefault();
                            if (!dragging || dragging.groupId !== group.apparatusId || dragging.levelId !== levelGroup.level) { 
                              setDragging(null); 
                              setDragOver(null); 
                              return; 
                            }
                            const from = dragging.index;
                            const to = idx;
                            if (from === to) { setDragging(null); setDragOver(null); return; }
                            const arr = [...levelGroup.items];
                            const moved = arr.splice(from, 1)[0];
                            arr.splice(to, 0, moved);
                            // Persist new display order in 10s
                            arr.forEach((item, i) => {
                              const newOrder = (i + 1) * 10;
                              if (item.displayOrder !== newOrder) {
                                updateSkill.mutate({ id: item.id, patch: { displayOrder: newOrder } });
                              }
                            });
                            setDragging(null);
                            setDragOver(null);
                            // Invalidate to reflect new order
                            qc.invalidateQueries({ queryKey: ["/api/admin/skills"], exact: false });
                          } : undefined}
                          className={`${dragOver && dragOver.groupId === group.apparatusId && dragOver.levelId === levelGroup.level && dragOver.index === idx && !selectedSkillId ? 'ring-2 ring-[#D8BD2A] shadow-xl' : ''} ${expandedIds.has(s.id) ? 'col-span-2 md:col-span-4' : ''} rounded-xl border border-slate-200/60 bg-white/80 supports-[backdrop-filter]:bg-white/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/80 overflow-hidden group ${selectedSkillId ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <CardContent className="p-0 overflow-hidden">
                            {(!expandedIds.has(s.id)) ? (
                              <button
                                type="button"
                                className="w-full aspect-square rounded-xl flex flex-col items-start justify-center p-4 text-left hover:bg-gradient-to-br hover:from-white/20 hover:to-transparent dark:hover:from-[#2A4A9B]/10 overflow-hidden transition-all duration-300 group-hover:scale-[1.02] transform-gpu"
                                onClick={() => setExpandedIds(prev => { const next = new Set(prev); next.has(s.id) ? next.delete(s.id) : next.add(s.id); return next; })}
                              >
                                <div
                                  className="text-sm font-bold text-[#0F0276] dark:text-white w-full break-words leading-tight"
                                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                >
                                  {s.name || `Skill #${s.id}`}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-white/70 mt-2 truncate w-full flex items-center gap-1">
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#D8BD2A]/20 text-[#0F0276] dark:text-white">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                  {apparatus.find(a => a.id === s.apparatusId)?.name || '—'}
                                </div>
                                <div className="text-xs mt-2 truncate w-full">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-[#0F0276]/10 to-[#2A4A9B]/10 text-[#0F0276] dark:text-white font-medium">
                                    {s.level || 'beginner'}
                                  </span>
                                </div>
                                {s.category && (
                                  <div className="text-xs mt-2 truncate w-full">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#D8BD2A]/20 text-[#0F0276] dark:text-white font-medium">
                                      {s.category}
                                    </span>
                                  </div>
                                )}
                              </button>
                            ) : (
                              <div
                                className="space-y-4 p-6"
                                onClick={(e) => {
                                  const el = e.target as HTMLElement | null;
                                  if (!el) return;
                                  // Ignore clicks on interactive elements
                                  if (el.closest('button, a, input, textarea, select, [role="button"]')) return;
                                  // Collapse this card
                                  setExpandedIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(s.id);
                                    return next;
                                  });
                                }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white mb-2">{s.name || `Skill #${s.id}`}</CardTitle>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-white/80">
                                      <div className="flex items-center gap-1">
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0F0276] dark:text-white">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </span>
                                        <span className="font-medium">{apparatus.find(a => a.id === s.apparatusId)?.name || '—'}</span>
                                      </div>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-[#0F0276]/10 to-[#2A4A9B]/10 text-[#0F0276] dark:text-white font-medium text-xs">
                                        {s.level || 'beginner'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {editingId === s.id ? (
                                      <>
                                        <Button 
                                          size="sm" 
                                          onClick={() => {
                                          if (!editingId) return;
                                          updateSkill.mutate({ id: editingId, patch: editDraft });
                                          setEditingId(undefined);
                                          setEditDraft({});
                                        }}
                                        className="bg-gradient-to-r from-[#0F0276] to-[#2A4A9B] hover:from-[#0F0276]/90 hover:to-[#2A4A9B]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                          Save
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => { setEditingId(undefined); setEditDraft({}); }}
                                          className="border-slate-200/60 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white/90 dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/50 dark:text-white dark:hover:bg-[#0F0276]/70"
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => { 
                                          setEditingId(s.id); 
                                          setEditDraft({ 
                                            name: s.name || '', 
                                            category: s.category || '', 
                                            level: s.level || 'beginner', 
                                            displayOrder: s.displayOrder ?? undefined, 
                                            apparatusId: s.apparatusId ?? undefined, 
                                            description: s.description || '',
                                            referenceVideos: s.referenceVideos || []
                                          });
                                          // Clear video form state
                                          setNewVideoTitle('');
                                          setNewVideoUrl('');
                                          setNewVideoDescription('');
                                          setSelectedVideoFile(null);
                                          setVideoUploadMode('url');
                                        }}
                                        className="border-slate-200/60 bg-white/80 backdrop-blur-sm text-[#0F0276] hover:bg-white/90 dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/50 dark:text-white dark:hover:bg-[#0F0276]/70"
                                      >
                                        Edit
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant={selectedSkillId === s.id ? 'secondary' : 'outline'} 
                                      onClick={(e) => { 
                                        e.stopPropagation?.(); 
                                        setDragging(null);
                                        setDragOver(null);
                                        setSelectedSkillId(prev => prev === s.id ? undefined : s.id); 
                                      }}
                                      className={selectedSkillId === s.id ? 
                                        "bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] hover:from-[#D8BD2A]/30 hover:to-[#D8BD2A]/40 dark:text-white border-[#D8BD2A]/40" : 
                                        "border-slate-200/60 bg-white/80 backdrop-blur-sm text-[#0F0276] hover:bg-white/90 dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/50 dark:text-white dark:hover:bg-[#0F0276]/70"}
                                    >
                                      Relations
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={(e) => { e.stopPropagation?.(); deleteSkill.mutate(s.id); }}
                                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>

                                {editingId === s.id ? (
                                  <div className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md p-4 shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/80">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Name</Label>
                                        <Input 
                                          value={(editDraft.name as string) || ''} 
                                          onChange={(e) => setEditDraft(d => ({ ...d, name: e.target.value }))} 
                                          className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Category</Label>
                                        <Input 
                                          value={(editDraft.category as string) || ''} 
                                          onChange={(e) => setEditDraft(d => ({ ...d, category: e.target.value }))} 
                                          className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Level</Label>
                                        <Select value={(editDraft.level as string) || 'beginner'} onValueChange={(v) => setEditDraft(d => ({ ...d, level: v }))}>
                                          <SelectTrigger className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {LEVELS.map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Display Order</Label>
                                        <Input 
                                          type="number" 
                                          value={editDraft.displayOrder ?? ''} 
                                          onChange={(e) => setEditDraft(d => ({ ...d, displayOrder: e.target.value === '' ? undefined : Number(e.target.value) }))} 
                                          className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Apparatus</Label>
                                        <Select value={editDraft.apparatusId ? String(editDraft.apparatusId) : ''} onValueChange={(v) => setEditDraft(d => ({ ...d, apparatusId: v ? Number(v) : undefined }))}>
                                          <SelectTrigger className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50">
                                            <SelectValue placeholder="Select apparatus" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {apparatus.map(a => (<SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Description</Label>
                                        <Input 
                                          value={(editDraft.description as string) || ''} 
                                          onChange={(e) => setEditDraft(d => ({ ...d, description: e.target.value }))} 
                                          className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50"
                                        />
                                      </div>
                                      
                                      {/* Reference Videos Section for Editing */}
                                      <div className="sm:col-span-2 lg:col-span-3 space-y-3">
                                        <Label className="text-[#0F0276] dark:text-white font-medium">Reference Videos (optional)</Label>
                                        <div className="border border-slate-200/60 rounded-lg p-3 bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30">
                                          {/* Existing Videos */}
                                          {(editDraft.referenceVideos as VideoReference[] || []).length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                                              {(editDraft.referenceVideos as VideoReference[] || []).map((video, index) => {
                                                const direct = isDirectVideoUrl(video.url);
                                                return (
                                                  <div key={index} className="relative group bg-white/50 dark:bg-[#0F0276]/50 rounded-lg border border-slate-200/60 dark:border-[#2A4A9B]/40 overflow-hidden">
                                                    {direct ? (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          console.log('Edit form video clicked:', video.url, video.title);
                                                          if (video.url) {
                                                            setOpenVideo({ url: video.url, title: video.title || undefined });
                                                          }
                                                        }}
                                                        className="w-full text-left"
                                                      >
                                                        <AspectRatio ratio={16/9} className="overflow-hidden">
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
                                                      </button>
                                                    ) : (
                                                      <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                                                        <div className="text-center">
                                                          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                                            🎥
                                                          </div>
                                                          <div className="text-xs text-slate-600 dark:text-white/70">External Video</div>
                                                        </div>
                                                      </div>
                                                    )}
                                                    
                                                    {/* Video Info */}
                                                    <div className="p-3">
                                                      <div className="font-medium text-sm text-[#0F0276] dark:text-white mb-1 line-clamp-2">{video.title}</div>
                                                      {video.description && (
                                                        <div className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 mb-2">{video.description}</div>
                                                      )}
                                                      <div className="flex items-center justify-between">
                                                        <div className="text-xs text-slate-600 dark:text-white/70">
                                                          {video.type === 'url' ? 'URL' : 'Upload'}
                                                        </div>
                                                        <Button
                                                          size="sm"
                                                          variant="destructive"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const updated = (editDraft.referenceVideos as VideoReference[] || []).filter((_, i) => i !== index);
                                                            setEditDraft(d => ({ ...d, referenceVideos: updated }));
                                                          }}
                                                          className="h-6 w-6 p-0"
                                                        >
                                                          ×
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                          
                                          {/* Add New Video */}
                                          <div className="space-y-3">
                                            {/* Mode Toggle */}
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                variant={videoUploadMode === 'url' ? 'default' : 'outline'}
                                                onClick={() => {
                                                  setVideoUploadMode('url');
                                                  setSelectedVideoFile(null);
                                                }}
                                                className="text-xs"
                                              >
                                                URL Link
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant={videoUploadMode === 'upload' ? 'default' : 'outline'}
                                                onClick={() => {
                                                  setVideoUploadMode('upload');
                                                  setNewVideoUrl('');
                                                }}
                                                className="text-xs"
                                              >
                                                Upload File
                                              </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              <Input
                                                placeholder="Video title"
                                                value={newVideoTitle}
                                                onChange={(e) => setNewVideoTitle(e.target.value)}
                                                className="text-sm"
                                              />
                                              {videoUploadMode === 'url' ? (
                                                <Input
                                                  placeholder="Video URL (e.g., YouTube, Vimeo)"
                                                  value={newVideoUrl}
                                                  onChange={(e) => setNewVideoUrl(e.target.value)}
                                                  className="text-sm"
                                                />
                                              ) : (
                                                <div className="relative">
                                                  <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      setSelectedVideoFile(file || null);
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                  />
                                                  <div className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0F0276]/50 dark:border-[#2A4A9B]/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0F0276]/70 transition-colors">
                                                    {selectedVideoFile ? (
                                                      <span className="text-slate-700 dark:text-white">
                                                        {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)}MB)
                                                      </span>
                                                    ) : (
                                                      <span className="text-slate-500 dark:text-white/60">Choose video file...</span>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            <Input
                                              placeholder="Description (optional)"
                                              value={newVideoDescription}
                                              onChange={(e) => setNewVideoDescription(e.target.value)}
                                              className="text-sm"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                  if (!newVideoTitle) return;
                                                  if (videoUploadMode === 'url' && !newVideoUrl) return;
                                                  if (videoUploadMode === 'upload' && !selectedVideoFile) return;

                                                  try {
                                                    let videoUrl = newVideoUrl;
                                                    let fileSize: number | undefined;
                                                    let mimeType: string | undefined;

                                                    if (videoUploadMode === 'upload' && selectedVideoFile) {
                                                      videoUrl = await handleFileUpload(selectedVideoFile);
                                                      fileSize = selectedVideoFile.size;
                                                      mimeType = selectedVideoFile.type;
                                                    }

                                                    const newVideo: VideoReference = {
                                                      id: Math.random().toString(36).substr(2, 9),
                                                      type: videoUploadMode,
                                                      url: videoUrl,
                                                      title: newVideoTitle,
                                                      description: newVideoDescription || undefined,
                                                      uploadedAt: new Date().toISOString(),
                                                      fileSize,
                                                      mimeType,
                                                    };
                                                    const currentVideos = (editDraft.referenceVideos as VideoReference[] || []);
                                                    setEditDraft(d => ({ ...d, referenceVideos: [...currentVideos, newVideo] }));
                                                    setNewVideoTitle('');
                                                    setNewVideoUrl('');
                                                    setNewVideoDescription('');
                                                    setSelectedVideoFile(null);
                                                  } catch (error) {
                                                    console.error('Failed to add video:', error);
                                                  }
                                                }}
                                                disabled={!newVideoTitle || (videoUploadMode === 'url' ? !newVideoUrl : !selectedVideoFile)}
                                                className="text-sm"
                                              >
                                                Add Video
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setNewVideoTitle('');
                                                  setNewVideoUrl('');
                                                  setNewVideoDescription('');
                                                  setSelectedVideoFile(null);
                                                }}
                                                className="text-sm"
                                              >
                                                Clear
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-slate-200/40 bg-gradient-to-br from-white/60 to-white/40 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm p-4 shadow-sm dark:border-[#2A4A9B]/40 dark:from-[#0F0276]/40 dark:to-[#0F0276]/20">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <div className="text-xs text-slate-500 dark:text-white/60 font-medium mb-1">Category</div>
                                        <div className="text-slate-700 dark:text-white">{s.category || '—'}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-slate-500 dark:text-white/60 font-medium mb-1">Display Order</div>
                                        <div className="text-slate-700 dark:text-white">{s.displayOrder ?? '—'}</div>
                                      </div>
                                      <div className="sm:col-span-2 lg:col-span-3">
                                        <div className="text-xs text-slate-500 dark:text-white/60 font-medium mb-1">Description</div>
                                        <div className="text-slate-700 dark:text-white break-words">{s.description || '—'}</div>
                                      </div>
                                      {/* Reference Videos Display */}
                                      {s.referenceVideos && s.referenceVideos.length > 0 && (
                                        <div className="sm:col-span-2 lg:col-span-3">
                                          <div className="text-xs text-slate-500 dark:text-white/60 font-medium mb-2">Reference Videos</div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {s.referenceVideos.map((video, index) => {
                                              const direct = isDirectVideoUrl(video.url);
                                              return (
                                                <div key={index} className="relative group bg-white/50 dark:bg-[#0F0276]/50 rounded-lg border border-slate-200/60 dark:border-[#2A4A9B]/40 overflow-hidden">
                                                  {direct ? (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('Skills details video clicked:', video.url, video.title);
                                                        if (video.url) {
                                                          setOpenVideo({ url: video.url, title: video.title || undefined });
                                                        }
                                                      }}
                                                      className="w-full text-left"
                                                    >
                                                      <AspectRatio ratio={16/9} className="overflow-hidden">
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
                                                    </button>
                                                  ) : (
                                                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                                                      <div className="text-center">
                                                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                                          {video.url.includes('MB)') ? '📁' : '🎥'}
                                                        </div>
                                                        <div className="text-xs text-slate-600 dark:text-white/70">
                                                          {video.url.includes('MB)') ? 'Uploaded File' : 'External Video'}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Video Info */}
                                                  <div className="p-3">
                                                    <div className="font-medium text-sm text-[#0F0276] dark:text-white mb-1 line-clamp-2">{video.title}</div>
                                                    {video.description && (
                                                      <div className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 mb-2">{video.description}</div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                      <div className="text-xs text-slate-600 dark:text-white/70">
                                                        {video.type === 'url' ? 'URL' : 'Upload'}
                                                      </div>
                                                      {!direct && (
                                                        video.url.includes('MB)') ? (
                                                          <div className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                                                            Upload Pending
                                                          </div>
                                                        ) : (
                                                          <a 
                                                            href={video.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
                                                          >
                                                            View
                                                          </a>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                      {selectedSkillId === s.id && (
                        <div className="mt-4 rounded-xl border border-slate-200/60 bg-gradient-to-br from-white/70 to-white/50 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md p-6 shadow-lg dark:border-[#2A4A9B]/60 dark:from-[#0F0276]/60 dark:to-[#0F0276]/40">
                          <div className="font-bold text-[#0F0276] dark:text-white flex items-center gap-3 mb-4">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0F0276] dark:text-white">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <span className="text-lg">Edit Relations</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-lg border border-slate-200/40 bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm p-4 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30">
                              <div className="text-sm font-semibold mb-3 text-[#0F0276] dark:text-white flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0F0276]/10 dark:bg-white/10">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </span>
                                Prerequisites
                              </div>
                              <div className="max-h-64 overflow-auto space-y-2">
                                {s.apparatusId ? (
                                  skills
                                    .filter(sk => sk.apparatusId === s.apparatusId)
                                    .sort((a, b) => {
                                      // Sort by experience level first  
                                      const levelOrder = ['beginner', 'intermediate', 'advanced', 'elite'];
                                      const aLevel = levelOrder.indexOf(a.level || 'beginner');
                                      const bLevel = levelOrder.indexOf(b.level || 'beginner');
                                      if (aLevel !== bLevel) return aLevel - bLevel;
                                      // Then by displayOrder, then by name
                                      const ao = a.displayOrder ?? 1_000_000;
                                      const bo = b.displayOrder ?? 1_000_000;
                                      if (ao !== bo) return ao - bo;
                                      return (a.name || '').localeCompare(b.name || '');
                                    })
                                    .map(sk => (
                                    <label key={sk.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-white/40 dark:hover:bg-[#0F0276]/40 transition-colors duration-200">
                                      <input
                                        type="checkbox"
                                        checked={!!relations?.prerequisiteIds?.includes(sk.id)}
                                        onChange={(e) => {
                                          const current = new Set(relations?.prerequisiteIds || []);
                                          if (e.target.checked) current.add(sk.id); else current.delete(sk.id);
                                          saveRelations.mutate({ skillId: s.id, relations: { prerequisiteIds: Array.from(current), componentIds: relations?.componentIds || [] } });
                                        }}
                                        className="rounded border-slate-300 text-[#0F0276] focus:ring-[#0F0276] focus:ring-offset-0"
                                      />
                                      <span className="text-slate-700 dark:text-white">{sk.name || `Skill #${sk.id}`}</span>
                                    </label>
                                  ))
                                ) : (
                                  <div className="text-center py-4 text-slate-500 dark:text-white/60 text-sm">
                                    No apparatus assigned to this skill
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-200/40 bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm p-4 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30">
                              <div className="text-sm font-semibold mb-3 text-[#0F0276] dark:text-white flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0F0276]/10 dark:bg-white/10">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </span>
                                Connected Components (order matters)
                              </div>
                              <div className="space-y-3">
                                {(relations?.componentIds || []).map((id, idx) => {
                                  const skill = skills.find(sk => sk.id === id);
                                  return (
                                    <div key={`${id}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-[#0F0276]/50 border border-slate-200/40 dark:border-[#2A4A9B]/40">
                                      <span className="text-xs w-6 h-6 flex items-center justify-center rounded-full bg-[#D8BD2A]/20 text-[#0F0276] dark:text-white font-medium">{idx + 1}</span>
                                      <span className="flex-1 text-sm text-slate-700 dark:text-white">{skill?.name || `Skill #${id}`}</span>
                                      <div className="flex gap-1">
                                        <Button size="sm" variant="outline" onClick={() => {
                                          const arr = [...(relations?.componentIds || [])];
                                          if (idx > 0) {
                                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                            saveRelations.mutate({ skillId: s.id, relations: { prerequisiteIds: relations?.prerequisiteIds || [], componentIds: arr } });
                                          }
                                        }} className="h-7 w-7 p-0 border-slate-300 dark:border-[#2A4A9B]/40">
                                          ↑
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => {
                                          const arr = [...(relations?.componentIds || [])];
                                          if (idx < arr.length - 1) {
                                            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                            saveRelations.mutate({ skillId: s.id, relations: { prerequisiteIds: relations?.prerequisiteIds || [], componentIds: arr } });
                                          }
                                        }} className="h-7 w-7 p-0 border-slate-300 dark:border-[#2A4A9B]/40">
                                          ↓
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => {
                                          const arr = (relations?.componentIds || []).filter((v, i) => i !== idx);
                                          saveRelations.mutate({ skillId: s.id, relations: { prerequisiteIds: relations?.prerequisiteIds || [], componentIds: arr } });
                                        }} className="h-7 w-7 p-0">
                                          ×
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                                <div className="flex items-center gap-2">
                                  {s.apparatusId ? (
                                    <Select onValueChange={(v) => {
                                      const id = Number(v);
                                      if (!Number.isFinite(id)) return;
                                      const arr = [...(relations?.componentIds || []), id];
                                      saveRelations.mutate({ skillId: s.id, relations: { prerequisiteIds: relations?.prerequisiteIds || [], componentIds: arr } });
                                    }}>
                                      <SelectTrigger className="border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50">
                                        <SelectValue placeholder="Add component skill" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {skills
                                          .filter(sk => sk.apparatusId === s.apparatusId && !relations?.componentIds?.includes(sk.id))
                                          .sort((a, b) => {
                                            // Sort by experience level first  
                                            const levelOrder = ['beginner', 'intermediate', 'advanced', 'elite'];
                                            const aLevel = levelOrder.indexOf(a.level || 'beginner');
                                            const bLevel = levelOrder.indexOf(b.level || 'beginner');
                                            if (aLevel !== bLevel) return aLevel - bLevel;
                                            // Then by displayOrder, then by name
                                            const ao = a.displayOrder ?? 1_000_000;
                                            const bo = b.displayOrder ?? 1_000_000;
                                            if (ao !== bo) return ao - bo;
                                            return (a.name || '').localeCompare(b.name || '');
                                          })
                                          .map(sk => (
                                          <SelectItem key={sk.id} value={String(sk.id)}>{sk.name || `Skill #${sk.id}`}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="text-center py-2 text-slate-500 dark:text-white/60 text-sm flex-1 border border-dashed border-slate-300 dark:border-[#2A4A9B]/40 rounded-lg">
                                      No apparatus assigned to this skill
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {filteredSkills.length === 0 && (
                  <div className="text-sm text-gray-500">No skills found for current filters.</div>
                )}
              </div>
            )}
            
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Video Modal */}
      <Dialog open={!!openVideo} onOpenChange={(o) => !o && setOpenVideo(null)}>
        <DialogContent className="max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-slate-200/60 dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-[#D8BD2A]" />
              {openVideo?.title || 'Skill Reference Video'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {openVideo?.url && (
              <div className="w-full">
                <AspectRatio ratio={16/9}>
                  {isDirectVideoUrl(openVideo.url) ? (
                    <video
                      className="h-full w-full rounded-lg border border-slate-200/60 dark:border-white/20 bg-black shadow-xl"
                      src={openVideo.url}
                      controls
                      playsInline
                      autoPlay
                      onError={(e) => {
                        console.log('Modal video error:', e.currentTarget.src);
                      }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-lg border border-slate-200/60 dark:border-white/20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-xl flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                          🎥
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">External Video</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">This video is hosted externally</p>
                        <a 
                          href={openVideo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F0276] text-white rounded-lg hover:bg-[#0F0276]/90 transition-colors"
                        >
                          <Play className="h-4 w-4" />
                          Open Video
                        </a>
                      </div>
                    </div>
                  )}
                </AspectRatio>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              {openVideo?.url && (
                <a href={openVideo.url} download target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="text-[#0F0276] dark:text-white border-slate-200/60 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10">
                    <Download className="h-4 w-4 mr-2" />
                    Download Video
                  </Button>
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
