import { FileText, Link2, Image as ImageIcon, Video, CheckSquare, File } from 'lucide-react';
import type { ItemType } from '@/types/item';

/**
 * Adding a new item type (e.g. "restaurant"):
 *   1. Add 'restaurant' to ItemType in types/item.ts
 *   2. Add a RestaurantMetadata interface there
 *   3. Add an entry below with its icon, label, and a form component
 * Nothing in the dashboard, search, or database layer needs to change.
 */
export const ITEM_TYPE_REGISTRY: Record<ItemType, { label: string; icon: typeof FileText }> = {
  note: { label: 'Note', icon: FileText },
  link: { label: 'Link', icon: Link2 },
  image: { label: 'Image', icon: ImageIcon },
  video: { label: 'Video', icon: Video },
  todo: { label: 'Task', icon: CheckSquare },
  document: { label: 'Document', icon: File }
};

export function getItemTypeIcon(type: ItemType) {
  return ITEM_TYPE_REGISTRY[type]?.icon ?? File;
}
