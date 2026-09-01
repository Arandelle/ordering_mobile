import { APP_URL } from '@/constant';

export async function getProducts() {
  const url = `${APP_URL}/api/products`;
  console.log('[getProducts] →', url);

  const res = await fetch(url);
  console.log('[getProducts] ←', res.status);

  if (!res.ok) {
    const raw = await res.text();
    console.error('[getProducts] Error body:', raw.slice(0, 500));
    throw new Error('Failed to fetch products');
  }

  const data = await res.json();
  return data;
}
