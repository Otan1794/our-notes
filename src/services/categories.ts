'use server';

import { createClient } from '@/lib/supabase/server';
import type { Category, CreateCategoryInput } from '@/types/category';
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
