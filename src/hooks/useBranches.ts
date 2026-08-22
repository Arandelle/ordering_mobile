// hooks/useBranch.ts
import { apiClient } from '@/lib/apiClient';
import { Branch, BranchFormData } from '@/types/branch.type';
import { useQuery } from '@tanstack/react-query';

/**
 * Converts BranchFormData (with string coordinates) to API payload
 * Transforms location from { latitude: string, longitude: string }
 * to GeoJSON format: { type: "Point", coordinates: [lng, lat] }
 */
const formatBranchFormDataForAPI = (formData: BranchFormData) => {
  const { location, ...rest } = formData;

  const payload = {
    ...rest,
    ...(location?.latitude &&
      location?.longitude && {
        location: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(location.longitude), // GeoJSON order: [longitude, latitude]
            parseFloat(location.latitude),
          ],
        },
      }),
  };
  0;

  return payload;
};

// fetch branches
export const useBranches = () => {
  return useQuery<Branch[], Error>({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branch'),
  });
};
// Export helpers for use in components
export { formatBranchFormDataForAPI };
