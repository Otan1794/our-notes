'use server';

import { createClient } from '@/lib/supabase/server';
import type { ChecklistItem, CreateItemInput, Item, TodoMetadata } from '@/types/item';
import { revalidatePath } from 'next/cache';

export async function getItems(workspaceId: string): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('items')
    .select('*, profiles(display_name), item_tags(tags(name))')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapItem);
}

export async function createItem(input: CreateItemInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      workspace_id: input.workspaceId,
      category_id: input.categoryId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      content: input.content ?? null,
      url: input.url ?? null,
      image_path: input.imagePath ?? null,
      metadata: input.metadata ?? {},
      created_by: user.id
    })
    .select('id')
    .single();

  if (error) throw error;

  if (input.tagNames?.length) {
    await attachTags(input.workspaceId, item.id, input.tagNames);
  }

  revalidatePath('/dashboard');
  return item.id as string;
}

export async function updateItem(itemId: string, patch: Partial<CreateItemInput>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('items')
    .update({
      title: patch.title,
      description: patch.description,
      content: patch.content,
      url: patch.url,
      category_id: patch.categoryId,
      metadata: patch.metadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function toggleFavorite(itemId: string, isFavorite: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('items').update({ is_favorite: isFavorite }).eq('id', itemId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function archiveItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('items').update({ is_archived: true }).eq('id', itemId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

/** Flips one checklist line's done state without touching the rest of the todo's metadata. */
export async function toggleTodoItem(itemId: string, checklistItemId: string) {
  const supabase = await createClient();
  const { data: row, error: fetchError } = await supabase
    .from('items')
    .select('metadata')
    .eq('id', itemId)
    .single();
  if (fetchError) throw fetchError;

  const metadata = (row.metadata ?? {}) as TodoMetadata;
  const checklist: ChecklistItem[] = (metadata.checklist ?? []).map((line) =>
    line.id === checklistItemId ? { ...line, done: !line.done } : line
  );

  const { error } = await supabase
    .from('items')
    .update({ metadata: { ...metadata, checklist }, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

async function attachTags(workspaceId: string, itemId: string, tagNames: string[]) {
  const supabase = await createClient();

  for (const rawName of tagNames) {
    const name = rawName.trim().toLowerCase();
    if (!name) continue;

    const { data: tag, error: upsertError } = await supabase
      .from('tags')
      .upsert({ workspace_id: workspaceId, name }, { onConflict: 'workspace_id,name' })
      .select('id')
      .single();

    if (upsertError) throw upsertError;

    await supabase.from('item_tags').insert({ item_id: itemId, tag_id: tag.id });
  }
}

function mapItem(row: any): Item {
  return {
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
  };
}