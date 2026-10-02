'use server';

import { createClient } from '@/lib/supabase/server';
import type { Item } from '@/types/item';

export async function searchItems(workspaceId: string, query: string): Promise<Item[]> {
  if (!query.trim()) return [];

  const supabase = await createClient();
  const pattern = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('items')
    .select('*, profiles(display_name), item_tags(tags(name))')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .or(`title.ilike.${pattern},description.ilike.${pattern},content.ilike.${pattern},url.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Note: this ilike approach is simple and fine at MVP scale. If the
  // workspace grows large, switch to the `items_search_idx` GIN index
  // in schema.sql with a `to_tsvector @@ plainto_tsquery` query instead.
  return (data ?? []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    categoryId: row.category_id,
    type: row.type,
    title: row.title,
    description: row.description,
    content: row.content,
    url: row.url,
    imagePath: row.image_path,
    metadata: row.metadata ?? {},
    isArchived: row.is_archived,
    isFavorite: row.is_favorite,
    createdBy: row.created_by,
    createdByName: row.profiles?.display_name ?? 'Someone',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: (row.item_tags ?? []).map((it: any) => it.tags?.name).filter(Boolean)
  }));
}
