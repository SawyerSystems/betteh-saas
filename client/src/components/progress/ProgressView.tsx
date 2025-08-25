import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Award, BookOpen, Calendar, CheckCircle, Clock, Download, Filter, Play, Search, Star, Trophy, Target, TrendingUp, Eye, BarChart3, Shield, Settings, ArrowLeft, User } from 'lucide-react';
import AddAthleteSkillDialog from '@/components/admin/AddAthleteSkillDialog';
import { TestSkillDialog } from '@/components/admin/TestSkillDialog';
import { VideoStack } from '@/components/progress/VideoStack';
import { VideoGalleryModal } from '@/components/progress/VideoGalleryModal';
import { DayVideoModal } from '@/components/progress/DayVideoModal';
import { groupVideosByDay, getVisibleGroups, shouldShowSeeMore, formatDateLabel, getLocalDayKey, type VideoGroup } from '@/utils/videoGrouping';
import type { Skill as SharedSkill } from '@shared/schema';

type ProgressVideo = {
  id: number;
  url?: string | null;
  title?: string | null;
  recordedAt?: string | Date | null;
};

type ProgressSkill = {
  athleteSkill: any;
  skill?: { id: number; name?: string | null; level?: string | number | null; category?: string | null; apparatusId?: number | null } | null;
  videos: ProgressVideo[];
};

export interface ProgressData {
  athlete: any;
  skills: ProgressSkill[];
}

type ProgressStats = {
  mastered: number;
  consistent: number;
  learning: number;
  prepping: number;
  totalSkills: number;
  skillsWithVideos: number;
  totalVideos: number;
  progressPercentage: number;
};

export default function ProgressView({ data, isAdmin = false }: { data: any; isAdmin?: boolean }) {
  const [openVideo, setOpenVideo] = React.useState<{ url: string; title?: string } | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [showEditAthlete, setShowEditAthlete] = React.useState(false);
  const [selectedSkillForTest, setSelectedSkillForTest] = React.useState<any>(null);
  const [showAddSkillDialog, setShowAddSkillDialog] = React.useState(false);
  
  // URL-based route protection for videos tab
  React.useEffect(() => {
    // Check if parent user is trying to access videos tab via URL hash or direct link
    if (!isAdmin && (window.location.hash === '#videos' || window.location.search.includes('tab=videos'))) {
      // Analytics tracking for parent video access attempt via URL
      console.log('Analytics: Parent attempted to access videos tab via direct URL');
      
      // Redirect to skills tab by modifying URL and programmatically switching tab
      window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]tab=videos/, ''));
      window.location.hash = '';
      
      // Wait for component to render, then switch to skills tab
      setTimeout(() => {
        const skillsTab = document.querySelector('[value="skills"]') as HTMLElement;
        if (skillsTab) {
          skillsTab.click();
        }
      }, 100);
    }
  }, [isAdmin]);
  
  // Modal states for video stacks
  const [dayVideoModal, setDayVideoModal] = React.useState<{
    isOpen: boolean;
    skillName: string;
    dateLabel: string;
    videos: any[];
  }>({ isOpen: false, skillName: '', dateLabel: '', videos: [] });
  
  const [galleryModal, setGalleryModal] = React.useState<{
    isOpen: boolean;
    skillName: string;
    groups: VideoGroup[];
  }>({ isOpen: false, skillName: '', groups: [] });
  const [testingSkill, setTestingSkill] = React.useState<{ skill: SharedSkill; athleteSkillId?: number; status?: string | null; notes?: string | null } | null>(null);

  // Typed helpers
  const isMastered = React.useCallback((s: ProgressSkill) => s.athleteSkill?.status?.toLowerCase() === 'mastered', []);

  const isDirectVideoUrl = React.useCallback((url?: string | null) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      const path = u.pathname.toLowerCase();
      return /(\.mp4|\.webm|\.m4v|\.mov|\.ogg|\.ogv)$/i.test(path);
    } catch {
      return /(\.mp4|\.webm|\.m4v|\.mov|\.ogg|\.ogv)$/i.test(url.toLowerCase());
    }
  }, []);

  const a = data.athlete;
  // Load site content to get progress settings
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: () => apiRequest('GET', '/api/site-content').then(res => res.json())
  });

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    data.skills.forEach((skill: ProgressSkill) => {
      if (skill.skill?.category) {
        cats.add(skill.skill.category.toLowerCase());
      }
    });
    return Array.from(cats);
  }, [data.skills]);

  // Calculate statistics
  const stats = React.useMemo<ProgressStats>(() => {
    const statusCounts = {
      mastered: 0,
      consistent: 0,
      prepping: 0,
      learning: 0
    } as Record<string, number>;

    data.skills.forEach((skill: ProgressSkill) => {
      const raw = skill.athleteSkill?.status?.toLowerCase();
      const status = raw === 'working' ? 'prepping' : raw;
      if (status && status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });

    const totalSkills = data.skills.length;
    const skillsWithVideos = data.skills.filter((s: ProgressSkill) => s.videos.length > 0).length;
    const totalVideos = data.skills.reduce((acc: number, s: ProgressSkill) => acc + s.videos.length, 0);

    return {
      mastered: statusCounts.mastered || 0,
      consistent: statusCounts.consistent || 0,
      learning: statusCounts.learning || 0,
      prepping: statusCounts.prepping || 0,
      totalSkills,
      skillsWithVideos,
      totalVideos,
      progressPercentage: totalSkills > 0 ? Math.round((statusCounts.mastered / totalSkills) * 100) : 0
    };
  }, [data.skills]);

  // Current-level stats and thresholds
  const levelStats = React.useMemo(() => {
    const level = String(a?.experience || '').toLowerCase();
    const counts = { mastered: 0, consistent: 0, learning: 0, prepping: 0 } as Record<string, number>;
    let total = 0;
    (data.skills as any[]).forEach((s) => {
      const skillLevel = String(s.skill?.level || '').toLowerCase();
      if (!level || !skillLevel || skillLevel !== level) return;
      total += 1;
      const raw = String(s.athleteSkill?.status || '').toLowerCase();
      const st = raw === 'working' ? 'prepping' : raw;
      if (st in counts) counts[st] += 1;
    });
    const required = siteContent?.about?.progressSettings?.requiredMasteredPerLevel?.[level] ?? null;
    return { level, total, counts, required };
  }, [a?.experience, data.skills, siteContent]);

  // Filtered skills per search/status/category
  const filteredSkills = React.useMemo<ProgressSkill[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.skills.filter((s: ProgressSkill) => {
      const name = (s.skill?.name || '').toLowerCase();
      const category = (s.skill?.category || '').toLowerCase();
      const raw = (s.athleteSkill?.status || '').toLowerCase();
      const status = raw === 'working' ? 'prepping' : raw;
      if (term && !(name.includes(term) || category.includes(term))) return false;
      if (categoryFilter !== 'all' && category !== categoryFilter) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      return true;
    });
  }, [data.skills, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] to-white dark:from-[#0B163F] dark:to-[#0B163F]">
      <header className="bg-[#0F0276] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            {/* Athlete Name & Experience */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {a?.name || `${a?.firstName || ''} ${a?.lastName || ''}`.trim() || 'Athlete Progress'}
                </h1>
                {a?.experience && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-blue-200 text-sm font-medium">Experience Level:</span>
                    <span className="bg-[#D8BD2A] text-[#0F0276] px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                      {String(a.experience).charAt(0).toUpperCase() + String(a.experience).slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#D8BD2A]">{stats.totalSkills}</div>
                <div className="text-xs text-blue-100">Total Skills</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.mastered}</div>
                <div className="text-xs text-blue-100">Mastered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalVideos}</div>
                <div className="text-xs text-blue-100">Videos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.progressPercentage}%</div>
                <div className="text-xs text-blue-100">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Toolbar */}
      {isAdmin && (
        <div className="bg-orange-500/90 backdrop-blur-sm border-b border-orange-600/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Admin View</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Enhanced Controls
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => setShowEditAthlete(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  View Athlete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => setShowAddSkillDialog(true)}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Test Skills
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => window.location.href = '/admin'}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Admin Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} lg:w-auto ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Skills
            </TabsTrigger>
            {/* Videos tab - only visible to admin/coach users */}
            {isAdmin && (
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Videos
              </TabsTrigger>
            )}
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Progress Summary */}
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#0F0276] dark:text-white">
                    <TrendingUp className="h-5 w-5 text-[#D8BD2A]" />
                    Progress Summary
                  </CardTitle>
                  <CardDescription className="text-[#0F0276]/70 dark:text-white/70">
                    Skill mastery breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { key: 'prepping', label: 'Prepping', count: stats.prepping, color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300' },
                      { key: 'learning', label: 'Learning', count: stats.learning, color: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-300' },
                      { key: 'consistent', label: 'Consistent', count: stats.consistent, color: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-700 dark:text-purple-300' },
                      { key: 'mastered', label: 'Mastered', count: stats.mastered, color: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-700 dark:text-green-300' },
                    ].map(({ key, label, count, color, bgColor, textColor }) => (
                      <div key={key} className={`rounded-lg p-4 ${bgColor}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-sm font-medium ${textColor}`}>{label}</div>
                            <div className={`text-2xl font-bold ${textColor}`}>{count}</div>
                          </div>
                          <div className={`w-3 h-12 rounded-full ${color}`}></div>
                        </div>
                        {stats.totalSkills > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${color}`}
                                style={{ width: `${(count / stats.totalSkills) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Current Level Progress */}
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#0F0276] dark:text-white">
                    <Target className="h-5 w-5 text-[#D8BD2A]" />
                    Current Level Progress
                  </CardTitle>
                  <CardDescription className="text-[#0F0276]/70 dark:text-white/70">
                    {levelStats.level ? `Level: ${levelStats.level.charAt(0).toUpperCase() + levelStats.level.slice(1)}` : 'No level set'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    Total skills in level: <span className="font-semibold">{levelStats.total}</span>
                    {typeof levelStats.required === 'number' && (
                      <>
                        <span className="mx-2">•</span>
                        Required to advance: <span className="font-semibold">{levelStats.required}</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    {([
                      ['prepping','Prepping','text-blue-700 dark:text-blue-300','bg-blue-500'],
                      ['learning','Learning','text-amber-700 dark:text-amber-300','bg-amber-500'],
                      ['consistent','Consistent','text-purple-700 dark:text-purple-300','bg-purple-500'],
                      ['mastered','Mastered','text-green-700 dark:text-green-300','bg-green-500']
                    ] as const).map(([key, label, textColor, barColor]) => {
                      const count = levelStats.counts[key] || 0;
                      const pct = levelStats.total ? Math.round((count / levelStats.total) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-medium ${textColor}`}>{label}</span>
                            <span className={`${textColor}`}>{count}/{levelStats.total} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-white/50 rounded">
                            <div className={`h-2 ${barColor} rounded`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {typeof levelStats.required === 'number' && (
                    <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">
                      Mastered {levelStats.counts.mastered || 0} / {Math.max(levelStats.required, 0)} required to advance
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#0F0276] dark:text-white">
                    <Award className="h-5 w-5 text-[#D8BD2A]" />
                    Latest Achievements
                  </CardTitle>
                  <CardDescription className="text-[#0F0276]/70 dark:text-white/70">
                    Recently mastered skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredSkills.filter(isMastered).slice(0, 5).map((skill: ProgressSkill) => (
                      <div key={skill.athleteSkill.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-green-800 dark:text-green-200 truncate">
                            {skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {skill.skill?.category && `${skill.skill.category} • `}
                            {skill.videos.length} video{skill.videos.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredSkills.filter(isMastered).length === 0 && (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm">No mastered skills yet</p>
                        <p className="text-xs">Keep practicing to earn achievements!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Video Statistics */}
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#0F0276] dark:text-white">
                    <Eye className="h-5 w-5 text-[#D8BD2A]" />
                    Video Progress
                  </CardTitle>
                  <CardDescription className="text-[#0F0276]/70 dark:text-white/70">
                    Documentation overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalVideos}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">Total Videos</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.skillsWithVideos}</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">Skills with Videos</div>
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#0F0276] dark:text-white">Video Coverage</span>
                        <span className="text-[#0F0276] dark:text-white">
                          {stats.totalSkills > 0 ? Math.round((stats.skillsWithVideos / stats.totalSkills) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ 
                            width: `${stats.totalSkills > 0 ? (stats.skillsWithVideos / stats.totalSkills) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Apparatus Breakdown */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-[#D8BD2A]" />
                Apparatus Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const categorySkills = data.skills.filter((skill: ProgressSkill) => 
                    skill.skill?.category?.toLowerCase() === category
                  );
                  
                  const categoryStats = {
                    mastered: 0,
                    consistent: 0,
                    prepping: 0,
                    learning: 0,
                    total: categorySkills.length
                  };
                  
                  categorySkills.forEach((skill: ProgressSkill) => {
                    const raw = skill.athleteSkill?.status?.toLowerCase();
                    const status = raw === 'working' ? 'prepping' : raw;
                    if (status && status in categoryStats) {
                      categoryStats[status as keyof typeof categoryStats]++;
                    }
                  });

                  return (
                    <Card key={category} className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-[#0F0276] dark:text-white uppercase tracking-wide">
                          {category.replace(/[_-]/g, ' ')}
                        </CardTitle>
                        <CardDescription className="text-[#0F0276]/70 dark:text-white/70">
                          Total: {categoryStats.total} • M: {categoryStats.mastered} • C: {categoryStats.consistent} • L: {categoryStats.learning} • P: {categoryStats.prepping}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { key: 'prepping', label: 'Prepping', count: categoryStats.prepping, color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-300' },
                          { key: 'learning', label: 'Learning', count: categoryStats.learning, color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-300' },
                          { key: 'consistent', label: 'Consistent', count: categoryStats.consistent, color: 'bg-purple-500', textColor: 'text-purple-700 dark:text-purple-300' },
                          { key: 'mastered', label: 'Mastered', count: categoryStats.mastered, color: 'bg-green-500', textColor: 'text-green-700 dark:text-green-300' },
                        ].map(({ key, label, count, color, textColor }) => {
                          const percentage = categoryStats.total > 0 ? Math.round((count / categoryStats.total) * 100) : 0;
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className={`font-medium ${textColor}`}>{label}</span>
                                <span className={`${textColor}`}>{percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${color}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#0F0276] dark:text-white">
                  <Filter className="h-5 w-5 text-[#D8BD2A]" />
                  Filter Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F0276] dark:text-white">Search Skills</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F0276] dark:text-white">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="mastered">Mastered</SelectItem>
                        <SelectItem value="consistent">Consistent</SelectItem>
                        <SelectItem value="prepping">Prepping</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F0276] dark:text-white">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredSkills.map((skill: ProgressSkill) => (
                <Card key={skill.athleteSkill.id} className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-700/50 pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white">
                        {skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`}
                      </CardTitle>
                      {skill.athleteSkill.status && (
                        <Badge className={
                          skill.athleteSkill.status.toLowerCase() === 'mastered' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300' 
                            : skill.athleteSkill.status.toLowerCase() === 'consistent' 
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300'
                            : (skill.athleteSkill.status.toLowerCase() === 'working' || skill.athleteSkill.status.toLowerCase() === 'prepping') 
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300'
                        }>
                          {skill.athleteSkill.status.toLowerCase() === 'working' ? 'Prepping' : skill.athleteSkill.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center mt-2 text-xs text-[#0F0276]/70 dark:text-white/70 space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {(() => {
                          const d = (skill.athleteSkill.updatedAt ?? skill.athleteSkill.createdAt) as any;
                          return d ? new Date(d).toLocaleDateString() : '—';
                        })()}
                      </span>
                      {skill.skill?.level && (
                        <span>Level: {skill.skill.level}</span>
                      )}
                      {skill.skill?.category && (
                        <span>Category: {skill.skill.category}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {skill.athleteSkill.notes && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-[#0F0276]/70 dark:text-white/70 uppercase tracking-wider mb-2">
                          Coach Notes
                        </div>
                        <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 rounded-md p-3 text-sm whitespace-pre-wrap text-[#0F0276] dark:text-white">
                          {skill.athleteSkill.notes}
                        </div>
                      </div>
                    )}
                    
                    {skill.videos.length > 0 && (() => {
                      // Group videos by day for this skill
                      const videoGroups = groupVideosByDay(skill.videos);
                      const visibleGroups = getVisibleGroups(videoGroups);
                      const showSeeMore = shouldShowSeeMore(videoGroups);
                      const totalVideos = skill.videos.length;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-[#0F0276]/70 dark:text-white/70 uppercase tracking-wider">
                              Progress Videos
                            </div>
                            <div className="text-xs text-[#0F0276]/70 dark:text-white/70">
                              {totalVideos} total
                            </div>
                          </div>
                          
                          {/* Video stacks */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {visibleGroups.map((group) => (
                                <VideoStack
                                  key={group.dayKey}
                                  coverVideo={group.coverVideo}
                                  count={group.videos.length}
                                  dateLabel={group.dateLabel}
                                  isDirectVideoUrl={isDirectVideoUrl}
                                  onClick={() => setDayVideoModal({
                                    isOpen: true,
                                    skillName: skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`,
                                    dateLabel: group.dateLabel,
                                    videos: group.videos
                                  })}
                                />
                              ))}
                            </div>
                            
                            {/* See more control */}
                            {showSeeMore && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => setGalleryModal({
                                    isOpen: true,
                                    skillName: skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`,
                                    groups: videoGroups
                                  })}
                                  className="w-full text-center py-2 px-4 text-sm font-medium text-[#0F0276] dark:text-white bg-white/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 rounded-md hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
                                >
                                  See more ({videoGroups.length - 2} more day{videoGroups.length - 2 !== 1 ? 's' : ''})
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {skill.videos.length === 0 && (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                        <Play className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs">No videos recorded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredSkills.length === 0 && (
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-lg font-medium text-[#0F0276] dark:text-white mb-2">No skills found</h3>
                  <p className="text-[#0F0276]/70 dark:text-white/70">Try adjusting your search or filter criteria</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Videos Tab - Admin/Coach Only */}
          {isAdmin ? (
            <TabsContent value="videos" className="space-y-6">
              {/* Grouped by Day */}
              {(() => {
                type VideoListItem = ProgressVideo & { skillName: string; skillStatus?: string | null };
                // Flatten all videos across skills
                const allVideos: VideoListItem[] = (data.skills as ProgressSkill[]).flatMap((skill) =>
                  (skill.videos || []).map((video) => ({
                    ...video,
                    skillName: skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`,
                    skillStatus: skill.athleteSkill?.status || null,
                  }))
                );

                if (!allVideos.length) return null;

                // Group videos by day using the utility function
                const groups = new Map<string, VideoListItem[]>();
                for (const v of allVideos) {
                  const key = getLocalDayKey(v);
                  if (!groups.has(key)) groups.set(key, []);
                  groups.get(key)!.push(v);
                }

                // Sort groups by date desc, with Unknown at bottom
                const sortedDays = Array.from(groups.keys()).sort((a, b) => {
                  if (a === 'Unknown') return 1;
                  if (b === 'Unknown') return -1;
                  return a < b ? 1 : a > b ? -1 : 0;
                });

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#D8BD2A]" />
                        Videos by Day
                      </h3>
                      <div className="text-sm text-[#0F0276]/70 dark:text-white/70">
                        {allVideos.length} clip{allVideos.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                  {sortedDays.map((day) => {
                    const items = groups.get(day)!;
                    // Sort within day by recordedAt asc then id asc for a time-sequence feel
                    items.sort((a, b) => {
                      const ad = a.recordedAt ? new Date(a.recordedAt as any).getTime() : 0;
                      const bd = b.recordedAt ? new Date(b.recordedAt as any).getTime() : 0;
                      if (ad !== bd) return ad - bd;
                      return (a.id || 0) - (b.id || 0);
                    });
                    const pretty = formatDateLabel(day);
                    return (
                      <Card key={day} className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 shadow-lg">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-[#D8BD2A]" />
                              {pretty}
                            </CardTitle>
                            <CardDescription className="text-[#0F0276]/70 dark:text-white/70">
                              {items.length} clip{items.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="relative">
                            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                              {items.map((video) => {
                                const direct = isDirectVideoUrl(video.url);
                                return (
                                  <div key={`${day}-${video.id}`} className="min-w-[260px] max-w-[260px] snap-start">
                                    {direct ? (
                                      <button
                                        type="button"
                                        onClick={() => video.url && setOpenVideo({ url: video.url, title: video.title || undefined })}
                                        className="w-full text-left"
                                      >
                                        <AspectRatio ratio={16/9} className="overflow-hidden rounded-md shadow-sm">
                                          <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                                            <video
                                              className="absolute inset-0 h-full w-full object-cover"
                                              src={video.url || undefined}
                                              muted
                                              playsInline
                                              preload="none"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="rounded-full bg-[#0F0276]/90 p-3 shadow-md hover:scale-110 hover:bg-[#0F0276] transition-transform">
                                                <Play className="h-4 w-4 text-white" fill="white" />
                                              </div>
                                            </div>
                                          </div>
                                        </AspectRatio>
                                        <div className="mt-2 space-y-1">
                                          <div className="text-xs font-medium truncate text-[#0F0276] dark:text-white" title={video.title || video.url || ''}>
                                            {video.title || 'Untitled Video'}
                                          </div>
                                          <div className="text-[10px] text-[#0F0276]/70 dark:text-white/70 truncate">
                                            {video.skillName}
                                          </div>
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
                                          {video.title || 'External Video'}
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(() => {
                type VideoListItem = ProgressVideo & { skillName: string; skillStatus?: string | null };
                const videos: VideoListItem[] = data.skills.flatMap((skill: ProgressSkill) =>
                  skill.videos.map((video: ProgressVideo) => ({
                    ...video,
                    skillName: skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`,
                    skillStatus: skill.athleteSkill.status
                  }))
                );
                return videos.map((video: VideoListItem) => {
                const direct = isDirectVideoUrl(video.url);
                return (
                  <Card key={video.id} className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20 overflow-hidden group hover:shadow-lg transition-shadow">
                    {direct ? (
                      <button
                        type="button"
                        onClick={() => video.url && setOpenVideo({ url: video.url, title: video.title || undefined })}
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
                                <Play className="h-5 w-5 text-white" fill="white" />
                              </div>
                            </div>
                          </div>
                        </AspectRatio>
                      </button>
                    ) : (
                      <div className="p-4">
                        <a 
                          className="text-[#0F0276] hover:text-[#0F0276]/80 dark:text-white dark:hover:text-white/80 font-medium text-sm flex items-center gap-1" 
                          href={video.url || undefined} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          <Play className="h-4 w-4" />
                          External Video
                        </a>
                      </div>
                    )}
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-[#0F0276] dark:text-white truncate">
                          {video.title || 'Untitled Video'}
                        </h4>
                        <p className="text-xs text-[#0F0276]/70 dark:text-white/70 truncate">
                          {video.skillName}
                        </p>
                        {video.skillStatus && (
                          <Badge className={`text-xs ${
                            video.skillStatus.toLowerCase() === 'mastered' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : video.skillStatus.toLowerCase() === 'consistent' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : (video.skillStatus.toLowerCase() === 'working' || video.skillStatus.toLowerCase() === 'prepping') 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {video.skillStatus.toLowerCase() === 'working' ? 'Prepping' : video.skillStatus}
                          </Badge>
                        )}
                        {video.recordedAt && (
                          <div className="flex items-center text-[10px] text-[#0F0276]/70 dark:text-white/70">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(video.recordedAt as any).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
              })()}
            </div>
            
            {stats.totalVideos === 0 && (
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
                <CardContent className="text-center py-12">
                  <Play className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-lg font-medium text-[#0F0276] dark:text-white mb-2">No videos available</h3>
                  <p className="text-[#0F0276]/70 dark:text-white/70">Videos will appear here as progress is documented</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          ) : (
            // Fallback content for parent users - redirect them to Skills tab
            <TabsContent value="videos" className="space-y-6">
              <Card className="bg-amber-50/60 backdrop-blur-sm border-amber-200/60 dark:bg-amber-900/20 dark:border-amber-700/30">
                <CardContent className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">Access Restricted</h3>
                  <p className="text-amber-700 dark:text-amber-300 mb-4">
                    Video content is available to coaches and administrators only.
                  </p>
                  <Button 
                    onClick={() => {
                      // Analytics tracking for parent video access attempt
                      console.log('Analytics: Parent attempted to access videos tab');
                      // Redirect to Skills tab
                      const skillsTab = document.querySelector('[data-state="inactive"][value="skills"]') as HTMLElement;
                      if (skillsTab) {
                        skillsTab.click();
                      }
                    }}
                    className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white"
                  >
                    View Skills Progress
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.filter(isMastered).map((skill: ProgressSkill) => (
                <Card key={skill.athleteSkill.id} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700/30 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
                          {skill.skill?.name || `Skill #${skill.athleteSkill.skillId}`}
                        </CardTitle>
                        <CardDescription className="text-green-600 dark:text-green-400">
                          Mastered Skill
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {skill.skill?.category && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                            {skill.skill.category}
                          </Badge>
                          {skill.skill?.level && (
                            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                              Level {skill.skill.level}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {skill.videos.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                          <Play className="h-4 w-4" />
                          {skill.videos.length} progress video{skill.videos.length !== 1 ? 's' : ''} recorded
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Completed on {(() => {
                          const d = (skill.athleteSkill.updatedAt ?? skill.athleteSkill.createdAt) as any;
                          return d ? new Date(d).toLocaleDateString() : 'Unknown date';
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredSkills.filter(isMastered).length === 0 && (
              <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-lg font-medium text-[#0F0276] dark:text-white mb-2">No achievements yet</h3>
                  <p className="text-[#0F0276]/70 dark:text-white/70">Mastered skills will be celebrated here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Video Modal */}
      <Dialog open={!!openVideo} onOpenChange={(o) => !o && setOpenVideo(null)}>
        <DialogContent className="max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-slate-200/60 dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-[#D8BD2A]" />
              {openVideo?.title || 'Skill Video'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {openVideo?.url && (
              <div className="w-full">
                <AspectRatio ratio={16/9}>
                  <video
                    className="h-full w-full rounded-lg border border-slate-200/60 dark:border-white/20 bg-black shadow-xl"
                    src={openVideo.url}
                    controls
                    playsInline
                    autoPlay
                  />
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

      {/* Day Video Modal */}
      <DayVideoModal
        isOpen={dayVideoModal.isOpen}
        onClose={() => setDayVideoModal({ isOpen: false, skillName: '', dateLabel: '', videos: [] })}
        skillName={dayVideoModal.skillName}
        dateLabel={dayVideoModal.dateLabel}
        videos={dayVideoModal.videos}
        isDirectVideoUrl={isDirectVideoUrl}
        onVideoClick={(url, title) => setOpenVideo({ url, title })}
      />

      {/* Video Gallery Modal */}
      <VideoGalleryModal
        isOpen={galleryModal.isOpen}
        onClose={() => setGalleryModal({ isOpen: false, skillName: '', groups: [] })}
        skillName={galleryModal.skillName}
        groups={galleryModal.groups}
        isDirectVideoUrl={isDirectVideoUrl}
        onVideoClick={(url, title) => setOpenVideo({ url, title })}
      />

      {/* Edit Athlete Modal */}
      {isAdmin && (
        <Dialog open={showEditAthlete} onOpenChange={setShowEditAthlete}>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-slate-200/60 dark:border-white/20">
            <DialogHeader>
              <DialogTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#D8BD2A]" />
                Edit Athlete: {data.athlete.name || `${data.athlete.firstName || ''} ${data.athlete.lastName || ''}`.trim()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Quick Edit Access</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  For comprehensive athlete editing, use the main admin dashboard. This provides quick access to common functions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      window.location.href = '/admin';
                      // You could add a URL parameter to auto-select this athlete
                    }}
                    className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Go to Athletes Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      alert(`Athlete ID: ${data.athlete.id}\nUse this ID to quickly find the athlete in the admin dashboard.`);
                    }}
                    className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Show Athlete ID
                  </Button>
                </div>
              </div>
              
              {/* Quick Info Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Current Name</Label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    {data.athlete.name || `${data.athlete.firstName || ''} ${data.athlete.lastName || ''}`.trim() || 'No name set'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Date of Birth</Label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    {data.athlete.dateOfBirth || 'Not set'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Experience Level</Label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    {data.athlete.experience || 'Not set'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Total Skills</Label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    {data.skills.length} skills tracked
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setShowEditAthlete(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    window.location.href = '/admin';
                    // Close modal
                    setShowEditAthlete(false);
                  }}
                  className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white"
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Test Skill Dialog */}
      {showAddSkillDialog && (
        <AddAthleteSkillDialog
          open={showAddSkillDialog}
          onOpenChange={(open) => {
            if (!open) setShowAddSkillDialog(false);
          }}
          athleteId={data.athlete.id}
          onPickSkill={(skill) => {
            // Close the add skill dialog and open the test skill dialog
            setShowAddSkillDialog(false);
            setTimeout(() => setTestingSkill({ skill: skill as unknown as SharedSkill }), 250);
          }}
        />
      )}

      {/* Test Skill Dialog */}
      {testingSkill && (
        <TestSkillDialog
          open={!!testingSkill}
          onOpenChange={(open) => !open && setTestingSkill(null)}
          athleteId={data.athlete.id}
          skill={testingSkill.skill}
          existing={{ athleteSkillId: testingSkill.athleteSkillId, status: testingSkill.status, notes: testingSkill.notes }}
        />
      )}
    </div>
  );
}
