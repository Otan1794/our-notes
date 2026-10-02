'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface GridLayoutItem {
  i: string; // category id
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Fetches the layout row this user should see.
 * - workspace.layout_mode === 'shared'    -> the single row with user_id = null
 * - workspace.layout_mode === 'per_user'  -> this user's own row, falling back
 *   to the shared row (or category defaults) the first time they open the app
 */
export async function getLayout(workspaceId: string): Promise<GridLayoutItem[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('layout_mode')
    .eq('id', workspaceId)
    .single();
  if (wsError) throw wsError;

  let query = supabase.from('layouts').select('layout_json').eq('workspace_id', workspaceId);
  query = workspace.layout_mode === 'per_user' ? query.eq('user_id', user.id) : query.is('user_id', null);

  const { data: row, error } = await query.maybeSingle();

  if (error) throw error;
  return (row?.layout_json as GridLayoutItem[]) ?? [];
}

export async function saveLayout(workspaceId: string, layout: GridLayoutItem[]) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('layout_mode')
    .eq('id', workspaceId)
    .single();
  if (wsError) throw wsError;

  const userId = workspace.layout_mode === 'per_user' ? user.id : null;

  // Explicit find-then-write instead of upsert(onConflict): the row we need
  // to match differs (user_id IS NULL vs user_id = X), which isn't a single
  // clean onConflict target, and upsert against a plain (workspace_id,
  // user_id) constraint doesn't work reliably once user_id can be NULL —
  // see the partial unique indexes added in schema.sql.
  let existingQuery = supabase.from('layouts').select('id').eq('workspace_id', workspaceId);
  existingQuery = userId ? existingQuery.eq('user_id', userId) : existingQuery.is('user_id', null);
  const { data: existing, error: findError } = await existingQuery.maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from('layouts')
      .update({ layout_json: layout, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('layouts')
      .insert({ workspace_id: workspaceId, user_id: userId, layout_json: layout });
    if (error) throw error;
  }

  revalidatePath('/dashboard');
}

/** Lets either partner flip the workspace between shared and per-user layouts. */
export async function setLayoutMode(workspaceId: string, mode: 'shared' | 'per_user') {
  const supabase = await createClient();
  const { error } = await supabase.from('workspaces').update({ layout_mode: mode }).eq('id', workspaceId);
  if (error) throw error;
  revalidatePath('/dashboard');
}