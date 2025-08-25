import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Activity,
  BarChart,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Dumbbell,
  FileText,
  GraduationCap,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
};

export function AdminSidebar({ 
  isOpen, 
  onClose, 
  activeTab,
  onTabChange,
  onLogout,
  onCollapseChange
}: AdminSidebarProps) {
  // State to track if sidebar is collapsed (only for desktop)
  const [isCollapsed, setIsCollapsed] = useState(true);
  // State to track if we're on desktop (to always show sidebar regardless of isOpen prop)
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Set isDesktop on mount and when window resizes
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Initial check
    checkIsDesktop();
    
    // Add resize listener
    window.addEventListener('resize', checkIsDesktop);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Only apply desktop collapse if sidebar is open
  const effectivelyCollapsed = isOpen && isCollapsed;
  
  // Notify parent component about the collapse state
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // Navigation items definition
  const navItems = [
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'athletes',
      label: 'Athletes',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'parents',
      label: 'Parents',
      icon: <User className="h-5 w-5" />
    },
    {
      id: 'content',
      label: 'Content',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 'lesson-types',
      label: 'Lesson Types',
      icon: <Dumbbell className="h-5 w-5" />
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <Star className="h-5 w-5" />
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      id: 'waivers',
      label: 'Waivers',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      id: 'payouts',
      label: 'Payouts',
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      id: 'activity-logs',
      label: 'Activity Logs',
      icon: <Activity className="h-5 w-5" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed z-40 h-screen theme-smooth glass-surface glass-card glass-gradient shadow-xl transition-all duration-300 hidden md:flex flex-col border border-slate-200 dark:border-slate-700",
          (isOpen || isDesktop) ? "left-0" : "-left-[280px]", // Always visible on desktop
          effectivelyCollapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          {!effectivelyCollapsed ? (
            <div className="flex items-center space-x-2">
              <div className="h-9 w-9">
                <img 
                  src="/CWT_Circle_LogoSPIN.png" 
                  alt="Coach Will Tumbles Circle Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="font-bold text-[#0F0276] dark:text-[#D8BD2A]">ADVENTURE HQ</h2>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="h-9 w-9">
                <img 
                  src="/CWT_Circle_LogoSPIN.png" 
                  alt="Coach Will Tumbles Circle Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                const newCollapsedState = !isCollapsed;
                setIsCollapsed(newCollapsedState);
                onCollapseChange?.(newCollapsedState);
              }} 
              className="w-full flex items-center justify-center rounded-xl p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
                            <li key={item.id}>
                <Button 
                  variant="ghost" 
                  onClick={() => onTabChange(item.id)} 
                  className={cn(
                    "w-full flex items-center justify-start gap-3 py-3 px-4 rounded-xl transition-all duration-200 text-left font-medium",
                    activeTab === item.id ? (
                      "bg-[#0F0276] dark:bg-[#D8BD2A] text-white dark:text-[#0F0276] shadow-sm border border-[#0F0276] dark:border-[#D8BD2A]"
                    ) : (
                      "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )
                  )}
                >
                  {item.icon}
                  {!effectivelyCollapsed && <span>{item.label}</span>}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Button 
            variant="ghost" 
            onClick={onLogout} 
            className="w-full flex items-center justify-start gap-3 py-3 px-4 rounded-xl transition-colors duration-200 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          >
            <LogOut className="h-5 w-5" />
            {!effectivelyCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <aside 
            className="fixed left-0 top-0 h-full w-[85vw] max-w-[280px] theme-smooth glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700 shadow-xl animate-slideInFromLeft overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="h-9 w-9">
                  <img 
                    src="/CWT_Circle_LogoSPIN.png" 
                    alt="Coach Will Tumbles Circle Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="font-bold text-[#0F0276] dark:text-[#D8BD2A]">ADVENTURE HQ</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="rounded-full p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <ul className="space-y-1 px-3">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onTabChange(item.id);
                        onClose(); // Close drawer after selection on mobile
                      }}
                      className={cn(
                        "w-full flex items-center justify-start gap-3 py-3 px-4 rounded-xl transition-colors duration-200 font-medium",
                        activeTab === item.id
                          ? "bg-[#0F0276] dark:bg-[#D8BD2A] text-white dark:text-[#0F0276] border border-[#0F0276] dark:border-[#D8BD2A]"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                variant="ghost" 
                onClick={onLogout} 
                className="w-full flex items-center justify-start gap-3 py-3 px-4 rounded-xl transition-colors duration-200 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
