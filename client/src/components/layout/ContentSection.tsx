/**
 * ContentSection Component
 * 
 * Re  subtle: 'bg-gray-50/30 dark:bg-gray-800/20',
  contrast: 'bg-white dark:bg-gray-800'able content section for pages with consistent spacing
 * and responsive layout. Matches homepage styling patterns.
 */

import React from 'react';

interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  containerSize?: 'full' | 'large' | 'medium' | 'small';
  spacing?: 'none' | 'small' | 'default' | 'large';
  background?: 'transparent' | 'subtle' | 'contrast';
}

export function ContentSection({
  children,
  className = '',
  containerSize = 'large',
  spacing = 'default',
  background = 'transparent'
}: ContentSectionProps) {
  
  const containerClasses = {
    full: 'w-full',
    large: 'container mx-auto px-4',
    medium: 'container mx-auto px-4 max-w-4xl',
    small: 'container mx-auto px-4 max-w-2xl'
  };

  const spacingClasses = {
    none: 'py-0',
    small: 'py-8',
    default: 'py-12 lg:py-16',
    large: 'py-16 lg:py-24'
  };

  const backgroundClasses = {
    transparent: '',
    subtle: 'bg-slate-50/30 dark:bg-slate-800/20',
    contrast: 'bg-white dark:bg-slate-800'
  };

  return (
    <section className={`${spacingClasses[spacing]} ${backgroundClasses[background]} ${className}`}>
      <div className={containerClasses[containerSize]}>
        {children}
      </div>
    </section>
  );
}

export default ContentSection;
