/**
 * Betteh Branding System
 * 
 * Centralized branding configuration for the multi-tenant SaaS platform.
 * This replaces all hardcoded "Coach Will Tumbles" references with dynamic
 * tenant-aware branding.
 * 
 * Created: 2025-08-24
 * Migration: Phase 3 - Branding System
 */

export interface BettehBrand {
  // Platform Branding
  platformName: string;
  platformTagline: string;
  
  // Logo Assets (relative to /client/public/assets/)
  logos: {
    // Main circular logo
    circle: {
      light: string; // For light backgrounds
      dark: string;  // For dark backgrounds
    };
    
    // Text logo
    text: {
      light: string; // For light backgrounds  
      dark: string;  // For dark backgrounds
    };
  };
  
  // Brand Colors
  colors: {
    primary: string;    // Main brand color
    secondary: string;  // Secondary brand color
    background: {
      light: string;    // Light theme main background
      dark: string;     // Dark theme main background
      // Section backgrounds
      sections: {
        primary: string;    // Primary section background (light theme)
        primaryDark: string; // Primary section background (dark theme)
        secondary: string;   // Secondary section background (light theme)
        secondaryDark: string; // Secondary section background (dark theme)
        accent: string;      // Accent section background (light theme)
        accentDark: string;  // Accent section background (dark theme)
      };
      // Card backgrounds
      cards: {
        primary: string;     // Primary card background (light theme)
        primaryDark: string; // Primary card background (dark theme)
        hover: string;       // Card hover background (light theme)
        hoverDark: string;   // Card hover background (dark theme)
      };
    };
    text: {
      light: string;    // Text on light backgrounds
      dark: string;     // Text on dark backgrounds
      muted: string;    // Muted text on light backgrounds
      mutedDark: string; // Muted text on dark backgrounds
    };
    borders: {
      light: string;    // Border color for light theme
      dark: string;     // Border color for dark theme
    };
  };
  
  // Contact Information (Platform Level)
  contact: {
    supportEmail: string;
    website?: string;
  };
}

export interface TenantBrand extends BettehBrand {
  // Tenant-Specific Overrides
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  
  // Coach/Tenant Specific
  coachName?: string;
  businessName?: string;
  customColors?: Partial<BettehBrand['colors']>;
  customLogos?: Partial<BettehBrand['logos']>;
  
  // Tenant Contact Info
  contact: {
    email: string;
    phone?: string;
    address?: string;
    website?: string;
    supportEmail: string; // Platform support
  };
}

// Default Betteh Platform Branding
export const DEFAULT_BETTEH_BRAND: BettehBrand = {
  platformName: "Betteh",
  platformTagline: "Empowering Gymnastics Coaches Everywhere",
  
  logos: {
    circle: {
      light: "/assets/betteh_logo_black_font.png",  // Black logo for light backgrounds
      dark: "/assets/betteh_logo_white_font.png"    // White logo for dark backgrounds
    },
    text: {
      light: "/assets/betteh_textlogo_black_font.png", // Black text for light backgrounds
      dark: "/assets/betteh_textlogo_white_font.png"   // White text for dark backgrounds
    }
  },
  
  colors: {
    primary: "#000000",      // Black
    secondary: "#f1f5f9",    // Pure light gray (not yellowish)
    background: {
      light: "#ffffff",      // White background for light theme
      dark: "#111827",       // Dark grey background (gray-900) for dark theme
      // Section backgrounds
      sections: {
        primary: "#ffffff",    // White sections (bg-white)
        primaryDark: "#111827", // Dark sections (dark:bg-gray-900)
        secondary: "#f9fafb",  // Light gray sections (bg-gray-50)
        secondaryDark: "#1f2937", // Darker gray sections (dark:bg-gray-800)
        accent: "#000000",     // Black accent sections (bg-black)
        accentDark: "#000000", // Black accent sections (same for dark mode)
      },
      // Card backgrounds
      cards: {
        primary: "#ffffff",     // White cards (bg-white)
        primaryDark: "#1f2937", // Dark cards (dark:bg-gray-800)
        hover: "#f9fafb",       // Light hover state (hover:bg-gray-50)
        hoverDark: "#374151",   // Dark hover state (hover:dark:bg-gray-700)
      },
    },
    text: {
      light: "#000000",      // Black text on light backgrounds
      dark: "#ffffff",       // White text on dark backgrounds
      muted: "#6b7280",      // Gray text on light backgrounds
      mutedDark: "#9ca3af",  // Light gray text on dark backgrounds
    },
    borders: {
      light: "#e2e8f0",      // Light gray borders (border-gray-200) - pure gray, not yellowish
      dark: "#374151",       // Dark gray borders (dark:border-gray-700)
    },
  },
  
  contact: {
    supportEmail: "support@betteh.app",
    website: "https://betteh.app"
  }
};

// Legacy Coach Will Tenant (for migration compatibility)
export const LEGACY_COACH_WILL_TENANT: TenantBrand = {
  ...DEFAULT_BETTEH_BRAND,
  tenantId: "00000000-0000-0000-0000-000000000001",
  tenantName: "Coach Will Tumbles",
  tenantSlug: "coach-will",
  coachName: "Coach Will",
  businessName: "Coach Will Tumbles",
  
  contact: {
    email: "admin@coachwilltumbles.com",
    phone: "(585) 755-8122",
    address: "Oceanside, CA",
    website: "https://coachwilltumbles.com",
    supportEmail: "support@betteh.app"
  }
};

/**
 * Get brand configuration for a specific tenant
 * @param tenantId - The tenant ID to get branding for
 * @param tenantData - Optional tenant data to override defaults
 * @returns TenantBrand configuration
 */
export function getTenantBrand(
  tenantId: string, 
  tenantData?: Partial<TenantBrand>
): TenantBrand {
  // For now, return legacy coach will for the default tenant
  if (tenantId === "00000000-0000-0000-0000-000000000001") {
    return {
      ...LEGACY_COACH_WILL_TENANT,
      ...tenantData
    };
  }
  
  // For new tenants, use default Betteh branding with tenant overrides
  return {
    ...DEFAULT_BETTEH_BRAND,
    tenantId,
    tenantName: tenantData?.tenantName || "Gymnastics Coach",
    tenantSlug: tenantData?.tenantSlug || "coach",
    coachName: tenantData?.coachName || "Coach",
    businessName: tenantData?.businessName || "Gymnastics Training",
    contact: {
      ...DEFAULT_BETTEH_BRAND.contact,
      email: tenantData?.contact?.email || "coach@example.com",
      phone: tenantData?.contact?.phone,
      address: tenantData?.contact?.address,
      website: tenantData?.contact?.website,
      supportEmail: DEFAULT_BETTEH_BRAND.contact.supportEmail
    },
    ...tenantData
  };
}

/**
 * Get logo URL based on theme
 * @param brand - Brand configuration
 * @param type - Logo type ('circle' | 'text')
 * @param theme - Theme ('light' | 'dark')
 * @returns Logo URL
 */
export function getBrandLogo(
  brand: BettehBrand | TenantBrand, 
  type: 'circle' | 'text', 
  theme: 'light' | 'dark' = 'light'
): string {
  return brand.logos[type][theme];
}

/**
 * Get brand color based on context
 * @param brand - Brand configuration
 * @param context - Color context
 * @param variant - Color variant (for nested contexts)
 * @param theme - Theme ('light' | 'dark')
 * @returns Color hex value
 */
export function getBrandColor(
  brand: BettehBrand | TenantBrand,
  context: 'primary' | 'secondary' | 'background' | 'text' | 'borders',
  variant?: string,
  theme: 'light' | 'dark' = 'light'
): string {
  if (context === 'background') {
    if (variant) {
      // Handle nested background variants
      const bgVariants = brand.colors.background as any;
      if (variant === 'sections') {
        return theme === 'dark' ? bgVariants.sections.primaryDark : bgVariants.sections.primary;
      }
      if (variant === 'sectionsSecondary') {
        return theme === 'dark' ? bgVariants.sections.secondaryDark : bgVariants.sections.secondary;
      }
      if (variant === 'sectionsAccent') {
        return theme === 'dark' ? bgVariants.sections.accentDark : bgVariants.sections.accent;
      }
      if (variant === 'cards') {
        return theme === 'dark' ? bgVariants.cards.primaryDark : bgVariants.cards.primary;
      }
      if (variant === 'cardsHover') {
        return theme === 'dark' ? bgVariants.cards.hoverDark : bgVariants.cards.hover;
      }
    }
    return brand.colors.background[theme];
  }
  
  if (context === 'text') {
    if (variant === 'muted') {
      return theme === 'dark' ? brand.colors.text.mutedDark : brand.colors.text.muted;
    }
    return brand.colors.text[theme];
  }
  
  if (context === 'borders') {
    return brand.colors.borders[theme];
  }
  
  return brand.colors[context];
}

// Legacy asset mapping for migration
export const LEGACY_ASSET_MAPPING = {
  // Old Coach Will assets → New Betteh assets
  "/assets/CWT_Circle_LogoSPIN.png": "/assets/betteh_logo_black_font.png",
  "/assets/CoachWillTumblesText.png": "/assets/betteh_textlogo_black_font.png",
  "/CWT_Circle_LogoSPIN.png": "/assets/betteh_logo_black_font.png",
  
  // Email template assets
  "CWT_Circle_LogoSPIN.png": "betteh_logo_black_font.png",
  "CoachWillTumblesText.png": "betteh_textlogo_black_font.png"
} as const;

/**
 * Map legacy asset paths to new Betteh assets
 * @param legacyPath - Old asset path
 * @param theme - Theme context for logo selection
 * @returns New asset path
 */
export function mapLegacyAsset(legacyPath: string, theme: 'light' | 'dark' = 'light'): string {
  const mapped = LEGACY_ASSET_MAPPING[legacyPath as keyof typeof LEGACY_ASSET_MAPPING];
  if (mapped) {
    // If it's a logo and theme is dark, switch to white version
    if (theme === 'dark') {
      return mapped
        .replace('_black_font.png', '_white_font.png')
        .replace('betteh_logo_black', 'betteh_logo_white')
        .replace('betteh_textlogo_black', 'betteh_textlogo_white');
    }
    return mapped;
  }
  return legacyPath;
}

// Legacy brandConfig export for backward compatibility
export const brandConfig = LEGACY_COACH_WILL_TENANT;

export default {
  DEFAULT_BETTEH_BRAND,
  LEGACY_COACH_WILL_TENANT,
  getTenantBrand,
  getBrandLogo,
  getBrandColor,
  mapLegacyAsset,
  LEGACY_ASSET_MAPPING
};
