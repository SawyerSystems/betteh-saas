import { DEFAULT_BETTEH_BRAND, type BettehBrand, getBrandColor } from '@shared/branding/brand';

/**
 * Hook to get current brand configuration
 * In the future this will be tenant-aware, but for now returns the default Betteh brand
 */
export function useBrand(): BettehBrand {
  // TODO: Make this tenant-aware when multi-tenancy is implemented
  return DEFAULT_BETTEH_BRAND;
}

/**
 * Get logo URL for current brand and theme
 */
export function useBrandLogo(type: 'circle' | 'text' = 'circle', theme: 'light' | 'dark' = 'light'): string {
  const brand = useBrand();
  return brand.logos[type][theme];
}

/**
 * Get brand color for current context
 */
export function useBrandColor(
  context: 'primary' | 'secondary' | 'background' | 'text' | 'borders',
  variant?: string,
  theme: 'light' | 'dark' = 'light'
): string {
  const brand = useBrand();
  return getBrandColor(brand, context, variant, theme);
}

/**
 * Get all background colors for easy access
 */
export function useBrandBackgrounds() {
  const brand = useBrand();
  return {
    // Main backgrounds
    primary: getBrandColor(brand, 'background', undefined, 'light'),
    primaryDark: getBrandColor(brand, 'background', undefined, 'dark'),
    
    // Section backgrounds
    sections: getBrandColor(brand, 'background', 'sections', 'light'),
    sectionsDark: getBrandColor(brand, 'background', 'sections', 'dark'),
    sectionsSecondary: getBrandColor(brand, 'background', 'sectionsSecondary', 'light'),
    sectionsSecondaryDark: getBrandColor(brand, 'background', 'sectionsSecondary', 'dark'),
    sectionsAccent: getBrandColor(brand, 'background', 'sectionsAccent', 'light'),
    sectionsAccentDark: getBrandColor(brand, 'background', 'sectionsAccent', 'dark'),
    
    // Card backgrounds
    cards: getBrandColor(brand, 'background', 'cards', 'light'),
    cardsDark: getBrandColor(brand, 'background', 'cards', 'dark'),
    cardsHover: getBrandColor(brand, 'background', 'cardsHover', 'light'),
    cardsHoverDark: getBrandColor(brand, 'background', 'cardsHover', 'dark'),
  };
}
