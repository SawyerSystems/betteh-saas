/**
 * PageLayout Component
 * 
 * Provides consistent page structure and background gradients
 * used across all public pages, matching the homepage styling.
 */

import React from 'react';
import { Footer } from "@/components/Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'hero' | 'minimal';
  className?: string;
}

export function PageLayout({ 
  children, 
  variant = 'default',
  className = '' 
}: PageLayoutProps) {
  const baseClasses = "min-h-screen theme-smooth";
  
  const backgroundClasses = {
    default: "bg-white dark:bg-gray-900",
    hero: "bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black",
    minimal: "bg-white dark:bg-gray-900"
  };

  return (
    <div className={`${baseClasses} ${backgroundClasses[variant]} ${className}`}>
      {children}
      <Footer />
    </div>
  );
}

export default PageLayout;
