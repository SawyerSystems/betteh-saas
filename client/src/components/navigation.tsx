import { useState, useEffect, memo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Baby, Lock, User, UserCircle, LogOut } from "lucide-react";
import { useAuthStatus, useParentAuthStatus, usePrefetchQueries } from "@/hooks/optimized-queries";
import { apiRequest, queryClient, queryKeys } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Import logo assets for fallback
import defaultLogoSpin from "/CWT_Circle_LogoSPIN.png";
import defaultLogoText from "/assets/CoachWillTumblesText.png";

export const Navigation = memo(function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { actualTheme } = useTheme();
  
  // Use optimized auth hooks
  const { data: adminAuth } = useAuthStatus();
  const { data: parentAuth } = useParentAuthStatus();
  const { prefetchBlogPosts, prefetchTips, prefetchStripeProducts } = usePrefetchQueries();
  
  // Fetch site content for logo
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      return response.json();
    },
  });

  const logoSpin = siteContent?.logo?.circle || defaultLogoSpin;
  const logoText = siteContent?.logo?.text || defaultLogoText;
  
  const isAdminLoggedIn = (adminAuth as any)?.loggedIn || false;
  const isParentLoggedIn = (parentAuth as any)?.loggedIn || false;

  // Prefetch critical resources on hover for better UX
  const handleNavHover = useCallback((page: string) => {
    switch (page) {
      case 'blog':
        prefetchBlogPosts();
        break;
      case 'tips':
        prefetchTips();
        break;
      case 'booking':
        prefetchStripeProducts();
        break;
    }
  }, [prefetchBlogPosts, prefetchTips, prefetchStripeProducts]);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/booking", label: "Booking" },
  { href: "/features", label: "Features" },
    { href: "/blog", label: "Blog" },
    { href: "/tips", label: "Tips" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const handleAdminAction = () => {
    if (isAdminLoggedIn) {
      // If logged in, go to admin dashboard
      window.location.href = "/admin";
    } else {
      // If not logged in, go to login page
      window.location.href = "/admin";
    }
  };

  const handleParentAction = () => {
    if (isParentLoggedIn) {
      // If logged in, go to parent dashboard
      window.location.href = "/parent-dashboard";
    } else {
      // If not logged in, go to login page
      window.location.href = "/parent/login";
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      if (isAdminLoggedIn) {
        await apiRequest("GET", "/api/auth/logout");
        // Invalidate auth queries to refresh status
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.status() });
        window.location.href = "/admin";
      } else if (isParentLoggedIn) {
        await apiRequest("POST", "/api/parent-auth/logout");
        // Invalidate parent auth queries to refresh status
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.parentStatus() });
        window.location.href = "/parent/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [isAdminLoggedIn, isParentLoggedIn]);

  return (
  <header className="sticky top-0 z-50 w-full border-b-4 border-[#D8BD2A] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg dark:bg-slate-900/80">
  <div className="container mx-auto flex h-20 md:h-20 items-center justify-between px-4 py-4 md:px-6 md:py-0">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer relative flex-shrink-0">
            <div className="w-14 h-14 animate-logo-spin flex-shrink-0">
              <img 
                src={logoSpin} 
                alt="Coach Will Tumbles Logo" 
                className="w-full h-full object-contain flex-shrink-0"
              />
            </div>
            {/* Hidden text for SEO but visually replaced with PNG */}
            <span className="sr-only">Coach Will Tumbles</span>
            <div className="h-12 flex-shrink-0">
              <img 
                src={logoText} 
                alt="Coach Will Tumbles" 
                className="h-full object-contain flex-shrink-0"
              />
            </div>
          </div>
        </Link>

    {/* Desktop Navigation - Hide on smaller screens to prevent tablet horizontal scrolling */}
  <nav className="hidden lg:flex items-center space-x-3 xl:space-x-6 ml-4 xl:ml-16 min-w-0 flex-shrink">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`text-[#0F0276] dark:text-[#D8BD2A] hover:text-[#E10B0B] transition-colors duration-200 font-semibold cursor-pointer athletic-title text-sm md:text-base xl:text-lg ${
                  isActive(item.href) ? "text-[#E10B0B] dark:text-[#D8BD2A] font-bold" : ""
                }`}
                onMouseEnter={() => {
                  // Prefetch resources on hover for better UX
                  const page = item.href.replace('/', '') || 'home';
                  handleNavHover(page);
                }}
              >
                {item.label}
              </span>
            </Link>
          ))}
          <div className="flex items-center space-x-3">
            <Link href="/booking">
              <Button className="btn-athletic-red text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transform transition-all duration-300 shadow-lg animate-glow">
                BOOK NOW
              </Button>
            </Link>
            
            {/* Dynamic buttons based on login state */}
            {isAdminLoggedIn || isParentLoggedIn ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 border-red-300 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden xl:inline">Logout</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleAdminAction}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 border-[#0F0276] hover:bg-[#0F0276] hover:text-white text-[#0F0276] transition-all duration-200 font-semibold athletic-title"
                >
                  <Lock className="h-3 w-3" />
                  <span className="hidden xl:inline">ADMIN</span>
                </Button>
                <Button
                  onClick={handleParentAction}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 border-[#D8BD2A] hover:bg-[#D8BD2A] hover:text-black text-[#D8BD2A] transition-all duration-200 font-semibold athletic-title"
                >
                  <UserCircle className="h-3 w-3" />
                  <span className="hidden xl:inline">PORTAL</span>
                </Button>
              </>
            )}
            
            {/* Dashboard button for logged in users */}
            {(isAdminLoggedIn || isParentLoggedIn) && (
              <Button
                onClick={isAdminLoggedIn ? handleAdminAction : handleParentAction}
                variant="default"
                size="sm"
                className={`flex items-center space-x-1 transition-all duration-200 ${
                  isAdminLoggedIn 
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <User className="h-3 w-3" />
                <span className="hidden xl:inline">Dashboard</span>
              </Button>
            )}

            {/* Theme Toggle - Positioned after dashboard buttons */}
            <div className="hidden md:inline-flex">
              <ThemeToggle />
            </div>
          </div>
        </nav>

  {/* Tablet Navigation - Simplified for medium screens */}
  <nav className="hidden md:flex lg:hidden items-center space-x-3 ml-2 md:ml-6 min-w-0">
          {/* Theme toggle for tablet */}
          <ThemeToggle />
          <Link href="/booking">
            <Button className="coach-will-gradient text-white px-4 py-2 rounded-full font-medium hover:scale-105 transform transition-all duration-200 shadow-lg">
              Book Now
            </Button>
          </Link>
          
          {/* Simplified buttons for tablet */}
          {isAdminLoggedIn || isParentLoggedIn ? (
            <>
              <Button
                onClick={isAdminLoggedIn ? handleAdminAction : handleParentAction}
                variant="default"
                size="sm"
                className={`flex items-center space-x-1 transition-all duration-200 ${
                  isAdminLoggedIn 
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <User className="h-3 w-3" />
                <span>Dashboard</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 border-red-300 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleAdminAction}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <Lock className="h-3 w-3" />
                <span>Admin</span>
              </Button>
              <Button
                onClick={handleParentAction}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 border-purple-300 hover:bg-purple-50 transition-all duration-200"
              >
                <UserCircle className="h-3 w-3" />
                <span>Parent</span>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden glass-button text-slate-900 dark:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          {/* Full-height sheet with scrollable content and sticky footer */}
          <SheetContent side="right" className="w-[300px] sm:w-[380px] p-0 flex h-full flex-col overflow-hidden">
            {/* Header / Theme toggle */}
            <div className="flex items-center justify-between px-3 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[0.9rem] font-medium text-slate-900 dark:text-slate-100 leading-tight">Theme</span>
              <ThemeToggle />
            </div>

            {/* Non-scrollable nav list with responsive sizing */}
            <div className="flex-1">
              <nav className="flex flex-col space-y-1.5 py-3">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block px-3 py-[clamp(8px,2vh,12px)] text-[clamp(0.95rem,3.2vw,1.125rem)] leading-tight rounded-lg transition-colors duration-200 cursor-pointer min-h-[36px] flex items-center w-full ${
                        isActive(item.href)
                          ? "text-blue-600 font-semibold bg-blue-50 dark:text-[#D8BD2A] dark:bg-slate-800/60"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-[#D8BD2A] dark:hover:text-white dark:hover:bg-slate-800/40"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Sticky footer with CTAs, always accessible */}
            <div className="sticky bottom-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 p-3 space-y-2.5">
              {/* Booking Button - Always First */}
              <Link href="/booking">
                <Button 
                  className="w-full coach-will-gradient text-white px-4 py-2 text-[0.95rem] rounded-full font-medium hover:scale-[1.02] transform transition-all duration-200 shadow-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Book Now
                </Button>
              </Link>

              {/* Dashboard Button for Logged In Users */}
              {(isAdminLoggedIn || isParentLoggedIn) && (
                <Button
                  onClick={() => {
                    if (isAdminLoggedIn) handleAdminAction();
                    else handleParentAction();
                    setIsOpen(false);
                  }}
                  variant="default"
                  className={`w-full flex items-center justify-center space-x-2 py-2 text-[0.95rem] transition-all duration-200 ${
                    isAdminLoggedIn 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  <User className="h-3 w-3" />
                  <span>Dashboard</span>
                </Button>
              )}

              {/* Dynamic Login/Logout Buttons */}
              {isAdminLoggedIn || isParentLoggedIn ? (
                <Button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 py-2 text-[0.95rem] border-red-300 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Logout</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      handleAdminAction();
                      setIsOpen(false);
                    }}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 py-2 text-[0.95rem] border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Admin Login</span>
                  </Button>
                  <Button
                    onClick={() => {
                      handleParentAction();
                      setIsOpen(false);
                    }}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 py-2 text-[0.95rem] border-purple-300 hover:bg-purple-50 transition-all duration-200"
                  >
                    <UserCircle className="h-3 w-3" />
                    <span>Parent Portal</span>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
});
