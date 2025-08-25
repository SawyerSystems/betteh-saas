import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useFocusAreas() {
  const { data: focusAreas = [], isLoading, error } = useQuery({
    queryKey: ['/api/focus-areas'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/focus-areas');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert focus area names to IDs
  const mapFocusAreaNamesToIds = (areaNames: string[]): number[] => {
    if (!focusAreas.length) return [];
    
    const otherIndex = areaNames.findIndex(name => name === 'Other');
    // Filter out 'Other' from the mapping process
    const namesToMap = otherIndex >= 0 ? areaNames.filter(name => name !== 'Other') : areaNames;
    
    return namesToMap.map(name => {
      // Find matching focus area
      const area = focusAreas.find((fa: any) => fa.name === name);
      return area ? area.id : null;
    }).filter(id => id !== null) as number[];
  };

  // Check if a focus area name exists in the database
  const focusAreaExists = (name: string): boolean => {
    return focusAreas.some((area: any) => area.name === name);
  };

  // Get a focus area by ID
  const getFocusAreaById = (id: number) => {
    return focusAreas.find((area: any) => area.id === id);
  };

  // Get a focus area by name
  const getFocusAreaByName = (name: string) => {
    return focusAreas.find((area: any) => area.name === name);
  };

  return {
    focusAreas,
    isLoading,
    error,
    mapFocusAreaNamesToIds,
    focusAreaExists,
    getFocusAreaById,
    getFocusAreaByName
  };
}
