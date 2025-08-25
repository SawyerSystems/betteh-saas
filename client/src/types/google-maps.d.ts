/**
 * Google Maps JavaScript API Type Declarations
 * Minimal type definitions for Google Places API functionality
 */

export interface GoogleMapsAutocompleteOptions {
  bounds?: any;
  componentRestrictions?: {
    country?: string | string[];
  };
  fields?: string[];
  strictBounds?: boolean;
  types?: string[];
}

export interface GooglePlaceResult {
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address?: string;
  geometry?: {
    location: any;
    viewport: any;
  };
  name?: string;
  place_id?: string;
  types?: string[];
}

export interface GoogleAutocomplete {
  addListener(eventName: string, handler: () => void): void;
  getPlace(): GooglePlaceResult;
  setBounds(bounds: any): void;
  setComponentRestrictions(restrictions: { country: string | string[] }): void;
  setTypes(types: string[]): void;
}

declare namespace google {
  namespace maps {
    namespace places {
      interface AutocompleteOptions extends GoogleMapsAutocompleteOptions {}
      interface PlaceResult extends GooglePlaceResult {}
      
      class Autocomplete implements GoogleAutocomplete {
        constructor(
          inputField: HTMLInputElement,
          opts?: AutocompleteOptions
        );
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
        setBounds(bounds: any): void;
        setComponentRestrictions(restrictions: { country: string | string[] }): void;
        setTypes(types: string[]): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLElement | google.maps.Map);
        textSearch(
          request: any,
          callback: (results: PlaceResult[], status: any) => void
        ): void;
      }
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      contains(latLng: LatLng): boolean;
      extend(point: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: any);
    }
  }
}

// Extend Window interface to include Google Maps API loading states
declare global {
  interface Window {
    google?: typeof google;
    googlePlacesApiLoaded?: boolean;
    googlePlacesApiLoading?: boolean;
    initGooglePlaces?: () => void;
  }
}

export {};
