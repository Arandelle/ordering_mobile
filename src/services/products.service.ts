import { APP_URL } from '@/constant';

export async function getProducts() {
  const res = await fetch(`${APP_URL}/api/products`);

  if (!res.ok) {
    throw new Error('Failed to fetch producst');
  }

  const data = await res.json();

  return data;
}
