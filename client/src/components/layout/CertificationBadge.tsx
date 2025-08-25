/**
 * CertificationBadge Component
 * 
 * Displays certifications with consistent styling and icons.
 * Used on About page and can be reused across other pages.
 */

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from 'lucide-react';

interface CertificationBadgeProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  variant?: 'default' | 'green' | 'black';
  size?: 'small' | 'default' | 'large';
}

export function CertificationBadge({
  icon: Icon,
  title,
  description,
  variant = 'purple',
  size = 'default'
}: CertificationBadgeProps) {
  
const badgeVariants = {
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800/30 dark:text-gray-300',
  green: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300',
  black: 'bg-black text-white hover:bg-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};  const sizeClasses = {
    small: 'text-sm px-3 py-1',
    default: 'text-base px-4 py-2',
    large: 'text-lg px-5 py-3'
  };

  if (description) {
    // Full card layout for detailed certifications
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        {Icon && (
          <div className={`flex-shrink-0 p-2 rounded-full ${variantClasses[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    );
  }

  // Simple badge layout
  return (
    <Badge 
      className={`${variantClasses[variant]} ${sizeClasses[size]} font-medium transition-colors duration-200 flex items-center gap-2`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {title}
    </Badge>
  );
}

export default CertificationBadge;
