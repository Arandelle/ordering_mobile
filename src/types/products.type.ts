import { Category, SubCategory } from "./categories.type";

export interface IncludedItem {
  _id?: string;
  product: {
    _id: string;
    name: string;
    image: { url: string };
    price?: number | null;
  };
  quantity: number;
  label: string | null;
}

// UI-only type — lives inside the modal, never sent to API
export interface IncludedItemUI {
  product: string; // always ObjectId string in the form
  quantity: number;
  label: string | null;
  _name: string; // display only
  _price: number | null; // display only
}

export const ITEM_TYPES = {
  SOLO: "solo",
  COMBO: "combo",
  SET: "set",
};

export type ProductType = (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES];

export interface Product {
  _id: string;
  name: string;
  info: string;
  description: string;
  category: Category;
  subcategory?: SubCategory | null;
  price: number | null;
  image: {
    url: string;
    public_id?: string;
  };
  productType: ProductType;
  includedItems: IncludedItem[];
  paxCount?: number | null;
  isPopular?: boolean;
  isSignature?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductPayload {
  name: string;
  price: number | null;
  category: string; // ObjectId
  subcategory?: string | null; // ObjectId

  info?: string;
  description?: string;
  image?: string;
  imageFile?: string;
  isSignature?: boolean;
  isPopular?: boolean;
  productType: ProductType;
  paxCount?: number | null;
  includedItems?: IncludedItem[];
}
