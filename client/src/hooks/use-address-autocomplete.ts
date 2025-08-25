/**
 * React Hook for Google Places Address Autocomplete
 * Provides modular, reusable address autocomplete functionality
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  loadGooglePlacesApi,
  createAddressAutocomplete,
  parseGooglePlaceResult,
  isGooglePlacesAvailable,
  type AddressComponents,
} from '@/lib/google-places';
import type { GoogleMapsAutocompleteOptions, GoogleAutocomplete } from '@/types/google-maps';

// Export the AddressComponents type for use in other components
export type { AddressComponents };

export interface UseAddressAutocompleteOptions {
  // Callback when a place is selected
  onPlaceSelected: (addressComponents: Partial<AddressComponents>) => void;
  
  // Callback when manual typing occurs (no place selected)
  onManualInput?: (value: string) => void;
  
  // Google Places API options
  autocompleteOptions?: Partial<GoogleMapsAutocompleteOptions>;
  
  // Whether to enable the autocomplete (default: true)
  enabled?: boolean;
}

export interface UseAddressAutocompleteReturn {
  // Ref to attach to the input element
  inputRef: React.RefObject<HTMLInputElement>;
  
  // Whether the Google Places API is loaded and ready
  isLoaded: boolean;
  
  // Whether the API is currently loading
  isLoading: boolean;
  
  // Any error that occurred during loading
  error: string | null;
  
  // Whether autocomplete is currently active
  isAutocompleteActive: boolean;
  
  // Manually trigger a place search (for programmatic use)
  searchPlace: (query: string) => Promise<Partial<AddressComponents> | null>;
}

export const useAddressAutocomplete = (
  options: UseAddressAutocompleteOptions
): UseAddressAutocompleteReturn => {
  const {
    onPlaceSelected,
    onManualInput,
    autocompleteOptions,
    enabled = true,
  } = options;

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  
  // Use proper React state instead of refs for reactive updates
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutocompleteActive, setIsAutocompleteActive] = useState(false);
  
  const lastValueRef = useRef<string>('');
  const placeSelectedRef = useRef(false);

  // Initialize Google Places API and autocomplete
  const initializeAutocomplete = useCallback(async () => {
    if (!enabled || !inputRef.current || isLoaded) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Load Google Places API if not already loaded
      if (!isGooglePlacesAvailable()) {
        await loadGooglePlacesApi();
      }

      // Create autocomplete instance
      if (inputRef.current && !autocompleteRef.current) {
        autocompleteRef.current = createAddressAutocomplete(
          inputRef.current,
          (addressComponents) => {
            placeSelectedRef.current = true;
            setIsAutocompleteActive(true);
            onPlaceSelected(addressComponents);
          },
          autocompleteOptions
        );

        // Set up input event listener for manual typing detection
        const input = inputRef.current;
        const handleInput = () => {
          const currentValue = input.value;
          
          // If the value changed and we didn't just select a place
          if (currentValue !== lastValueRef.current && !placeSelectedRef.current) {
            onManualInput?.(currentValue);
            setIsAutocompleteActive(false);
          }
          
          lastValueRef.current = currentValue;
          placeSelectedRef.current = false;
        };

        input.addEventListener('input', handleInput);
        
        // Clean up event listener
        return () => {
          input.removeEventListener('input', handleInput);
        };
      }

      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to load Google Places API');
      console.error('Error initializing Google Places autocomplete:', error);
    }
  }, [enabled, onPlaceSelected, onManualInput, autocompleteOptions, isLoaded]);

  // Initialize when component mounts or input ref changes
  useEffect(() => {
    if (inputRef.current && enabled) {
      initializeAutocomplete();
    }
  }, [initializeAutocomplete, enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        // Google Places API doesn't provide a direct cleanup method
        // The autocomplete will be cleaned up when the input element is removed
        autocompleteRef.current = null;
      }
    };
  }, []);

  // Manual place search function
  const searchPlace = useCallback(async (query: string): Promise<Partial<AddressComponents> | null> => {
    if (!isGooglePlacesAvailable()) {
      throw new Error('Google Places API not available');
    }

    // This is a simplified implementation
    // For a full implementation, you'd use PlacesService.textSearch or similar
    return new Promise((resolve) => {
      // For now, we'll just return null as this would require more complex implementation
      console.warn('Manual place search not yet implemented');
      resolve(null);
    });
  }, []);

  return {
    inputRef,
    isLoaded,
    isLoading,
    error,
    isAutocompleteActive,
    searchPlace,
  };
};

// Utility hook for handling address form state
export interface AddressFormState {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UseAddressFormOptions {
  initialValues?: Partial<AddressFormState>;
  onAddressChange?: (address: AddressFormState) => void;
}

export const useAddressForm = (options: UseAddressFormOptions = {}) => {
  const { initialValues = {}, onAddressChange } = options;

  const defaultAddress: AddressFormState = {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    ...initialValues,
  };

  const [address, setAddress] = useState<AddressFormState>(defaultAddress);

  const updateAddress = useCallback((updates: Partial<AddressFormState>) => {
    setAddress(prev => {
      const newAddress = { ...prev, ...updates };
      onAddressChange?.(newAddress);
      return newAddress;
    });
  }, [onAddressChange]);

  const updateFromAutocomplete = useCallback((addressComponents: Partial<AddressComponents>) => {
    updateAddress({
      addressLine1: addressComponents.addressLine1 || address.addressLine1,
      city: addressComponents.city || address.city,
      state: addressComponents.state || address.state,
      zipCode: addressComponents.zipCode || address.zipCode,
      country: addressComponents.country || address.country,
      // Keep existing addressLine2 as autocomplete doesn't provide this
    });
  }, [address.addressLine1, updateAddress]);

  const resetAddress = useCallback(() => {
    setAddress(defaultAddress);
  }, [defaultAddress]);

  return {
    address,
    updateAddress,
    updateFromAutocomplete,
    resetAddress,
  };
};
