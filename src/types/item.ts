/**
 * Adding a new item type later:
 * 1. Add its string to ItemType below
 * 2. Add a metadata interface if it needs type-specific fields
 * 3. Register a renderer + form in components/items/registry.ts
 * That's it — dashboard, search, and storage don't need to change.
 */
export type ItemType = 'note' | 'link' | 'image' | 'video' | 'todo' | 'document' | 'location';

export interface NoteMetadata {
  // no extra fields yet; content column holds the body
}

export interface LinkMetadata {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  domain?: string;
}

export interface VideoMetadata {
  provider?: 'youtube' | 'instagram' | 'facebook';
  videoId?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  aspect?: 'horizontal' | 'vertical';
}

// No API key, no billing — parses Google's own public Maps share-link URL
// structure and coordinates instead of calling the Places API at all.
// Trade-off: no rating, reviews, hours, or phone number (those only exist
// behind the paid Places API) — just a name, coordinates, and a mini map.
export interface LocationMetadata {
  lat?: number;
  lng?: number;
  mapsUrl: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TodoMetadata {
  checklist: ChecklistItem[];
  dueDate?: string;
}

export type ItemMetadata = NoteMetadata | LinkMetadata | VideoMetadata | TodoMetadata | Record<string, unknown>;

export interface Item {
  id: string;
  workspaceId: string;
  categoryId: string | null;
  type: ItemType;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  imagePath: string | null;
  metadata: ItemMetadata;
  isArchived: boolean;
  isFavorite: boolean;
  createdBy: string;
  createdByName: string; // joined for display, e.g. "Added by Jonathan"
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CreateItemInput {
  workspaceId: string;
  categoryId: string | null;
  type: ItemType;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  imagePath?: string;
  metadata?: ItemMetadata;
  tagNames?: string[];
}