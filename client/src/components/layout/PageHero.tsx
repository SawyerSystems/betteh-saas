/**
 * PageHero Component
 * 
 * Reusable hero section for public pages with consistent styling
 * matching the homepage. Supports different layouts and content types.
 */

import React from 'react';
import { Button } from "@/components/ui/button";

interface PageHeroProps {
  title: string | React.ReactNode;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  backgroundVariant?: 'gradient' | 'subtle' | 'minimal';
  textAlign?: 'left' | 'center';
  size?: 'default' | 'large' | 'compact';
  actions?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  description,
  children,
  backgroundVariant = 'gradient',
  textAlign = 'left',
  size = 'default',
  actions
}: PageHeroProps) {
  
const backgroundVariants = {
  default: "bg-white dark:bg-gray-900",
  gradient: "bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800/40 dark:via-gray-900/30 dark:to-gray-900/50",
  subtle: "bg-gray-50/50 dark:bg-gray-800/20",
};  const sizeClasses = {
    default: "py-16 lg:py-24",
    large: "py-20 lg:py-32", 
    compact: "py-12 lg:py-16"
  };

  const textAlignClasses = {
    left: "text-left",
    center: "text-center"
  };

  return (
    <section className={`${sizeClasses[size]} ${backgroundClasses[backgroundVariant]}`}>
      <div className="container mx-auto px-4">
        <div className={`max-w-4xl ${textAlign === 'center' ? 'mx-auto' : ''}`}>
          <div className={textAlignClasses[textAlign]}>
            {subtitle && (
              <p className="text-sm font-semibold tracking-wide text-black dark:text-white uppercase mb-4">
                {subtitle}
              </p>
            )}
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {title}
            </h1>
            
            {description && (
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                {description}
              </p>
            )}
            
            {actions && (
              <div className="flex flex-col sm:flex-row gap-4 justify-start items-start">
                {actions}
              </div>
            )}
          </div>
          
          {children && (
            <div className="mt-12">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
