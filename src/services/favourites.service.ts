import { apiClient } from '@/lib/apiClient';
import { Product } from '@/types/products.type';

export interface FavouritesResponse {
  data: Product[];
}

export interface ToggleFavouriteResponse {
  message: string;
  data: { isFavourited: boolean };
}

export async function getFavourites(): Promise<FavouritesResponse> {
  return apiClient.get<FavouritesResponse>('/customer/favourites');
}

export async function toggleFavourite(productId: string): Promise<ToggleFavouriteResponse> {
  return apiClient.post<ToggleFavouriteResponse>('/customer/favourites', { productId });
}
