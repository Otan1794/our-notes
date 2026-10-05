import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCategories } from '@/services/categories';
import { getItems } from '@/services/items';
import { getLayout } from '@/services/layouts';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { AddItemDialog } from '@/components/items/AddItemDialog';
import { AddCategoryDialog } from '@/components/categories/AddCategoryDialog';
import { SearchBar } from '@/components/search/SearchBar';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // proxy.ts normally catches signed-out visitors first; this is the safety net.
  if (!user) redirect('/login');

  // MVP assumption: one workspace per user (the shared 2-person workspace).
  // Multi-workspace switching UI is deferred; the schema already supports it.
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="max-w-sm text-sm text-muted">
          You&rsquo;re signed in, but this account isn&rsquo;t a member of a workspace yet.
        </p>
      </main>
    );
  }

  const workspaceId = membership.workspace_id as string;

  const [categories, items, layout] = await Promise.all([
    getCategories(workspaceId),
    getItems(workspaceId),
    getLayout(workspaceId)
  ]);

  return (
    <main className="min-h-dvh p-4 md:p-8">
      <header className="glass z-30 mb-6 flex flex-col gap-3 rounded-[22px] p-3 md:sticky md:top-4 md:flex-row md:items-center md:justify-between md:px-5">
        <h1 className="font-display text-2xl font-semibold text-ink">Our Space</h1>
        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end md:gap-3">
          <SearchBar workspaceId={workspaceId} />
          {categories.length > 0 && <AddCategoryDialog workspaceId={workspaceId} />}
          <AddItemDialog workspaceId={workspaceId} categories={categories} />
          <SignOutButton />
        </div>
      </header>

      <DashboardGrid workspaceId={workspaceId} categories={categories} items={items} initialLayout={layout} />
    </main>
  );
}