/**
 * AddressAutocompleteInput Component
 * Reusable address input with Google Places autocomplete functionality
 */

import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddressAutocomplete, type AddressComponents } from '@/hooks/use-address-autocomplete';
import type { GoogleMapsAutocompleteOptions } from '@/types/google-maps';
import { cn } from '@/lib/utils';

export interface AddressAutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Address autocomplete specific props
  onPlaceSelected: (addressComponents: Partial<AddressComponents>) => void;
  onManualInput?: (value: string) => void;
  autocompleteOptions?: Partial<GoogleMapsAutocompleteOptions>;
  enableAutocomplete?: boolean;
  
  // UI props
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperTextClassName?: string;
  
  // Loading states
  showLoadingState?: boolean;
  loadingText?: string;
}

export const AddressAutocompleteInput = forwardRef<HTMLInputElement, AddressAutocompleteInputProps>(
  (
    {
      onPlaceSelected,
      onManualInput,
      autocompleteOptions,
      enableAutocomplete = true,
      label,
      error,
      helperText,
      containerClassName,
      labelClassName,
      inputClassName,
      errorClassName,
      helperTextClassName,
      showLoadingState = true,
      loadingText = 'Loading address suggestions...',
      className,
      ...inputProps
    },
    externalRef
  ) => {
    const {
      inputRef,
      isLoaded,
      isLoading,
      error: autocompleteError,
      isAutocompleteActive,
    } = useAddressAutocomplete({
      onPlaceSelected,
      onManualInput,
      autocompleteOptions,
      enabled: enableAutocomplete,
    });

    // Combine external ref with internal ref
    React.useEffect(() => {
      if (externalRef) {
        if (typeof externalRef === 'function') {
          externalRef(inputRef.current);
        } else {
          externalRef.current = inputRef.current;
        }
      }
    }, [externalRef]);

    const hasError = !!(error || autocompleteError);
    const isLoadingState = enableAutocomplete && isLoading && showLoadingState;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <Label 
            htmlFor={inputProps.id} 
            className={cn(
              'text-sm font-medium',
              hasError && 'text-red-600 dark:text-red-400',
              labelClassName
            )}
          >
            {label}
            {isLoadingState && (
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                {loadingText}
              </span>
            )}
          </Label>
        )}

        {/* Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            className={cn(
              'transition-colors duration-200',
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              isAutocompleteActive && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              isLoadingState && 'pr-10',
              className,
              inputClassName
            )}
            autoComplete="off"
            {...inputProps}
          />
          
          {/* Loading indicator */}
          {isLoadingState && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
            </div>
          )}
          
          {/* Autocomplete active indicator */}
          {enableAutocomplete && isLoaded && isAutocompleteActive && !isLoadingState && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p className={cn(
            'text-sm text-red-600 dark:text-red-400',
            errorClassName
          )}>
            {error || autocompleteError}
          </p>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <p className={cn(
            'text-sm text-slate-600 dark:text-slate-400',
            helperTextClassName
          )}>
            {helperText}
          </p>
        )}

        {/* Autocomplete status */}
        {enableAutocomplete && !isLoaded && !isLoading && !autocompleteError && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Address suggestions unavailable
          </p>
        )}
      </div>
    );
  }
);

AddressAutocompleteInput.displayName = 'AddressAutocompleteInput';

export default AddressAutocompleteInput;
