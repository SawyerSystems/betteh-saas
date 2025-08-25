/**
 * FeatureCard Component
 * 
 * Reusable card component matching the homepage card styling
 * with glassmorphism effects and hover animations.
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'minimal';
  iconColor?: 'black' | 'gray' | 'green';
  className?: string;
}

const iconColorClasses = {
  black: 'bg-black',
  gray: 'bg-gray-600',
  green: 'bg-green-600'
};

const textColorClasses = {
  black: 'text-white',
  gray: 'text-gray-300',
  green: 'text-green-300'
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
  variant = 'default',
  iconColor,
  className = ''
}: FeatureCardProps) {
  
  const variantClasses = {
    default: "border border-gray-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-800/90 shadow-lg hover:shadow-xl",
    highlight: "border border-gray-200/60 bg-gray-50/70 supports-[backdrop-filter]:bg-gray-50/40 backdrop-blur-md dark:border-white/60 dark:bg-white/20 shadow-lg hover:shadow-xl",
    minimal: "border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm hover:shadow-md"
  };

  return (
    <Card className={`${variantClasses[variant]} transition-all duration-300 group ${className}`}>
      <CardContent className="p-6">
        {Icon && (
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${iconColor ? iconColorClasses[iconColor] : 'bg-gray-100 dark:bg-white/20'} ${iconColor ? '' : 'border border-gray-200/60 dark:border-white/40'} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${iconColor ? 'text-white' : 'text-black dark:text-white'}`} />
          </div>
        )}
        
        <h3 className={`text-xl font-bold ${iconColor ? `text-gray-900 dark:${textColorClasses[iconColor]}` : 'text-gray-900 dark:text-gray-100'} mb-3`}>
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
        
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FeatureCard;
