import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Import admin components lazily
import { lazy, Suspense } from "react";
const AdminBookingManager = lazy(() => import("@/components/admin-booking-manager").then(mod => ({ default: mod.AdminBookingManager })));
const AdminLessonTypeManager = lazy(() => import("@/components/admin-lesson-type-manager").then(mod => ({ default: mod.AdminLessonTypeManager })));
const AdminSiteContentManager = lazy(() => import("@/components/admin-site-content-manager").then(mod => ({ default: mod.AdminSiteContentManager })));
const AdminWaiverManagement = lazy(() => import("@/components/admin-waiver-management").then(mod => ({ default: mod.AdminWaiverManagement })));
const PaymentsTab = lazy(() => import("@/components/PaymentsTab").then(mod => ({ default: mod.PaymentsTab })));
const AdminSkillsManager = lazy(() => import("@/components/admin/AdminSkillsManager"));

// Loading component
const TabLoading = () => (
  <div className="p-8 flex items-center justify-center">
    <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin h-12 w-12" />
  </div>
);

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("bookings");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window?.innerWidth >= 768);
  
  // Check authentication
  const { data: authStatus } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/status');
      return response.json();
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus && !authStatus.loggedIn) {
      setLocation('/admin-login');
    }
  }, [authStatus, setLocation]);

  // Set sidebar open state based on window size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If auth is still loading or user is not logged in, show loading
  if (!authStatus) {
    return (
      <div className="flex h-screen items-center justify-center">
        <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={async () => {
          try {
            await apiRequest('GET', '/api/auth/logout');
          } catch {}
          setLocation('/admin-login');
        }}
      />

      <SEOHead
        title="Admin Dashboard — Coach Will Tumbles"
        description="Admin dashboard."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/admin` : 'https://www.coachwilltumbles.com/admin'}
        robots="noindex,follow"
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebPage' }}
      />
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white p-4 border-b sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <TabsList>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="lesson-types">Lesson Types</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="waivers">Waivers</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="bookings" className="p-4">
            <Suspense fallback={<TabLoading />}>
              <AdminBookingManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="lesson-types" className="p-4">
            <Suspense fallback={<TabLoading />}>
              <AdminLessonTypeManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="skills" className="p-4">
            <Suspense fallback={<TabLoading />}>
              <AdminSkillsManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="content" className="p-4">
            <Suspense fallback={<TabLoading />}>
              <AdminSiteContentManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="waivers" className="p-4">
            <Suspense fallback={<TabLoading />}>
              <AdminWaiverManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="payments" className="p-4">
            <Suspense fallback={<TabLoading />}>
              <PaymentsTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
