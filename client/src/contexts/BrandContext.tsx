/**
 * Betteh Branding Context
 * 
 * React context for managing tenant-aware branding throughout the application.
 * This provides theme-aware logo selection and brand colors.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  TenantBrand, 
  BettehBrand,
  DEFAULT_BETTEH_BRAND, 
  LEGACY_COACH_WILL_TENANT,
  getTenantBrand,
  getBrandLogo,
  getBrandColor 
} from '@shared/branding/brand';

interface BrandContextType {
  // Current brand configuration
  brand: TenantBrand;
  
  // Convenience methods
  getLogo: (type: 'circle' | 'text') => string;
  getColor: (context: 'primary' | 'secondary' | 'background' | 'text') => string;
  
  // Tenant management
  setTenant: (tenantId: string, tenantData?: Partial<TenantBrand>) => void;
  isLegacyTenant: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
  initialTenantId?: string;
}

export function BrandProvider({ 
  children, 
  initialTenantId = "00000000-0000-0000-0000-000000000001", // Legacy Coach Will
}: BrandProviderProps) {
  const { actualTheme } = useTheme(); // Get the actual theme from ThemeContext
  const [brand, setBrand] = useState<TenantBrand>(() => 
    getTenantBrand(initialTenantId)
  );

  // Set tenant and update branding
  const setTenant = (tenantId: string, tenantData?: Partial<TenantBrand>) => {
    const newBrand = getTenantBrand(tenantId, tenantData);
    setBrand(newBrand);
  };

  // Convenience methods that use the actual theme from ThemeContext
  const getLogo = (type: 'circle' | 'text') => getBrandLogo(brand, type, actualTheme);
  const getColor = (context: 'primary' | 'secondary' | 'background' | 'text') => 
    getBrandColor(brand, context, actualTheme);

  const isLegacyTenant = brand.tenantId === "00000000-0000-0000-0000-000000000001";

  const value: BrandContextType = {
    brand,
    getLogo,
    getColor,
    setTenant,
    isLegacyTenant
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

// Hook to use brand context
export function useBrand(): BrandContextType {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

// Hook for logo URLs
export function useBrandLogo(type: 'circle' | 'text' = 'circle') {
  const { getLogo } = useBrand();
  return getLogo(type);
}

// Hook for brand colors
export function useBrandColor(context: 'primary' | 'secondary' | 'background' | 'text') {
  const { getColor } = useBrand();
  return getColor(context);
}

// Component for displaying logos with automatic theme selection
interface BrandLogoProps {
  type?: 'circle' | 'text';
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function BrandLogo({ 
  type = 'circle', 
  alt, 
  className = "",
  width,
  height 
}: BrandLogoProps) {
  const { getLogo, brand } = useBrand();
  const logoUrl = getLogo(type);
  
  const defaultAlt = type === 'circle' 
    ? `${brand.platformName} Logo`
    : `${brand.platformName} Text Logo`;

  return (
    <img 
      src={logoUrl}
      alt={alt || defaultAlt}
      className={className}
      width={width}
      height={height}
    />
  );
}

// Component for brand text (business name, coach name, etc.)
interface BrandTextProps {
  variant: 'platform' | 'tenant' | 'coach' | 'business';
  className?: string;
}

export function BrandText({ variant, className = "" }: BrandTextProps) {
  const { brand } = useBrand();
  
  const getText = () => {
    switch (variant) {
      case 'platform':
        return brand.platformName;
      case 'tenant':
        return brand.tenantName;
      case 'coach':
        return brand.coachName || brand.tenantName;
      case 'business':
        return brand.businessName || brand.tenantName;
      default:
        return brand.platformName;
    }
  };

  return (
    <span className={className}>
      {getText()}
    </span>
  );
}
