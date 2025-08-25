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
import { useBrand, BrandLogo } from "@/contexts/BrandContext";

export const Navigation = memo(function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { actualTheme } = useTheme();
  const brand = useBrand();
  
  // Use optimized auth hooks
  const { data: adminAuth } = useAuthStatus();
  const { data: parentAuth } = useParentAuthStatus();
  const { prefetchBlogPosts, prefetchTips, prefetchStripeProducts } = usePrefetchQueries();
  
  // Fetch site content for additional customization
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      return response.json();
    },
  });
  
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
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <div className="w-20 h-20 flex-shrink-0 hidden">
              <BrandLogo 
                type="circle"
                alt={`${brand.businessName} Logo`}
                className="w-full h-full object-contain flex-shrink-0"
              />
            </div>
            {/* Text logo - VEED.io style */}
            <div className="flex-shrink-0">
              <BrandLogo 
                type="text"
                alt={brand.businessName}
                className="h-8 object-contain flex-shrink-0"
              />
            </div>
          </div>
        </Link>

        {/* Desktop Navigation - VEED.io style */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`font-sunborn text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 cursor-pointer text-sm font-medium ${
                  isActive(item.href) ? "text-gray-900 dark:text-white font-semibold" : ""
                }`}
                onMouseEnter={() => {
                  const page = item.href.replace('/', '') || 'home';
                  handleNavHover(page);
                }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Right side actions - VEED.io style */}
        <div className="hidden lg:flex items-center space-x-3">
          {isAdminLoggedIn || isParentLoggedIn ? (
            <>
              {/* Dashboard button for logged in users */}
              <Button
                onClick={isAdminLoggedIn ? handleAdminAction : handleParentAction}
                variant="ghost"
                size="sm"
                className="font-sunborn text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="font-sunborn text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleAdminAction}
                variant="ghost"
                size="sm"
                className="font-sunborn text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Login
              </Button>
              <Button
                onClick={handleParentAction}
                className="bg-black hover:bg-gray-800 text-white font-sunborn font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-200"
              >
                Get Started
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-white dark:bg-black">
              <div className="flex flex-col h-full bg-white dark:bg-black">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
                  <span className="font-sunborn font-semibold text-gray-900 dark:text-white">Menu</span>
                  <ThemeToggle />
                </div>

                {/* Navigation links */}
                <div className="flex-1 py-6 bg-white dark:bg-black">
                  <nav className="space-y-1 px-6">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <span
                          className={`block py-3 px-4 rounded-lg font-sunborn text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200 cursor-pointer ${
                            isActive(item.href) ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold" : ""
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Footer actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black space-y-3">
                  {isAdminLoggedIn || isParentLoggedIn ? (
                    <>
                      <Button
                        onClick={() => {
                          isAdminLoggedIn ? handleAdminAction() : handleParentAction();
                          setIsOpen(false);
                        }}
                        className="w-full font-sunborn"
                        variant="outline"
                      >
                        Dashboard
                      </Button>
                      <Button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="w-full font-sunborn"
                        variant="ghost"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          handleAdminAction();
                          setIsOpen(false);
                        }}
                        className="w-full font-sunborn"
                        variant="ghost"
                      >
                        Login
                      </Button>
                      <Button
                        onClick={() => {
                          handleParentAction();
                          setIsOpen(false);
                        }}
                        className="w-full bg-black hover:bg-gray-800 text-white font-sunborn"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
});
