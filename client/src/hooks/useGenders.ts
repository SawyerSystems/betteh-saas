import { apiRequest } from '@/lib/queryClient';
import { useEffect, useState } from 'react';

export interface Gender {
  id: number;
  name: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
}

export function useGenders() {
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGenders() {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/genders');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch genders: ${response.status}`);
        }
        
        const data = await response.json();
        setGenders(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching genders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load genders');
        // Fallback to static options if API fails
        setGenders([
          { id: 1, name: "Male", display_name: "Male", is_active: true, sort_order: 1 },
          { id: 2, name: "Female", display_name: "Female", is_active: true, sort_order: 2 },
          { id: 3, name: "Other", display_name: "Other", is_active: true, sort_order: 3 },
          { id: 4, name: "Prefer not to say", display_name: "Prefer not to say", is_active: true, sort_order: 4 }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchGenders();
  }, []);

  // Convert to legacy format for backward compatibility
  const genderOptions = genders.map(g => g.name);

  return {
    genders,
    genderOptions,
    loading,
    error
  };
}
