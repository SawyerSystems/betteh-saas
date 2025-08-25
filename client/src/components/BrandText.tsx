import { useBrand } from '@/contexts/BrandContext';
import React from 'react';

interface BrandTextProps {
  type: 'businessName' | 'coachName' | 'tenantName';
  className?: string;
  children?: React.ReactNode;
}

/**
 * BrandText Component
 * 
 * Dynamically renders tenant-specific text based on the current brand configuration.
 * This replaces hardcoded text references like "Coach Will" or "Coach Will Tumbles"
 * with tenant-aware branding.
 * 
 * @param type - The type of brand text to display
 * @param className - Optional CSS classes to apply
 * @param children - Fallback content if brand text is not available
 */
export const BrandText: React.FC<BrandTextProps> = ({ 
  type, 
  className = '', 
  children 
}) => {
  const brand = useBrand();
  
  const getText = () => {
    switch (type) {
      case 'businessName':
        return brand.businessName;
      case 'coachName':
        return brand.coachName;
      case 'tenantName':
        return brand.tenantName;
      default:
        return children || brand.businessName;
    }
  };

  return (
    <span className={className}>
      {getText()}
    </span>
  );
};

export default BrandText;
