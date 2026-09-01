// types.ts - TypeScript interfaces for Harrison House Menu

import { Category } from './categories.type';
import type { ActiveProductDiscountPreview, IncludedItem } from './products.type';
import type {
  OrderModifierSelection,
  OrderModifierSelectionItem,
} from './orders.type';

// Ensure our types stay in sync with orders.type.ts
const _assertSelectionItem: OrderModifierSelectionItem = {} as ModifierSelectionItem;
const _assertSelection: OrderModifierSelection = {} as ModifierSelection;
void _assertSelectionItem;
void _assertSelection;

/**
 * A selected modifier item within a combo/set order.
 * Customer controls `quantity` (e.g. ordering 2 cokes in a combo).
 */
export interface ModifierSelectionItem {
  productId: string;
  name: string;
  label: string | null;
  upgradePrice: number;
  quantity: number;
}

/**
 * A completed modifier group selection within a combo/set order.
 * Aliased as SelectedModifierItem for backward compatibility with existing imports.
 */
export interface ModifierSelection {
  groupId: string;
  groupName: string;
  isMain: boolean;
  linkedToGroupId: string | null;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  maxQty: number;
  items: ModifierSelectionItem[];
}

/** @deprecated use ModifierSelection instead */
export type SelectedModifierItem = ModifierSelection;

/**
 * Base menu item interface
 */
export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category?: {
    _id: string;
    name: string;
  };
  note?: string;
  isBestSeller?: boolean;
  image: string;
  activeProductDiscount?: ActiveProductDiscountPreview | null;
  productType?: string;
  modifierSelections?: ModifierSelection[];
}

/**
 * Cart item extends MenuItem with quantity.
 *
 * For combo/set items:
 * - `price` includes the base combo price + all upgrade prices of selected modifiers
 * - `modifierSelections` records which items the customer picked per group
 */
export interface CartItem extends MenuItem {
  quantity: number;
  /** Included items for combo/set products */
  includedItems?: IncludedItem[];
}

/**
 * Menu data structure - maps category IDs to their menu items
 */
export interface MenuData {
  [categoryId: string]: MenuItem[];
}

/**
 * Props for MenuItemCard component
 */
export interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (itemId: number) => void;
}

/**
 * Props for CartItem component
 */
export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, change: number) => void;
  onRemove: (itemId: number) => void;
}

/**
 * Props for MenuSection component (if needed)
 */
export interface MenuSectionProps {
  category: Category;
  items: MenuItem[];
  onAddToCart: (itemId: number) => void;
}

/**
 * Cart state interface
 */
export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}
