'use server';

import { createClient } from '@/lib/supabase/server';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';
import { revalidatePath } from 'next/cache';

export async function getCategories(workspaceId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapCategory);
}

export async function createCategory(input: CreateCategoryInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('categories').insert({
    workspace_id: input.workspaceId,
    name: input.name,
    icon: input.icon ?? 'folder',
    color: input.color ?? '#2C5C5F',
    created_by: user.id
  });

  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function renameCategory(categoryId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').update({ name }).eq('id', categoryId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const changes: { name?: string; icon?: string; color?: string } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error('Category name is required');
    changes.name = name.slice(0, 60);
  }
  if (input.icon !== undefined) changes.icon = input.icon.trim().slice(0, 16) || '📌';
  if (input.color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) throw new Error('Invalid colour');
    changes.color = input.color;
  }
  if (Object.keys(changes).length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from('categories').update(changes).eq('id', categoryId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
  revalidatePath('/dashboard');
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    layoutX: row.layout_x,
    layoutY: row.layout_y,
    layoutW: row.layout_w,
    layoutH: row.layout_h,
    isHidden: row.is_hidden,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}