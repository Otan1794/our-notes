import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { searchItems } from '@/services/search';
import { ItemCard } from '@/components/items/ItemCard';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { q } = await searchParams;
  const query = q ?? '';
  const results = query ? await searchItems(membership!.workspace_id, query) : [];

  return (
    <main className="min-h-screen bg-paper p-4 md:p-8">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-teal">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>
      <h1 className="font-display text-xl font-semibold text-ink">
        {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}