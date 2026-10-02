import { createClient } from '@/lib/supabase/server';
import { getCategories } from '@/services/categories';
import { getItems } from '@/services/items';
import { getLayout } from '@/services/layouts';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { AddItemDialog } from '@/components/items/AddItemDialog';
import { AddCategoryDialog } from '@/components/categories/AddCategoryDialog';
import { SearchBar } from '@/components/search/SearchBar';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // MVP assumption: one workspace per user (the shared 2-person workspace).
  // Multi-workspace switching UI is deferred; the schema already supports it.
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const workspaceId = membership!.workspace_id as string;

  const [categories, items, layout] = await Promise.all([
    getCategories(workspaceId),
    getItems(workspaceId),
    getLayout(workspaceId)
  ]);

  return (
    <main className="min-h-screen bg-paper p-4 md:p-8">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Our Space</h1>
        <div className="flex flex-1 items-center gap-3 md:justify-end">
          <SearchBar workspaceId={workspaceId} />
          {categories.length > 0 && <AddCategoryDialog workspaceId={workspaceId} />}
          <AddItemDialog workspaceId={workspaceId} categories={categories} />
        </div>
      </header>

      <DashboardGrid workspaceId={workspaceId} categories={categories} items={items} initialLayout={layout} />
    </main>
  );
}