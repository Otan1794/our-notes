'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      aria-label="Sign out"
      title="Sign out"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted hover:border-teal hover:text-teal"
    >
      <LogOut size={16} />
    </button>
  );
}
