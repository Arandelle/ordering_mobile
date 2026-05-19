import { APP_URL } from '@/constant';

export async function getCategories() {
  const res = await fetch(`${APP_URL}/api/categories`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}
